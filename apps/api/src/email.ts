import { Resend } from "resend";
import { env } from "./env.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

function assertConsoleFallbackAllowed(): void {
  // OTP codes and appointment details are sensitive — never let them leak
  // into production logs just because RESEND_API_KEY was left unconfigured.
  // Fail loudly instead of silently falling back to console.log.
  if (env.NODE_ENV === "production") {
    throw new Error(
      "RESEND_API_KEY is required in production — refusing to log email content instead",
    );
  }
}

// Resend's SDK reports a rejected send (unverified sender domain, sandbox
// recipient, bad key) in the returned `error` rather than by throwing, so
// without this every failure looked like a successful send and the mail just
// never arrived.
async function send(client: Resend, to: string, subject: string, text: string): Promise<void> {
  const { error } = await client.emails.send({ from: env.EMAIL_FROM, to, subject, text });
  if (error) {
    throw new Error(`Email provider rejected the message: ${error.message}`);
  }
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  if (!resend) {
    assertConsoleFallbackAllowed();
    console.log(`[dev email] OTP for ${to}: ${otp}`);
    return;
  }

  await send(
    resend,
    to,
    "Your sign-in code",
    `Your one-time code is ${otp}. It expires in 5 minutes.`,
  );
}

export async function sendAppointmentStatusEmail(
  to: string,
  subject: string,
  message: string,
): Promise<void> {
  if (!resend) {
    assertConsoleFallbackAllowed();
    console.log(`[dev email] To ${to} — ${subject}: ${message}`);
    return;
  }

  await send(resend, to, subject, message);
}

const INVITE_ROLE_LABELS = {
  doctor: "a doctor",
  nurse: "a nurse",
  admin: "an administrator",
} as const;

export async function sendStaffInviteEmail(
  to: string,
  role: keyof typeof INVITE_ROLE_LABELS,
): Promise<void> {
  const signInUrl = `${env.WEB_ORIGIN}/sign-in`;
  const subject = "You've been invited to Medicore";
  const message = [
    `You've been invited to join Medicore as ${INVITE_ROLE_LABELS[role]}.`,
    `To accept, sign in at ${signInUrl} with this email address (${to}). Medicore has no passwords — we'll email you a one-time code, and your access is set up the first time you sign in.`,
  ].join("\n\n");

  if (!resend) {
    assertConsoleFallbackAllowed();
    console.log(`[dev email] To ${to} — ${subject}: ${message}`);
    return;
  }

  await send(resend, to, subject, message);
}
