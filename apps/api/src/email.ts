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

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  if (!resend) {
    assertConsoleFallbackAllowed();
    console.log(`[dev email] OTP for ${to}: ${otp}`);
    return;
  }

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: "Your sign-in code",
    text: `Your one-time code is ${otp}. It expires in 5 minutes.`,
  });
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

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    text: message,
  });
}
