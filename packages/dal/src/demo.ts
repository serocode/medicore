// The demo dataset's identities, shared by the seed script
// (packages/dal/src/seed-demo.ts) and the API's GET /api/demo route so the
// sign-in page can only ever advertise accounts the seed actually creates.
//
// Everything here is fixtures for `pnpm db:seed:demo` — it carries no
// authority on its own. A demo account can still only be signed into while
// DEMO_MODE is on, which apps/api/src/env.ts refuses to allow in production.

export type DemoRole = "admin" | "doctor" | "nurse" | "patient";

export interface DemoAccount {
  /** Stable `user.id`, so re-seeding reuses the row instead of orphaning it. */
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: DemoRole;
  /** One line of context for the sign-in page's demo picker. */
  headline: string;
}

/**
 * The fixed code every demo sign-in accepts. `.test` is reserved by RFC 2606
 * and can never be a real domain, so these addresses cannot collide with a
 * real user's — and the OTP still goes through Better Auth's normal
 * verification, it is just predictable rather than emailed.
 */
export const DEMO_OTP = "000000";

export const DEMO_EMAIL_DOMAIN = "medicore.test";

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    id: "demo-admin-mendoza",
    email: `admin@${DEMO_EMAIL_DOMAIN}`,
    name: "Olivia Mendoza",
    firstName: "Olivia",
    lastName: "Mendoza",
    role: "admin",
    headline: "Clinic administrator — staff accounts, invites, and appointment stats",
  },
  {
    id: "demo-doctor-cruz",
    email: `dr.cruz@${DEMO_EMAIL_DOMAIN}`,
    name: "Dr. Alyana Cruz",
    firstName: "Alyana",
    lastName: "Cruz",
    role: "doctor",
    headline: "Family Medicine — three patients with encounters and lab work",
  },
  {
    id: "demo-doctor-uy",
    email: `dr.uy@${DEMO_EMAIL_DOMAIN}`,
    name: "Dr. Daniel Uy",
    firstName: "Daniel",
    lastName: "Uy",
    role: "doctor",
    headline: "Cardiology — a second doctor, for referrals and hand-offs",
  },
  {
    id: "demo-nurse-villanueva",
    email: `nurse@${DEMO_EMAIL_DOMAIN}`,
    name: "Jomar Villanueva",
    firstName: "Jomar",
    lastName: "Villanueva",
    role: "nurse",
    headline: "Nursing — vitals, nursing checks, and lab result uploads",
  },
  {
    id: "demo-patient-santos",
    email: `maria.santos@${DEMO_EMAIL_DOMAIN}`,
    name: "Maria Santos",
    firstName: "Maria",
    lastName: "Santos",
    role: "patient",
    headline: "Established patient — full history, upcoming appointment, reviewed labs",
  },
  {
    id: "demo-patient-delacruz",
    email: `jose.delacruz@${DEMO_EMAIL_DOMAIN}`,
    name: "Jose Dela Cruz",
    firstName: "Jose",
    lastName: "Dela Cruz",
    role: "patient",
    headline: "Patient with a pending request and a lab result waiting on review",
  },
  {
    id: "demo-patient-lim",
    email: `ana.lim@${DEMO_EMAIL_DOMAIN}`,
    name: "Ana Lim",
    firstName: "Ana",
    lastName: "Lim",
    role: "patient",
    headline: "Newly registered patient — no visits yet, empty states intact",
  },
];

export const DEMO_ACCOUNT_EMAILS: readonly string[] = DEMO_ACCOUNTS.map((account) => account.email);

export function isDemoEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${DEMO_EMAIL_DOMAIN}`);
}
