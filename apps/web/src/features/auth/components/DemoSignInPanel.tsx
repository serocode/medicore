import type { DemoAccount, DemoRole } from "@/features/auth/hooks/use-demo-mode";
import { HeartPulse, Loader2, ShieldCheck, Stethoscope, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ROLE_ORDER: DemoRole[] = ["admin", "doctor", "nurse", "patient"];

const ROLE_META: Record<DemoRole, { label: string; icon: LucideIcon }> = {
  admin: { label: "Administrator", icon: ShieldCheck },
  doctor: { label: "Doctor", icon: Stethoscope },
  nurse: { label: "Nurse", icon: HeartPulse },
  patient: { label: "Patient", icon: UserRound },
};

interface DemoSignInPanelProps {
  accounts: DemoAccount[];
  otp: string;
  /** Signs the account in end to end — request the code, then verify it. */
  onSignIn: (account: DemoAccount) => void;
  /** The account currently being signed in, if any. */
  pendingEmail: string | null;
  disabled: boolean;
}

/**
 * Only rendered when the API reports DEMO_MODE — see use-demo-mode.ts. It
 * short-circuits the two-step form rather than replacing it: the same
 * send-code and verify-code endpoints run, with the code the server publishes
 * instead of one from an inbox. The ochre treatment is deliberate — this
 * panel should never be mistaken for part of the real sign-in.
 */
export function DemoSignInPanel({
  accounts,
  otp,
  onSignIn,
  pendingEmail,
  disabled,
}: DemoSignInPanelProps) {
  const ordered = [...accounts].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role),
  );

  return (
    <section
      aria-labelledby="demo-heading"
      className="mb-8 rounded-card border border-accent-soft-dim bg-accent-soft/40 p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="demo-heading" className="text-label uppercase text-on-accent-soft">
          Demo mode
        </h2>
        <p className="text-sm text-on-accent-soft">
          Sign-in code: <span className="font-display font-semibold tracking-widest">{otp}</span>
        </p>
      </div>
      <p className="mt-1 text-sm text-on-accent-soft">
        Pick an account to sign in instantly. Every seeded account uses the code above, so you can
        also type an address into the form below.
      </p>

      <ul className="mt-3 flex flex-col gap-1.5">
        {ordered.map((entry) => {
          const { label, icon: Icon } = ROLE_META[entry.role];
          const isPending = pendingEmail === entry.email;
          return (
            <li key={entry.email}>
              <button
                type="button"
                onClick={() => onSignIn(entry)}
                disabled={disabled}
                className="flex w-full items-center gap-3 rounded-control border border-transparent bg-white/80 px-3 py-2 text-left transition-colors hover:border-accent-soft-dim hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 animate-spin text-accent motion-reduce:animate-none"
                  />
                ) : (
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {entry.name}
                    <span className="ml-2 font-normal text-ink-subtle">{label}</span>
                  </span>
                  <span className="block truncate text-xs text-ink-muted">{entry.headline}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
