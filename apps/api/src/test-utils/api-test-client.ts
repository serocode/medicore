import type { Hono } from "hono";

const TEST_ADMIN_EMAIL = "admin-test@example.com";
const TEST_DOCTOR_EMAIL = "doctor-test@example.com";
const TEST_NURSE_EMAIL = "nurse-test@example.com";

/**
 * Drives the real email-OTP sign-in flow against the app in-process (no
 * server needs to bind — `app.request` is Hono's built-in test entry point)
 * and returns a Cookie header value for the resulting session. Capturing the
 * OTP by spying on console.log mirrors exactly what the dev console-fallback
 * path already logs — no test-only auth backdoor needed in production code.
 */
async function signIn(app: Hono, email: string): Promise<string> {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  };

  try {
    await app.request("/api/auth/email-otp/send-verification-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "sign-in" }),
    });
  } finally {
    console.log = originalLog;
  }

  const line = logs.find((l) => l.includes(`OTP for ${email}`));
  const otp = line?.match(/: (\d+)\s*$/)?.[1];
  if (!otp) {
    throw new Error(
      `Could not capture OTP for ${email} from console output: ${JSON.stringify(logs)}`,
    );
  }

  const signInResponse = await app.request("/api/auth/sign-in/email-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  if (!signInResponse.ok) {
    throw new Error(
      `Sign-in failed for ${email}: ${signInResponse.status} ${await signInResponse.text()}`,
    );
  }

  const cookies = signInResponse.headers.getSetCookie();
  if (cookies.length === 0) {
    throw new Error(`Sign-in for ${email} returned no session cookie`);
  }

  return cookies.map((c) => c.split(";")[0]).join("; ");
}

export function signInAsPatient(app: Hono, email: string): Promise<string> {
  return signIn(app, email);
}

export function signInAsAdmin(app: Hono): Promise<string> {
  return signIn(app, TEST_ADMIN_EMAIL);
}

export function signInAsDoctor(app: Hono): Promise<string> {
  return signIn(app, TEST_DOCTOR_EMAIL);
}

export function signInAsNurse(app: Hono): Promise<string> {
  return signIn(app, TEST_NURSE_EMAIL);
}
