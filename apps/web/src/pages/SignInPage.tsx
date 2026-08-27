import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Field, inputClassName } from "../components/Field";
import { authClient } from "../lib/auth-client";

export function SignInPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequestOtp(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);
    const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
    setIsSubmitting(false);
    if (sendError) {
      setError(sendError.message ?? "Failed to send code");
      return;
    }
    setStep("otp");
  }

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);
    const { error: signInError } = await authClient.signIn.emailOtp({ email, otp });
    setIsSubmitting(false);
    if (signInError) {
      setError(signInError.message ?? "Invalid code");
      return;
    }
    navigate("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold text-slate-900">Sign in</h1>

        {step === "email" ? (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
            <Field label="Email" htmlFor="email" error={error}>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className={inputClassName}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Button type="submit" disabled={isSubmitting}>
              Send code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <p className="text-sm text-slate-600">We emailed a code to {email}.</p>
            <Field label="Verification code" htmlFor="otp" error={error}>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                required
                autoComplete="one-time-code"
                className={inputClassName}
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
              />
            </Field>
            <Button type="submit" disabled={isSubmitting}>
              Verify &amp; sign in
            </Button>
            <button
              type="button"
              className="text-sm text-slate-500 underline"
              onClick={() => setStep("email")}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
