import { Mail, ShieldCheck } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { Field, TextInput } from "../components/Field";
import { StatusMessage } from "../components/StatusMessage";
import { authClient } from "../lib/auth-client";

/** Must match `expiresIn` on the emailOTP plugin in apps/api/src/auth.ts. */
const OTP_VALIDITY_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_SECONDS = 30;
const PENDING_KEY = "medicore.pending-otp";

interface PendingOtp {
  email: string;
  sentAt: number;
}

// The pending code lives in sessionStorage rather than component state so the
// verification step survives a reload, a dev-server hot reload, or the user
// leaving the tab to go and find the code. Losing it stranded people on the
// email step holding a valid code they had no field to type into.
// sessionStorage throws outright in some privacy modes, so every access is
// guarded and simply degrades to the old in-memory behaviour.
function readPendingOtp(): PendingOtp | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingOtp>;
    if (typeof parsed?.email !== "string" || typeof parsed?.sentAt !== "number") return null;
    // An expired code is worse than none — restoring it would drop the user
    // on a field that can only reject them.
    if (Date.now() - parsed.sentAt > OTP_VALIDITY_MS) {
      sessionStorage.removeItem(PENDING_KEY);
      return null;
    }
    return { email: parsed.email, sentAt: parsed.sentAt };
  } catch {
    return null;
  }
}

function writePendingOtp(email: string): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ email, sentAt: Date.now() }));
  } catch {
    // Non-fatal: the step just won't survive a reload.
  }
}

function clearPendingOtp(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Non-fatal.
  }
}

export function SignInPage() {
  const navigate = useNavigate();
  // Lazy initialisers so the restore runs once, before the first paint — no
  // flash of the email step on the way to the verification step.
  const [restored] = useState(readPendingOtp);
  const [step, setStep] = useState<"email" | "otp">(restored ? "otp" : "email");
  const [email, setEmail] = useState(restored?.email ?? "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendCode(): Promise<boolean> {
    setError(undefined);
    setIsSubmitting(true);
    const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
    setIsSubmitting(false);
    if (sendError) {
      setError(sendError.message ?? "We couldn't send a code to that address. Check it and retry.");
      return false;
    }
    writePendingOtp(email);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    return true;
  }

  async function handleRequestOtp(event: FormEvent) {
    event.preventDefault();
    setNotice(undefined);
    if (await sendCode()) setStep("otp");
  }

  async function handleResend() {
    setNotice(undefined);
    setOtp("");
    if (await sendCode()) setNotice(`A new code is on its way to ${email}.`);
  }

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    setNotice(undefined);
    setIsSubmitting(true);
    const { data, error: signInError } = await authClient.signIn.emailOtp({ email, otp });
    setIsSubmitting(false);
    if (signInError) {
      setError(
        signInError.message ?? "That code didn't work. It may have expired — send a new one.",
      );
      return;
    }
    clearPendingOtp();
    const role = (data?.user as { role?: string } | undefined)?.role;
    if (role === "admin") {
      navigate("/admin");
    } else if (role === "doctor" || role === "nurse") {
      navigate("/staff/dashboard");
    } else {
      navigate("/dashboard");
    }
  }

  function useDifferentEmail() {
    clearPendingOtp();
    setStep("email");
    setOtp("");
    setError(undefined);
    setNotice(undefined);
    setCooldown(0);
  }

  return (
    <AuthLayout>
      <h1 className="text-headline-lg text-ink">Sign in</h1>
      <p className="mb-8 mt-2 text-ink-muted">
        {step === "email"
          ? "Medicore has no passwords — enter your email and we'll send you a one-time code."
          : `We sent a code to ${email}. It's valid for five minutes.`}
      </p>

      {step === "email" ? (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-5">
          <Field label="Email address" htmlFor="email" error={error} required>
            <TextInput
              id="email"
              type="email"
              icon={Mail}
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send code"}
          </Button>
          <p className="text-sm text-ink-muted">
            New patient?{" "}
            <Link
              to="/register"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Register
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
          {notice && <StatusMessage tone="success">{notice}</StatusMessage>}
          <Field label="Verification code" htmlFor="otp" error={error} required>
            <TextInput
              id="otp"
              type="text"
              icon={ShieldCheck}
              inputMode="numeric"
              maxLength={6}
              required
              autoComplete="one-time-code"
              placeholder="000000"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
            />
          </Field>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Verifying…" : "Sign in"}
          </Button>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <button
              type="button"
              onClick={handleResend}
              disabled={isSubmitting || cooldown > 0}
              className="font-semibold text-primary underline underline-offset-4 disabled:cursor-not-allowed disabled:text-ink-subtle disabled:no-underline"
            >
              {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
            </button>
            <button
              type="button"
              onClick={useDifferentEmail}
              className="text-ink-muted underline underline-offset-4 hover:text-ink"
            >
              Use a different email address
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
