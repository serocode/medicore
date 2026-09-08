import { Footer } from "@/shared/layout/Footer";
import { useSession } from "@/shared/lib/auth-client";
import { ButtonLink } from "@/shared/ui/Button";
import { Logo } from "@/shared/ui/Logo";
import {
  CalendarDays,
  ClipboardList,
  FlaskConical,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Link } from "react-router-dom";

/** What a signed-in visitor's "continue" button should point at. */
function destinationForRole(role: string | undefined): { to: string; label: string } {
  if (role === "admin") return { to: "/admin", label: "Go to dashboard" };
  if (role === "doctor" || role === "nurse")
    return { to: "/staff/dashboard", label: "Go to dashboard" };
  return { to: "/dashboard", label: "Go to my appointments" };
}

const CAPABILITIES = [
  {
    icon: CalendarDays,
    title: "Appointment booking",
    body: "Patients request a physician, a reason, and a preferred time. The clinic confirms the slot or cancels with a reason — and the patient is emailed either way.",
  },
  {
    icon: ClipboardList,
    title: "Clinical records",
    body: "Every consultation is written up as a structured encounter — chief complaint, SOAP note, diagnosis, plan — and joins one chronological patient timeline.",
  },
  {
    icon: HeartPulse,
    title: "Vital signs",
    body: "Blood pressure, heart and respiratory rate, temperature, SpO₂, weight and height, range-checked as they are entered and charted visit over visit.",
  },
  {
    icon: FlaskConical,
    title: "Laboratory workflow",
    body: "Order a test from the catalogue, attach the report and its parameter values, then have a doctor sign off an interpretation before it closes.",
  },
  {
    icon: Stethoscope,
    title: "Staff workflows",
    body: "Doctors and nurses see their own queues — patients to review, requests waiting on the lab, results waiting on a signature.",
  },
  {
    icon: ShieldCheck,
    title: "Account administration",
    body: "Administrators invite colleagues by email, set whether someone works as a nurse, doctor, or administrator, and disable accounts that should no longer sign in.",
  },
];

const JOURNEY = [
  {
    title: "Register",
    body: "Create an account with your email — no password to remember. Add your details, emergency contact, and a copy of your ID.",
  },
  {
    title: "Request an appointment",
    body: "Choose a physician and the time you'd prefer. The clinic confirms it and you get an email with the scheduled slot.",
  },
  {
    title: "Attend the consultation",
    body: "Your doctor or nurse records vitals and writes up the visit while you're there.",
  },
  {
    title: "Follow the results",
    body: "Any laboratory work ordered during the visit is tracked from request to a doctor's written interpretation.",
  },
];

export function HomePage() {
  const { data: session, isPending } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const destination = destinationForRole(role);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <a
        href="#main"
        className="skip-link absolute left-4 top-4 z-50 rounded-control bg-primary px-4 py-2 font-display text-sm font-semibold text-on-primary"
      >
        Skip to content
      </a>

      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <Link to="/" aria-label="Medicore home">
            <Logo />
          </Link>
          <nav aria-label="Account" className="flex items-center gap-2">
            {isPending ? null : session ? (
              <ButtonLink to={destination.to} size="sm">
                {destination.label}
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to="/sign-in" variant="ghost" size="sm">
                  Sign in
                </ButtonLink>
                <ButtonLink to="/register" size="sm">
                  Register
                </ButtonLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="border-b border-line bg-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-12 lg:px-8 lg:py-24">
            <div className="lg:col-span-7">
              <p className="font-display text-label uppercase text-primary">Clinic care platform</p>
              <h1 className="mt-4 text-headline-lg text-ink sm:text-display">
                Your appointments and your medical record, in one place.
              </h1>
              <p className="mt-6 max-w-xl text-body-lg text-ink-muted">
                Medicore is the system your clinic runs on. Patients book and follow their
                appointments; doctors and nurses record what happened at each visit and track the
                laboratory work that follows it — against a single patient record rather than
                scattered notes.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {session ? (
                  <ButtonLink to={destination.to} size="lg">
                    {destination.label}
                  </ButtonLink>
                ) : (
                  <>
                    <ButtonLink to="/register" size="lg">
                      Register as a patient
                    </ButtonLink>
                    <ButtonLink to="/sign-in" variant="secondary" size="lg">
                      Sign in
                    </ButtonLink>
                  </>
                )}
              </div>
              <p className="mt-4 text-sm text-ink-subtle">
                Clinic staff sign in with the same button — your access follows the role your
                administrator gave you.
              </p>
            </div>

            {/* A concrete artefact from the product, not an abstract illustration:
                the patient timeline as it actually reads. */}
            <div className="lg:col-span-5">
              <div className="rounded-card border border-line bg-surface-low p-6 shadow-ambient">
                <p className="font-display text-label uppercase text-ink-subtle">
                  One patient timeline
                </p>
                <ol className="mt-5 flex flex-col gap-5">
                  {[
                    {
                      when: "12 Mar, 09:15",
                      what: "Consultation — Dr. Silva",
                      detail: "BP 128/82 · HR 76 · Temp 36.8 °C",
                      tone: "primary" as const,
                    },
                    {
                      when: "12 Mar, 09:40",
                      what: "Complete blood count requested",
                      detail: "Sent to laboratory",
                      tone: "accent" as const,
                    },
                    {
                      when: "14 Mar, 11:02",
                      what: "Result uploaded",
                      detail: "Haemoglobin 13.4 g/dL · within range",
                      tone: "accent" as const,
                    },
                    {
                      when: "14 Mar, 16:20",
                      what: "Reviewed by Dr. Silva",
                      detail: "No action required — repeat in 6 months",
                      tone: "primary" as const,
                    },
                  ].map((entry, index, entries) => (
                    <li key={entry.when} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                            entry.tone === "primary" ? "bg-primary" : "bg-accent-soft-dim"
                          }`}
                        />
                        {index < entries.length - 1 && (
                          <span className="mt-1 w-px flex-1 bg-line" />
                        )}
                      </div>
                      <div className="min-w-0 pb-1">
                        <p className="text-caption tabular-nums text-ink-subtle">{entry.when}</p>
                        <p className="font-display text-sm font-semibold text-ink">{entry.what}</p>
                        <p className="text-sm text-ink-muted">{entry.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="mt-5 border-t border-line pt-4 text-caption text-ink-subtle">
                  Illustrative record. Medicore shows each patient only their own.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section
          aria-labelledby="capabilities"
          className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20"
        >
          <h2 id="capabilities" className="text-headline-md text-ink sm:text-headline-lg">
            What Medicore does
          </h2>
          <p className="mt-3 max-w-2xl text-ink-muted">
            Six things, done properly, for the four people who use the system: the patient, the
            nurse, the doctor, and the administrator who keeps the accounts in order.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="rounded-card border border-line bg-white p-6 shadow-ambient transition-colors hover:border-primary-soft-dim"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-control bg-primary-soft text-on-primary-soft">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-headline-sm text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works — a real sequence, so the numbering earns its place */}
        <section aria-labelledby="journey" className="border-y border-line bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <h2 id="journey" className="text-headline-md text-ink sm:text-headline-lg">
              How it works for a patient
            </h2>
            <p className="mt-3 max-w-2xl text-ink-muted">
              Four steps, in order. Each one leaves something behind in your record.
            </p>
            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {JOURNEY.map((step, index) => (
                <li key={step.title} className="border-t-2 border-primary pt-5">
                  <p className="font-display text-sm font-bold tabular-nums text-primary">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-2 text-headline-sm text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Closing action */}
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="rounded-card bg-primary px-6 py-12 text-center shadow-ambient-lg sm:px-12">
            <h2 className="text-headline-md text-on-inverse sm:text-headline-lg">
              {session ? "Pick up where you left off" : "Register once, then book in a minute"}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-soft">
              {session
                ? "Your record, appointments, and results are waiting on your dashboard."
                : "You'll need your ID and an emergency contact. Signing in afterwards only takes an emailed code — there's no password to forget."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {session ? (
                <ButtonLink
                  to={destination.to}
                  size="lg"
                  className="bg-white text-primary shadow-none hover:bg-primary-soft"
                >
                  {destination.label}
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink
                    to="/register"
                    size="lg"
                    className="bg-white text-primary shadow-none hover:bg-primary-soft"
                  >
                    Register as a patient
                  </ButtonLink>
                  <ButtonLink
                    to="/sign-in"
                    size="lg"
                    className="border border-primary-soft/70 bg-transparent text-on-inverse shadow-none hover:bg-primary-hover"
                  >
                    I already have an account
                  </ButtonLink>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
