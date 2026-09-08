# Demo mode

Runs the app with **no email round trip**: every one-time code is `000000`, and
the sign-in page grows a one-click account picker backed by a seeded dataset.

Demo mode cannot be enabled in production — `apps/api/src/env.ts` refuses to
load an environment where `DEMO_MODE=true` and `NODE_ENV=production` meet.

## Start a demo

```bash
docker compose up -d postgres   # Postgres on :5433
pnpm db:migrate
pnpm db:seed                    # doctor picklist + lab test catalog
pnpm db:seed:demo               # accounts, patients, visits, labs
pnpm dev                        # API :3000, web :5173
```

`DEMO_MODE=true` is already set in `.env`. Set it to `false` (and restart the
API) to go back to real one-time codes — with `RESEND_API_KEY` commented out
they are logged to the API console rather than emailed.

`pnpm db:seed:demo` is re-runnable: it deletes the rows it owns and rebuilds
them, so relative dates stay fresh and a demo that got poked at resets in one
command. It only ever touches demo-owned rows; real patient records and the
shared doctor/lab-catalog picklists are left alone.

## Credentials

Sign-in code for **all** of them: **`000000`**

| Role | Email | Name | What it shows |
| --- | --- | --- | --- |
| Admin | `admin@medicore.test` | Olivia Mendoza | Staff accounts, role changes, a pending invite, appointment stats |
| Doctor | `dr.cruz@medicore.test` | Dr. Alyana Cruz | Two patients with signed encounters, vitals trends, labs to review |
| Doctor | `dr.uy@medicore.test` | Dr. Daniel Uy | A second doctor — referrals and hand-offs between staff |
| Nurse | `nurse@medicore.test` | Jomar Villanueva | Vitals, nursing checks, lab report uploads |
| Patient | `maria.santos@medicore.test` | Maria Santos | Established patient: full history, upcoming visit, reviewed labs |
| Patient | `jose.delacruz@medicore.test` | Jose Dela Cruz | Pending request, a result waiting on a doctor's review |
| Patient | `ana.lim@medicore.test` | Ana Lim | Newly registered — the empty states, intact |

Any other address still works too: type it in with `000000` and you get a fresh
patient account, the same as the normal sign-up flow.

## What the seed creates

- **Appointments** across all three states — scheduled (past and upcoming),
  pending confirmation, and cancelled with a reason.
- **Encounters** — a consultation, a follow-up, and a nurse's vitals-only
  visit, each with full SOAP notes and a signing clinician.
- **Vital signs** — four sets spanning 90 days, so the trend view has a shape:
  blood pressure and weight coming down as treatment takes hold.
- **Lab results** across the whole lifecycle — requested, pending, result
  available (awaiting review), reviewed with a doctor's interpretation, and
  cancelled — with structured parameters flagged normal, abnormal, and
  critical.
- **One pending staff invite**, so the admin's staff screen isn't empty.

## How it works

- `DEMO_MODE=true` swaps Better Auth's random OTP generator for the fixed code
  (`apps/api/src/auth.ts`). Nothing else about the flow changes — the code is
  still stored, still expires in five minutes, and is still verified server
  side.
- `GET /api/demo` publishes the code and the account list. With demo mode off
  it returns `{ "enabled": false }` and nothing else.
- The web sign-in page asks that endpoint rather than reading a `VITE_` flag,
  so the panel can never advertise a code the API isn't actually using.
