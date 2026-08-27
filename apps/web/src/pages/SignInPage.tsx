import { Mail, ShieldCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { Field, TextInput } from "../components/Field";
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
    const { data, error: signInError } = await authClient.signIn.emailOtp({ email, otp });
    setIsSubmitting(false);
    if (signInError) {
      setError(signInError.message ?? "Invalid code");
      return;
    }
    const role = (data?.user as { role?: string } | undefined)?.role;
    if (role === "admin") {
      navigate("/admin");
    } else if (role === "doctor" || role === "nurse") {
      navigate("/staff/dashboard");
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <AuthLayout>
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Sign in</h1>
      <p className="mb-6 text-sm text-slate-500">
        {step === "email"
          ? "Enter your email to receive a one-time code."
          : `We emailed a code to ${email}.`}
      </p>

      {step === "email" ? (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
          <Field label="Email" htmlFor="email" error={error}>
            <TextInput
              id="email"
              type="email"
              icon={Mail}
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <Field label="Verification code" htmlFor="otp" error={error}>
            <TextInput
              id="otp"
              type="text"
              icon={ShieldCheck}
              inputMode="numeric"
              required
              autoComplete="one-time-code"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
            />
          </Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Verifying…" : "Verify & sign in"}
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
    </AuthLayout>
  );
}
