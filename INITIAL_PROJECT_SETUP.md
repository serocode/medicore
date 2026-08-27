# PROJECT INITIAL SETUP CHECKLIST

> **Reusable initial setup checklist using the project's current technology stack.**
>
> This checklist is designed to be copied into a new project and reused. The **workflow is flexible**, while the default technology choices follow the current stack:
>
> - **Frontend:** React + TypeScript + Tailwind CSS
> - **Backend:** Hono + Node.js + TypeScript
> - **Database:** PostgreSQL
> - **ORM:** Drizzle ORM
> - **Authentication:** Better Auth
> - **Monorepo:** pnpm workspaces + Turborepo
> - **Validation:** Zod
> - **Testing:** Vitest
> - **Code quality:** Biome
> - **Containerization:** Docker
> - **CI/CD:** GitHub Actions
>
> Technologies marked **optional** should only be included when the project actually needs them.

---

# 0. How to Use This Checklist

## Rules

- [ ] Treat this file as the initial setup baseline, not the application's feature roadmap.
- [ ] Reuse the structure for future projects.
- [ ] Keep the current technology stack unless there is a documented reason to change it.
- [ ] Do not add optional infrastructure without a real requirement.
- [ ] Do not implement application-specific business features during initial setup.
- [ ] Verify every setup step instead of assuming that installation means completion.
- [ ] Record important architectural decisions.
- [ ] Record known limitations as technical debt.
- [ ] Keep this checklist updated as the project evolves.

## Optional Components

The following are enabled only when required:

- [x] Better Auth / authentication — patients, doctors, and admins each need distinct accounts
- [ ] Organization/multi-tenancy
- [ ] Redis
- [ ] BullMQ
- [ ] CLI
- [ ] SDK
- [x] External email provider — OTP delivery (sign-in/verification) and appointment confirmation/cancellation notifications (e.g. Resend)
- [ ] External payment provider
- [ ] External SMS provider — not used; replaced by email OTP + email notifications (see Engineering Decision #12)
- [x] File storage provider — patient ID document uploads (e.g. S3-compatible bucket, or local disk for dev)
- [ ] KMS/encryption infrastructure
- [ ] Frontend component testing
- [ ] E2E/browser testing

---

# 1. Project Discovery

Before writing application code, establish what the project actually needs.

## Project Information

- [ ] Project name
- [ ] Project purpose
- [ ] Target users
- [ ] Primary business/domain requirements
- [ ] Core workflows
- [ ] Expected deployment environment
- [ ] Expected scale
- [ ] Required integrations
- [ ] Security requirements
- [ ] Data sensitivity requirements

> **Reference:** Feature/domain scope is modeled on [adrianhajdin/healthcare](https://github.com/adrianhajdin/healthcare)
> (a patient registration + appointment scheduling app). That repo uses Next.js, Appwrite, and
> Twilio — per the Technology Decision Rules above, **this project keeps the current stack**
> (React + Vite, Hono, PostgreSQL + Drizzle, Better Auth) and reimplements the same domain on top
> of it rather than adopting the reference repo's stack.

### Project Definition

```text
Project: Patient appointment management platform
Purpose: Let patients register and book appointments with doctors, and let admin
         staff review, confirm, schedule, and cancel those appointments.
Target users: Patients (public-facing registration/booking), clinic admin staff
              (appointment management/dashboard). No separate doctor login in v1 —
              doctors are a selectable resource on appointments, matching the
              reference app.
Core workflow:
  1. Patient registers (account via email OTP — no passwords — plus personal/
     medical intake: birth date, gender, address, occupation, emergency contact,
     primary physician, insurance, allergies/medications/medical history, ID
     document upload, consent).
  2. Patient signs in by requesting a one-time code emailed to their address
     (Better Auth `emailOTP` plugin) instead of a password.
  3. Patient books an appointment (choose physician, reason, preferred schedule).
  4. Admin reviews pending appointments and confirms/schedules or cancels them
     (with a cancellation reason).
  5. Patient receives an email notification when their appointment is
     confirmed/scheduled or cancelled.
  6. Admin dashboard shows appointment counts by status (scheduled/pending/cancelled).
Deployment: Docker Compose (API + Postgres) behind a reverse proxy; static frontend build.
Expected scale: Single clinic / low-to-moderate traffic — no multi-tenancy needed initially.
Required integrations: Email provider (OTP delivery + appointment notifications),
                        file storage (ID document uploads).
Special constraints: Patient medical/identity data is sensitive — restrict admin
                      routes, avoid logging PII, and treat data-sensitivity
                      requirements as a security requirement, not an afterthought.
```

## Initial Scope

- [ ] Identify what belongs in the initial setup.
- [ ] Identify what belongs in application feature development.
- [ ] Identify optional infrastructure.
- [ ] Identify features that should explicitly remain out of scope.

> **Rule:** Initial setup should establish a reliable foundation. It should not become a disguised feature-development phase.

---

# 1a. Execution Phases (Roadmap to Production)

> Sequences the sections below into gated phases so "complete and production-ready"
> has a concrete definition instead of a single open-ended "Project Discovery"
> tracker. A phase should not start until the previous phase's exit criteria are met.
> Update Section 32 (Next Actions) as phases advance.

| Phase | Name | Covers | Done when |
|---:|---|---|---|
| 0 | Discovery | Sections 1–2 | Project definition, scope, and technology decisions are recorded and accepted. |
| 1 | Repository & Monorepo Scaffold | Sections 3–5 | Fresh clone installs, typechecks, and lints from a clean checkout. |
| 2 | Backend & Database Foundation | Sections 7–9 | API starts, `/health` and `/ready` pass, migrations run against an empty database. |
| 3 | Authentication (Email OTP) | Section 10 | Sign-up/sign-in via emailed OTP works end-to-end; protected endpoints reject unauthenticated requests. |
| 4 | Frontend Foundation | Sections 13–15 | Web app starts, calls the API through a central client, routing/base styling verified. |
| 5 | Domain Features — Patient / Doctor / Appointment | New application/domain code (not yet in this checklist) | Registration intake, appointment booking, and admin review/confirm/cancel workflows work end-to-end. |
| 6 | Notifications & File Storage | Optional Components (email, file storage) | Appointment status emails send on confirm/cancel; ID document upload/download works. |
| 7 | Authorization & Roles | Section 11 | Patient vs. admin permissions enforced server-side; cross-role access denied and tested. |
| 8 | Security Hardening | Section 22 | Dependency audit clean, security headers/rate limiting/CORS reviewed, no sensitive data in logs. |
| 9 | Testing | Sections 23–24 | Domain/application/API tests pass; test database isolated from development data. |
| 10 | Docker & CI/CD | Sections 25–26 | Docker image builds and runs; CI pipeline green on a real GitHub Actions run. |
| 11 | Documentation | Section 27 | README + deployment docs reflect the actual implementation. |
| 12 | Production Launch Verification | Sections 30–31 | Every checklist item in Section 30 is implemented, configured, tested, and documented — not just present. |

---

# 2. Technology Baseline

Use the current stack as the default.

| Area | Current Technology | Use |
|---|---|---|
| Language | TypeScript | Application language |
| Frontend | React | Web UI |
| Frontend build | Vite | Frontend development/build |
| Styling | Tailwind CSS | UI styling |
| Backend | Hono | HTTP API |
| Runtime | Node.js | Backend runtime |
| Database | PostgreSQL | Persistent relational data |
| ORM | Drizzle ORM | Database access/schema |
| Validation | Zod | Request/data validation |
| Authentication | Better Auth | Authentication |
| Monorepo | pnpm workspaces | Workspace/package management |
| Build orchestration | Turborepo | Build/test/task orchestration |
| Testing | Vitest | Unit/integration testing |
| Code quality | Biome | Formatting/linting |
| Containers | Docker | Reproducible environments |
| CI | GitHub Actions | Continuous integration |

## Technology Decision Rules

- [ ] Use the current stack by default.
- [ ] Do not replace a technology without a documented reason.
- [ ] Do not introduce a second tool that solves the same problem without justification.
- [ ] Keep dependency versions consistent across workspaces.
- [ ] Commit the lockfile.
- [ ] Prefer simple configuration over unnecessary abstractions.
- [ ] Add optional technologies only when the project requires them.

---

# 3. Repository Initialization

## Git

- [ ] Initialize Git.
- [ ] Create initial branch.
- [ ] Configure `.gitignore`.
- [ ] Confirm generated files and secrets are ignored.
- [ ] Create initial repository commit when appropriate.

## Monorepo

Use pnpm workspaces + Turborepo as the default project structure.

- [ ] Create `package.json`.
- [ ] Create `pnpm-workspace.yaml`.
- [ ] Create `turbo.json`.
- [ ] Create `apps/`.
- [ ] Create `packages/`.
- [ ] Configure workspace scripts.
- [ ] Commit `pnpm-lock.yaml`.

### Recommended Structure

```text
project/
├── apps/
│   ├── api/
│   └── web/
├── packages/
│   ├── domain/
│   ├── application/
│   ├── dal/
│   ├── config/
│   └── sdk/              # optional
├── .github/
│   └── workflows/
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── tsconfig.json
├── biome.json
├── README.md
├── DEPLOYMENT.md
└── PROJECT-CHECKLIST.md
```

> If a project genuinely does not need a frontend, SDK, CLI, or another package, do not create an empty package simply to follow the structure.

---

# 4. TypeScript Configuration

## Root Configuration

- [ ] Configure TypeScript.
- [ ] Enable strict mode.
- [ ] Configure ESM consistently.
- [ ] Configure project references where useful.
- [ ] Establish shared compiler settings.
- [ ] Avoid duplicated TypeScript configuration where a shared configuration is sufficient.

## Workspace Configuration

- [ ] API has its own TypeScript configuration.
- [ ] Web has its own TypeScript configuration.
- [ ] Shared packages have appropriate configurations.
- [ ] Build output is excluded from source analysis where appropriate.
- [ ] Generated files are handled consistently.

## Verification

- [ ] `typecheck` script exists.
- [ ] Every workspace can typecheck.
- [ ] Root typecheck runs correctly through Turborepo.
- [ ] Typecheck succeeds from a clean checkout.

---

# 5. Code Quality

## Biome

- [ ] Install/configure Biome.
- [ ] Configure formatting.
- [ ] Configure linting.
- [ ] Establish consistent rules.
- [ ] Configure editor integration.
- [ ] Document intentional rule exceptions.

## Pre-commit Hooks

- [x] Husky installed (`prepare` script, `.husky/pre-commit`).
- [x] lint-staged configured to run `biome check --write` on staged
      `js/jsx/ts/tsx/json/jsonc` files.
- [x] Verified: a badly formatted staged file is auto-fixed and re-staged
      by the pre-commit hook before commit.

## Standards

- [ ] Naming conventions established.
- [ ] File naming conventions established.
- [ ] Import conventions established.
- [ ] Error-handling conventions established.
- [ ] Async/error conventions established.
- [ ] Environment-variable conventions established.

## Verification

- [ ] `lint` script exists.
- [ ] Formatting check exists.
- [ ] Entire repository passes Biome.
- [ ] CI runs code-quality checks.

---

# 6. Application Architecture

Use the following architecture as the default, but adapt it to the actual project.

```text
apps/web
    │
    │ HTTP
    ▼
apps/api
    │
    ▼
packages/application
    │
    ▼
packages/domain
    ▲
    │ implemented by
packages/dal
    │
    ▼
PostgreSQL
```

## Layer Responsibilities

### `apps/web`

- [ ] UI
- [ ] Routing
- [ ] Client-side state
- [ ] API consumption
- [ ] Form handling
- [ ] Presentation concerns

### `apps/api`

- [ ] HTTP routes
- [ ] Middleware
- [ ] Authentication integration
- [ ] Request validation
- [ ] HTTP error mapping
- [ ] API composition

### `packages/application`

- [ ] Commands
- [ ] Queries
- [ ] Application workflows
- [ ] Use-case coordination
- [ ] Application-level errors

### `packages/domain`

- [ ] Business rules
- [ ] Aggregates
- [ ] Value objects
- [ ] Domain events
- [ ] Domain errors
- [ ] Repository interfaces where appropriate

### `packages/dal`

- [ ] Drizzle schema
- [ ] Database connection
- [ ] Repository implementations
- [ ] Database-specific queries
- [ ] Database migrations

## Architecture Rules

- [ ] Domain does not depend on Hono.
- [ ] Domain does not depend on React.
- [ ] Domain does not depend directly on Drizzle.
- [ ] Route handlers remain thin.
- [ ] Business logic does not live inside HTTP routes.
- [ ] Database details remain inside the DAL.
- [ ] Application workflows coordinate domain operations.
- [ ] Avoid abstractions that do not solve a real problem.

---

# 7. Backend Initial Setup — Hono + Node.js

## API Application

- [ ] Create `apps/api`.
- [ ] Install Hono.
- [ ] Configure Node.js runtime.
- [ ] Create application entry point.
- [ ] Configure `serve()`.
- [ ] Configure graceful shutdown.
- [ ] Configure environment loading.
- [ ] Configure application-level error handling.

## Basic Endpoints

- [ ] Add `/health`.
- [ ] Add `/ready` when dependency readiness is required.
- [ ] Return predictable response structures.
- [ ] Do not expose internal implementation details.

### Health Semantics

`/health`:

- [ ] Confirms the process is alive.

`/ready`:

- [ ] Confirms required dependencies are available.
- [ ] Checks database when required.
- [ ] Checks other mandatory infrastructure when required.

## Middleware

Add only what the project requires.

- [ ] CORS
- [ ] Authentication
- [ ] Authorization
- [ ] Security headers
- [ ] Request logging
- [ ] Rate limiting
- [ ] Audit logging

## Verification

- [ ] API starts locally.
- [ ] `/health` works.
- [ ] `/ready` works when implemented.
- [ ] Unexpected errors produce controlled responses.
- [ ] No secrets appear in responses or logs.

---

# 8. Database Initial Setup — PostgreSQL + Drizzle

> Enable this section for projects requiring relational persistence.

## PostgreSQL

- [ ] Add PostgreSQL.
- [ ] Configure local development database.
- [ ] Configure `DATABASE_URL`.
- [ ] Add database healthcheck.
- [ ] Verify connection from API.
- [ ] Document database startup.

## Drizzle

- [ ] Install Drizzle ORM.
- [ ] Install Drizzle Kit.
- [ ] Create schema directory.
- [ ] Create database client.
- [ ] Configure Drizzle.
- [ ] Define initial schema only when application requirements are known.

## Schema Rules

- [ ] Primary keys are defined intentionally.
- [ ] Foreign keys are defined intentionally.
- [ ] Indexes are added for real query requirements.
- [ ] Unique constraints are explicit.
- [ ] Cascade behavior is deliberate.
- [ ] Sensitive fields are not accidentally exposed.
- [ ] Tenant/organization ownership is represented where required.

## Migrations

- [ ] Configure migration generation.
- [ ] Configure migration execution.
- [ ] Generate migration files.
- [ ] Commit migration files.
- [ ] Document migration workflow.
- [ ] Treat schema push as development-only where applicable.
- [ ] Verify migrations against an empty database.
- [ ] Verify migrations are repeatable/no-op when already applied.

---

# 9. Data Access Layer

## Repository Design

- [ ] Identify resources requiring persistence.
- [ ] Define repository interfaces only where they provide meaningful separation.
- [ ] Implement repositories in `packages/dal`.
- [ ] Keep database queries inside the DAL.
- [ ] Scope tenant-owned data correctly.
- [ ] Avoid returning unnecessary columns.
- [ ] Translate database errors into application/domain errors.

## Testing

- [ ] Create dedicated test database.
- [ ] Never run destructive integration tests against development data.
- [ ] Test CRUD behavior.
- [ ] Test unique constraints.
- [ ] Test foreign-key constraints.
- [ ] Test cascade behavior.
- [ ] Test tenant isolation.

---

# 10. Authentication — Better Auth

> Enable when the project requires user authentication.

## Better Auth

- [ ] Install/configure Better Auth.
- [ ] Configure database adapter.
- [ ] Configure authentication methods.
- [ ] Configure authentication secret.
- [ ] Configure trusted origins.
- [ ] Configure session behavior.
- [ ] Configure email verification if required.
- [ ] Configure password reset if required.

## Environment

- [ ] `BETTER_AUTH_SECRET` documented.
- [ ] Production secret generation documented.
- [ ] Secret is not committed.
- [ ] Required authentication configuration fails loudly when missing.

## Verification

- [ ] Signup works.
- [ ] Login works.
- [ ] Logout works.
- [ ] Session retrieval works.
- [ ] Protected endpoint rejects unauthenticated users.
- [ ] Authentication errors do not expose sensitive information.

---

# 11. Authorization & Organizations

> Enable only when the application has protected resources, roles, or organizations.

## Organization Model

- [ ] Define organization ownership.
- [ ] Define membership.
- [ ] Define roles.
- [ ] Define permissions.
- [ ] Define resource ownership.

## Authorization

- [ ] Authentication occurs before authorization.
- [ ] Permissions are enforced server-side.
- [ ] Frontend permission checks are treated as UX only.
- [ ] Client-supplied organization IDs are never blindly trusted.
- [ ] Organization identity is derived from trusted authentication/session context.
- [ ] Cross-organization access is denied.
- [ ] Sensitive actions have explicit permissions.

## Verification

- [ ] Owner access tested.
- [ ] Admin access tested.
- [ ] Member access tested.
- [ ] Unauthorized action tested.
- [ ] Cross-organization access tested.
- [ ] Resource existence leakage reviewed.

---

# 12. Validation — Zod

## API Validation

- [ ] Install/configure Zod.
- [ ] Define request schemas.
- [ ] Validate body/query/path parameters.
- [ ] Validate environment configuration where useful.
- [ ] Return consistent validation errors.

## Validation Rules

- [ ] HTTP input validation happens at the boundary.
- [ ] Domain invariants remain enforced by the domain.
- [ ] Do not rely solely on frontend validation.
- [ ] Do not duplicate complex business rules unnecessarily.

---

# 13. Frontend Initial Setup — React + Vite

> Enable for projects requiring a web frontend.

## React

- [ ] Create `apps/web`.
- [ ] Configure React.
- [ ] Configure Vite.
- [ ] Configure TypeScript.
- [ ] Configure React Router when routing is required.
- [ ] Configure environment variables.
- [ ] Establish application entry point.

## API Client

- [ ] Create centralized API client.
- [ ] Configure API base URL.
- [ ] Configure authentication credentials/cookies.
- [ ] Create consistent API error handling.
- [ ] Avoid scattering raw `fetch()` calls throughout components.

## Routing

- [ ] Public routes defined.
- [ ] Protected routes defined when required.
- [ ] Not-found route defined.
- [ ] Authentication redirects defined when required.

---

# 14. Frontend UI Foundation — Tailwind CSS

## Styling

- [ ] Configure Tailwind CSS.
- [ ] Define project typography.
- [ ] Define spacing conventions.
- [ ] Define theme/design tokens.
- [ ] Define responsive breakpoints.
- [ ] Avoid duplicating arbitrary styles unnecessarily.

## Reusable Components

Create only components that are genuinely reusable.

- [ ] Button
- [ ] Input
- [ ] Label
- [ ] Form
- [ ] Dialog
- [ ] Table
- [ ] Dropdown/menu
- [ ] Loading state
- [ ] Empty state
- [ ] Error state
- [ ] Navigation

## Accessibility

- [ ] Every form field has an accessible label.
- [ ] Validation messages are associated with inputs.
- [ ] Icon-only controls have accessible names.
- [ ] Keyboard navigation works.
- [ ] Focus behavior is considered.
- [ ] Destructive actions require confirmation.
- [ ] Hover is not the only way to discover an action.
- [ ] Mobile layout is usable.

---

# 15. Forms

> Use `react-hook-form` + Zod when forms become sufficiently complex.

- [ ] Configure react-hook-form where appropriate.
- [ ] Connect Zod validation.
- [ ] Establish reusable form patterns.
- [ ] Show field-level validation errors.
- [ ] Show form-level errors.
- [ ] Prevent duplicate submissions.
- [ ] Handle loading state.
- [ ] Handle server-side validation errors.
- [ ] Verify keyboard accessibility.

---

# 16. Optional Redis

> Do not add Redis unless the application needs it.

Potential uses:

- [ ] Caching
- [ ] Rate limiting
- [ ] Temporary state
- [ ] Queue infrastructure
- [ ] Distributed coordination

If enabled:

- [ ] Add Redis to local infrastructure.
- [ ] Configure environment variables.
- [ ] Add healthcheck.
- [ ] Define failure behavior.
- [ ] Document whether Redis is required for application startup.
- [ ] Test behavior when Redis is unavailable.

---

# 17. Optional BullMQ

> Use only when asynchronous/background jobs are required.

- [ ] Define job use cases.
- [ ] Add BullMQ.
- [ ] Configure Redis.
- [ ] Create queue(s).
- [ ] Create worker(s).
- [ ] Define retry strategy.
- [ ] Define failure/dead-letter behavior.
- [ ] Prevent duplicate processing where required.
- [ ] Add job monitoring/logging.
- [ ] Test worker behavior.

---

# 18. Optional SDK

> Add when other applications need programmatic access to the API.

- [ ] Create SDK package.
- [ ] Define typed API methods.
- [ ] Define authentication mechanism.
- [ ] Define error handling.
- [ ] Avoid exposing secrets.
- [ ] Test SDK independently.
- [ ] Build SDK before API consumers depend on it.

---

# 19. Optional CLI

> Add only when command-line workflows provide meaningful value.

- [ ] Create CLI package.
- [ ] Configure Commander.
- [ ] Define commands.
- [ ] Define authentication.
- [ ] Secure local credential storage.
- [ ] Define human-readable errors.
- [ ] Define exit codes.
- [ ] Test command behavior.

---

# 20. Environment Configuration

## Files

- [ ] `.env.example` exists.
- [ ] Local `.env` is ignored.
- [ ] Production secrets are stored outside Git.
- [ ] Required variables are documented.
- [ ] Public frontend variables are clearly distinguished from server-only secrets.

## Configuration Categories

```text
Application
Database
Authentication
External services
Email
Payments
Infrastructure
Logging
Deployment
```

## Rules

- [ ] Never commit real credentials.
- [ ] Never place server secrets in frontend-exposed variables.
- [ ] Validate required environment variables.
- [ ] Document where production values come from.
- [ ] Document secret rotation.

---

# 21. Logging & Observability

## Structured Logging

- [ ] Configure structured logging.
- [ ] Include useful request metadata.
- [ ] Include errors and stack traces server-side.
- [ ] Avoid sensitive data.

## Never Log

- [ ] Passwords
- [ ] Authentication tokens
- [ ] Session cookies
- [ ] API keys
- [ ] Private encryption keys
- [ ] Decrypted secrets
- [ ] Sensitive personal information unless explicitly required

## Health

- [ ] `/health` implemented.
- [ ] `/ready` implemented when appropriate.
- [ ] Logs identify startup/shutdown.
- [ ] Logs identify unexpected infrastructure failures.

---

# 22. Security Baseline

## Dependencies

- [ ] Dependency audit configured.
- [ ] High-severity vulnerabilities reviewed.
- [ ] Unused dependencies removed.
- [ ] Dependency versions kept consistent.

## Application

- [ ] Input validation implemented.
- [ ] Authentication reviewed.
- [ ] Authorization reviewed.
- [ ] CORS reviewed.
- [ ] Security headers reviewed.
- [ ] Rate limiting evaluated.
- [ ] Sensitive logs reviewed.
- [ ] Error responses reviewed.
- [ ] File upload security reviewed if applicable.
- [ ] Webhook security reviewed if applicable.

## Secrets

- [ ] Secrets excluded from Git.
- [ ] Secret management strategy documented.
- [ ] Production credentials separated from development credentials.
- [ ] Rotation procedure documented.

---

# 23. Testing Setup — Vitest

## Test Infrastructure

- [ ] Install/configure Vitest.
- [ ] Configure test scripts.
- [ ] Configure coverage if required.
- [ ] Configure test environment.
- [ ] Configure separate test database for integration tests.

## Domain Tests

- [ ] Test business rules.
- [ ] Test validation.
- [ ] Test domain errors.
- [ ] Keep tests independent from infrastructure.

## Application Tests

- [ ] Test commands.
- [ ] Test queries.
- [ ] Test authorization behavior.
- [ ] Test application errors.

## Database Integration Tests

- [ ] Use PostgreSQL test database.
- [ ] Never use normal development database.
- [ ] Test real repository behavior.
- [ ] Test constraints.
- [ ] Test migrations.

## API Tests

- [ ] Test success responses.
- [ ] Test validation failures.
- [ ] Test authentication.
- [ ] Test authorization.
- [ ] Test not-found behavior.
- [ ] Test conflict behavior.
- [ ] Test unexpected errors.

## Frontend Tests

> Add React Testing Library/jsdom when UI complexity justifies component-level tests.

- [ ] Configure frontend test environment.
- [ ] Test important components.
- [ ] Test forms.
- [ ] Test loading/error/empty states.
- [ ] Test destructive confirmations.
- [ ] Test accessibility-sensitive interactions.

---

# 24. Testing Isolation

This is a required safety rule.

- [ ] Development database is separate from test database.
- [ ] Integration tests cannot truncate development data.
- [ ] Each package that requires isolated database state has an appropriate test database strategy.
- [ ] CI uses isolated databases.
- [ ] Test data is disposable.
- [ ] Test cleanup is safe.
- [ ] Verify repeated test runs do not affect development data.

> **Rule:** A test that can destroy real development data is considered a setup defect even if the test itself passes.

---

# 25. Docker

## Docker Compose

Add only the services required by the project.

- [ ] PostgreSQL
- [ ] Redis, if required
- [ ] Other dependencies, if required

## Dockerfile

- [ ] Create API Dockerfile.
- [ ] Use multi-stage build where appropriate.
- [ ] Install dependencies reproducibly.
- [ ] Build required workspace packages.
- [ ] Copy all required workspace dependencies.
- [ ] Run production build.
- [ ] Use appropriate runtime image.
- [ ] Do not include unnecessary development dependencies.

## Verification

- [ ] Docker image builds from a clean state.
- [ ] Container starts.
- [ ] Application health endpoint works.
- [ ] Required services are reachable.
- [ ] No local-only paths are required inside the image.

---

# 26. CI — GitHub Actions

## Pipeline

- [ ] Install dependencies using lockfile.
- [ ] Run formatting/linting.
- [ ] Run typecheck.
- [ ] Run tests.
- [ ] Run build.
- [ ] Run security checks.
- [ ] Build Docker image when applicable.

## Integration Infrastructure

When tests require services:

- [ ] Start PostgreSQL.
- [ ] Start Redis if required.
- [ ] Create isolated test databases.
- [ ] Configure test environment variables.
- [ ] Never use production credentials.

## Verification

- [ ] Push to GitHub.
- [ ] Watch the actual CI run.
- [ ] Fix failures discovered only in clean CI environments.
- [ ] Confirm at least one complete green run.

> **Rule:** A CI configuration is not considered verified merely because the YAML is syntactically valid.

---

# 27. Documentation

## README

- [ ] Project purpose.
- [ ] Technology stack.
- [ ] Requirements/prerequisites.
- [ ] Installation.
- [ ] Environment setup.
- [ ] Development commands.
- [ ] Testing.
- [ ] Build.
- [ ] Deployment reference.

## Development Documentation

- [ ] Architecture overview.
- [ ] Repository structure.
- [ ] Database setup.
- [ ] Migration workflow.
- [ ] Authentication setup.
- [ ] External services.
- [ ] Troubleshooting.

## Deployment Documentation

- [ ] Production prerequisites.
- [ ] Environment variables.
- [ ] Secret provisioning.
- [ ] Database migration procedure.
- [ ] Deployment procedure.
- [ ] Health checks.
- [ ] Rollback procedure.
- [ ] Backup/restore procedure.

---

# 28. Engineering Decisions

Record decisions that future developers may question.

| # | Decision | Reason | Alternatives Considered | Status |
|---:|---|---|---|---|
| 1 | TypeScript | Current project standard | Other language | Accepted |
| 2 | React | Current frontend standard | Other frontend framework | Accepted |
| 3 | Hono | Current API standard | Other Node frameworks | Accepted |
| 4 | PostgreSQL | Current relational DB standard | Other databases | Accepted |
| 5 | Drizzle | Current data-access standard | Other ORMs | Accepted |
| 6 | Better Auth | Current authentication standard | Other auth systems | Accepted |
| 7 | pnpm + Turborepo | Current monorepo standard | Other workspace tools | Accepted |
| 8 | Vitest | Current testing standard | Other test runners | Accepted |
| 9 | Biome | Current code-quality standard | ESLint/Prettier | Accepted |
| 10 | Docker | Reproducible environments | Native setup | Accepted |

Add project-specific decisions below.

| 11 | Reimplement adrianhajdin/healthcare's feature set on the current stack instead of adopting Next.js + Appwrite + Twilio | Consistency with Technology Decision Rules; avoid running two unrelated stacks | Fork/port the reference repo as-is | Accepted |
| 12 | Email OTP (Better Auth `emailOTP` plugin) via Resend, replacing SMS entirely | Avoids a second external notification provider; Better Auth has first-class OTP support; one provider (email) covers both auth and appointment notifications. Dev fallback logs the OTP to console when `RESEND_API_KEY` is unset. | Twilio/Semaphore SMS OTP, password-based auth, magic links | Accepted |
| 13 | File storage: local disk behind a `FileStorage` interface (`apps/api/src/lib/file-storage.ts`) | No external account needed to get Phase 5 running end-to-end; swapping in an S3-compatible provider later is a one-file change behind the same interface | S3-compatible bucket, local disk with no abstraction | Accepted |
| 15 | Husky + lint-staged pre-commit hook (`biome check --write` on staged files) | Catch formatting/lint issues before they reach CI or a reviewer | CI-only enforcement, no pre-commit hook | Accepted |
| 16 | Bundle `apps/api` with tsup (`noExternal` for all workspace packages) rather than a plain `tsc` build | Ships a single self-contained artifact; avoids the runtime needing pre-built workspace packages in the Docker image | Plain `tsc` build + copy `node_modules` | Accepted |
| 17 | `packages/dal`'s own `db:generate` runs `tsc` first and points drizzle-kit at compiled `dist/`, not `src/` | drizzle-kit's config loader uses a plain Node `require` internally and can't resolve NodeNext-style `.js` specifiers back to sibling `.ts` files when schema files import each other (patient → doctor/user, appointment → doctor/patient) | Non-NodeNext resolution for the whole package (broke apps/api's typecheck, which pulls in dal's source directly) | Accepted |
| 14 | Bundle `apps/api` with tsup, inlining `@healthcare/dal` source (`noExternal`) instead of a separate `tsc` build step | Keeps the Docker runtime image from depending on a pre-built DAL package; verified end-to-end in Docker. Runtime `node_modules` still required in the image for true external deps (hono, better-auth, resend, zod) — pnpm links those into `apps/api/node_modules`, so the Dockerfile copies build output to `apps/api/dist` (not a top-level `dist`) so Node's module resolution finds them. | Plain `tsc` build + copy full `node_modules`; a single fully-bundled executable | Accepted |
| 18 | Test database: a separate `healthcare_test` database inside the same dev Postgres instance (not a second container) | Postgres enforces real isolation between databases in one instance — satisfies Section 24 without extra infra. `packages/dal/src/test-utils/test-db.ts` creates it and runs migrations if missing. | Second `docker-compose` service; `testcontainers`-style ephemeral containers per run | Accepted |
| 19 | API integration tests sign in through the real email-OTP flow (capturing the OTP from the same console-fallback log path production dev already uses) rather than mocking auth | Tests the real Better Auth integration; avoids adding a test-only auth backdoor to production code, which the project's own rules reject | A test-only header/bypass for auth; mocking `auth.api.getSession` | Accepted |
| 20 | API tests call `app.request()` directly (Hono's in-process test entry point) instead of binding a real port | Every port-conflict issue this session hit was from binding real servers; in-process requests need no port at all | `@hono/node-server` + real HTTP requests in tests | Accepted |
| 21 | Vitest config for `apps/api`/`packages/dal` can't `import` `@healthcare/dal`'s test helpers with a NodeNext-style `.js` specifier — Vite's config loader hits the same class of resolution issue as Engineering Decision #17. `apps/api/vitest.config.ts` duplicates the `TEST_DATABASE_URL` default/env-override instead. | Keeps the rest of the codebase on consistent NodeNext resolution rather than special-casing another package | Switch `packages/dal` to bundler resolution (already tried and reverted once — breaks `apps/api`'s typecheck, see Decision #17) | Accepted |
| 22 | Upgraded `drizzle-orm` 0.38→0.45 and `drizzle-kit` 0.30→0.31 | `pnpm audit` found a high-severity SQL-injection advisory (GHSA-gpj5-g38j-94v9, improperly escaped SQL identifiers) in drizzle-orm <0.45.2, and it's a production runtime dependency, not just a dev tool. Full test suite re-run clean after the upgrade — no breaking changes hit our usage. | Pin to the vulnerable version and accept the risk; wait for a project-specific patch release | Accepted |
| 23 | `hono/secure-headers` added globally | Standard security headers (HSTS, X-Content-Type-Options, X-Frame-Options, etc.) at near-zero cost; verified live (curl against a running instance) | Hand-roll individual header middleware; skip since this is "just an API" | Accepted |
| 24 | Rate limiting via Better Auth's built-in `rateLimit.customRules` on the two OTP endpoints (3/min send, 5/min verify) rather than a custom middleware or Redis-backed limiter | Built into the auth library already in use; in-memory storage is fine at this app's scale (single clinic); defaults to production-only so it never interferes with dev/tests. Verified live: 4th rapid request in a minute returns 429. | Custom Hono middleware; Redis-backed limiter (explicitly out of scope per Section 0 unless needed) | Accepted |
| 25 | `apps/api/src/email.ts`'s console-fallback now throws instead of logging when `NODE_ENV === "production"` | `pnpm audit`-adjacent manual review found that a misconfigured production deploy (missing `RESEND_API_KEY`) would otherwise silently leak OTP codes and appointment details into server logs — a real credential-leakage path. Verified live: in a production-mode run, the OTP never appeared in logs, only a generic error (Better Auth sends OTP emails as an unawaited background task, so the client still gets `{success:true}` even though the send failed — a pre-existing Better Auth behavior, not something this fix changes, and worth knowing operationally). | Leave the fallback unconditional (the pre-existing behavior); require the key via env validation instead (rejected — `RESEND_API_KEY` is legitimately optional in dev/test) | Accepted |

---

# 29. Technical Debt Register

| ID | Finding | Reason | Impact | Action | Status |
|---|---|---|---|---|---|
| TD-001 | ~~`packages/domain` and `packages/application` don't exist yet~~ | Created in Phase 5 with the Appointment/Patient business logic that justified them | — | — | Resolved |
| TD-002 | ~~Role enforcement had no automated regression tests~~ | `appointments.test.ts` now covers admin-only confirm/cancel/stats (403 for a patient) and cross-user isolation (a patient never sees another patient's appointments); `uploads.test.ts` covers owner/other-patient/admin on document access | — | — | Resolved |
| TD-003 | No CI pipeline (GitHub Actions) yet | Phase 10, explicitly deferred | Medium — no automated gate on typecheck/lint/test before merge | Add `.github/workflows` in Phase 10 | Open |
| TD-004 | No README/deployment docs yet | Phase 11, explicitly deferred | Low — project is pre-collaboration | Write in Phase 11 | Open |
| TD-005 | ~~Frontend not verified in an actual browser~~ | Verified this session via a headless-Chromium script (playwright-core driving the system's installed Chrome, since no browser automation tooling was pre-installed) | — | — | Resolved |
| TD-006 | Local dev Postgres mapped to host port 5433 instead of the standard 5432 | Port 5432 was already bound by an unrelated container on the machine used for setup | Low — internal container-to-container traffic still uses 5432 | Revert to 5432 in `docker-compose.yml`/`.env.example` if that conflict doesn't apply on other machines | Open |
| TD-007 | ~~No DAL/API integration tests or isolated test database~~ | Added a `healthcare_test` database (same Postgres instance, real isolation) plus 17 DAL repository tests and 18 API route tests (real Better Auth OTP sign-in, `app.request()` in-process — no server binding, no auth mocking) | — | — | Resolved |
| TD-008 | No favicon — browsers request `/favicon.ico`, which 404s (harmless, but shows up as a console error on every page) | Not addressed this session; cosmetic | Low | Add a favicon in Phase 4/11 polish | Open |
| TD-009 | Web production bundle is ~537KB (one chunk); Vite warns about the 500KB threshold | No code-splitting added yet — small app so far, but will grow with Phase 5+ pages | Low | Consider route-based `React.lazy` code-splitting once more pages exist | Open |
| TD-010 | If email delivery fails (e.g. `RESEND_API_KEY` misconfigured in production), a sign-in/registration OTP request still returns `{success:true}` to the client — Better Auth sends the OTP email as an unawaited background task, so the send failure never reaches the response | Discovered during Phase 8 security review while verifying the production console-fallback guard (Decision #25); not a regression this session introduced, and fixing it means overriding Better Auth's internal request flow, out of scope for a security-hardening pass | Medium — a real user attempting to sign in during an email outage would see no error, just never receive a code | Investigate Better Auth's hooks for a way to surface background-task failures to the client, or add client-side "didn't receive a code?" guidance/retry | Open |
| TD-011 | Remaining `pnpm audit` findings (1 critical, 1 high, 4 moderate, 1 low) are all dev-tooling-only (vitest/vite/drizzle-kit's bundled esbuild) | None are reachable in the shipped production image — `tsup` only bundles `apps/api`'s own source, and Vite/Vitest never run in production | Low | Re-run `pnpm audit` periodically; these will clear as vitest/vite/drizzle-kit release patches upstream | Open |

## Rules

- [ ] Record significant technical debt.
- [ ] Explain why the debt exists.
- [ ] Identify whether it is intentional.
- [ ] Assign impact.
- [ ] Define follow-up action.
- [ ] Do not mark debt resolved without verification.
- [ ] Remove obsolete entries.

---

# 30. Initial Setup Verification

The initial setup is complete only when:

## Repository

- [ ] Fresh clone succeeds.
- [ ] Dependencies install successfully.
- [ ] Lockfile is committed.
- [ ] No secrets are committed.
- [ ] Repository structure is documented.

## Backend

- [ ] API starts.
- [ ] `/health` works.
- [ ] `/ready` works when required.
- [ ] Error handling works.
- [ ] Environment validation works.

## Database

- [ ] PostgreSQL starts.
- [ ] API connects successfully.
- [ ] Schema/migrations work.
- [ ] Empty database can be initialized.
- [ ] Test database is isolated.

## Frontend

- [ ] Web application starts.
- [ ] API connection works.
- [ ] Routing works.
- [ ] Base styling works.
- [ ] Responsive layout works where applicable.

## Authentication

- [ ] Authentication works when enabled.
- [ ] Protected routes reject unauthenticated requests.
- [ ] Authorization works when enabled.
- [ ] Tenant isolation works when enabled.

## Quality

- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Tests pass.
- [ ] Build passes.

## Infrastructure

- [ ] Docker build works when applicable.
- [ ] Docker runtime works when applicable.
- [ ] CI passes on actual GitHub Actions.

---

# 31. Initial Setup Completion Criteria

Do not mark the initial setup complete simply because files were created.

A setup item is complete when:

- [ ] It is implemented.
- [ ] It is configured correctly.
- [ ] It is tested where applicable.
- [ ] It works from a clean environment.
- [ ] It does not introduce unnecessary project-specific assumptions.
- [ ] Documentation reflects the actual implementation.
- [ ] Known limitations are recorded.

> **Implemented ≠ Verified.**

---

# 32. Next Actions

> Start here. Do not re-plan the entire project after every session.

### Current Phase

```text
Phase 8 — Security Hardening (complete)
```

### Current Task

```text
Phases 5, 6, 7, 8, and 9 are all done. Phase 10 (Docker & CI/CD — a real
GitHub Actions pipeline running the typecheck/lint/build/test suite this
project already has) is the only unstarted phase left on the roadmap before
Phase 11 (Documentation) and Phase 12 (Production Launch Verification).
```

### Completed

```text
- Husky + lint-staged added (Section 5): pre-commit runs `biome check --write`
  on staged files; verified it auto-fixes a badly formatted staged file.
- Phase 5 domain model: packages/domain (Appointment state machine —
  pending/scheduled/cancelled transitions, consent assertion) and
  packages/application (commands/queries coordinating repository interfaces)
  created, resolving TD-001.
- Phase 5 data model: doctor, patient, and appointment tables added to
  packages/dal, plus a `role` column on `user`. Repositories implement the
  application-layer interfaces.
- Phase 5 API: full REST surface for doctors/patients/appointments —
  registration (multipart with ID upload), booking, admin
  confirm/cancel/stats — with Zod validation and a central error mapper
  translating domain/application errors to HTTP status codes.
- Admin provisioning: ADMIN_EMAILS env allowlist + a Better Auth
  `databaseHooks.user.create.before` hook sets role server-side only
  (`additionalFields.role` has `input: false` — never client-settable).
- File storage (Decision #13, now resolved): local-disk `FileStorage`
  interface with path-traversal protection (storage keys validated against
  the exact UUID(+extension) shape `save()` produces).
- Phase 5 frontend: sign-in (two-step OTP), patient registration (full
  intake form via react-hook-form + Zod), appointment booking, patient
  dashboard, and admin dashboard (stats + confirm/cancel), wired together
  with a role-aware nav bar and route guards.
- Phase 6 notifications: `sendAppointmentStatusEmail` (mirrors the OTP
  email's Resend/console-fallback pattern) fires on confirm and cancel.
  Getting the patient's email required a new `PatientRepository.
  getContactEmail(patientId)` (joins patient → user) — kept in the DAL, not
  queried ad hoc from the route, per the architecture's "database details
  stay in the DAL" rule. Live-confirmed by the user in a running dev
  session for both confirm and cancel.
- Phase 7/9 test infrastructure: a `healthcare_test` database (same
  Postgres instance as dev, real isolation — Decision #18) with shared
  helpers in `packages/dal/src/test-utils/` (`ensureTestDatabase`,
  `truncateAll`, `ensureTestDoctor`) reused by both packages' test suites.
- Phase 9 DAL tests: 17 tests across doctor/patient/appointment
  repositories — CRUD, the `patient.userId` unique constraint, foreign-key
  rejections, and cascade deletes (user → patient → appointment).
- Phase 7/9 API tests: 18 tests across doctors/patients/appointments/
  uploads routes, run in-process via Hono's `app.request()` (Decision #20)
  with real email-OTP sign-in (Decision #19, no auth mocking) — covering
  registration/booking/confirm/cancel business rules (double-booking
  conflict, missing-reason/consent rejections) and the Phase 7
  authorization requirement specifically: admin-only routes reject a
  patient with 403, a patient never sees another patient's appointments,
  and document access is scoped to the owner or an admin.
- Phase 8 dependency audit: `pnpm audit` found a high-severity SQL-injection
  advisory in `drizzle-orm` <0.45.2 (a production runtime dependency) —
  upgraded to 0.45.2 (Decision #22), full suite re-verified clean. All
  remaining audit findings are dev-tooling-only (TD-011).
- Phase 8 application hardening: `hono/secure-headers` added globally
  (Decision #23, verified live via curl); rate limiting on the two OTP
  endpoints via Better Auth's built-in `rateLimit.customRules` (Decision
  #24, verified live — 4th rapid request returns 429, dev/tests unaffected
  since it's production-only by default); the email console-fallback now
  refuses to run in production instead of silently leaking OTPs/appointment
  details into logs if `RESEND_API_KEY` is misconfigured (Decision #25,
  verified live — confirmed no OTP reached the log in a production-mode
  run, surfacing TD-010 as a side finding).
- Phase 8 review (no code change needed, confirmed already correct):
  CORS is origin-restricted (tested since Phase 2/4), error responses go
  through a central mapper with no stack-trace leakage, file upload
  security was already hardened in Phase 5 (content-type allowlist, size
  limit, path-traversal-proof storage keys), Better Auth's session cookies
  default to `sameSite: "lax"` (real CSRF protection without needing
  separate CSRF middleware), and no unused dependencies were found across
  any workspace.
- Secret rotation procedures documented directly in `.env.example` next to
  each secret (`BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `DATABASE_URL`).
```

### Blockers

```text
None.
```

### Next Action

```text
Phase 10 (Docker & CI/CD): add a GitHub Actions workflow that installs via
the lockfile, runs typecheck/lint/build/test (spinning up Postgres as a
service container for the DAL/API integration tests), and builds the
Docker image. Push and confirm at least one full green run on actual
GitHub Actions — a YAML file being syntactically valid doesn't count
(Section 26's own rule).
```

### Last Verified

```text
2026-08-27
Phase 5: fully verified (curl-driven flow + headless-browser screenshots —
see prior entries for the full list: OTP sign-in, registration with file
upload, booking, admin confirm/cancel, double-booking rejection,
consent/validation errors, cross-role 403s).

Phase 6: pnpm typecheck/lint/build/test pass with the email-notification
code; live-verified by the user in a running dev session (both confirm and
cancel produced the correct console-fallback email log entry).

Phase 7/9 (this update): `pnpm turbo typecheck lint build test` passes
across all 6 workspaces — 52 tests total (6 domain + 3 application + 17 dal
+ 18 api). Specifically verified, not just implemented:
- Re-ran the full suite twice in a row to confirm truncation/isolation
  actually works and no test is order-dependent.
- Deliberately broke one assertion (expected 200 instead of 403) and
  confirmed the suite failed with a clear diff, then reverted — proves the
  tests aren't vacuously passing.
- Found and fixed a real resource leak during this work: `ensureTestDatabase`
  opened a Postgres connection to run migrations and never closed it,
  causing Vitest to hang ~10s waiting to exit after every run. Fixed by
  closing that connection and adding an `afterAll` hook that closes the
  app's own db connection per test file.

Phase 8 (this update): `pnpm turbo typecheck lint build test` passes clean
after every change below — nothing was left unverified:
- `pnpm audit` re-run after the drizzle-orm upgrade: the high-severity
  finding is gone (9 → 7 vulnerabilities), confirmed all 7 remaining trace
  only through vitest/vite/drizzle-kit's bundled esbuild (dev-only, never
  in the shipped image).
- Secure headers: curled a running instance and confirmed
  `strict-transport-security`, `x-content-type-options`, `x-frame-options`,
  `x-download-options`, `referrer-policy`, and `x-xss-protection` are all
  present on responses.
- Rate limiting: ran the API with `NODE_ENV=production` and fired 5 rapid
  OTP-send requests — the first 3 returned 200, the 4th and 5th returned
  429. Re-ran the full test suite to confirm dev/test sign-ins (which sign
  in far more than 3-5 times) are unaffected by the production-only default.
- Production email guard: ran the API with `NODE_ENV=production` and no
  `RESEND_API_KEY`, requested an OTP, and confirmed the OTP never appeared
  in the server log — only a generic error did. Also confirmed the client
  still received `{success:true}` (Better Auth sends the email as an
  unawaited background task), which is why this is tracked as TD-010
  rather than treated as fully resolved.
```

---

# 33. Reusable Agent Instructions

When another AI/developer continues this project:

```text
Read PROJECT-CHECKLIST.md before making changes.

Use the current technology stack unless the project has a documented reason
to change it.

Do not assume optional infrastructure is required.

Before implementing a new feature:
1. Understand the existing architecture.
2. Check whether the required foundation already exists.
3. Identify the correct layer/package.
4. Implement the smallest maintainable solution.
5. Add or update tests.
6. Run typecheck/lint/test/build as appropriate.
7. Verify important behavior against real infrastructure.
8. Update PROJECT-CHECKLIST.md.

Do not:
- restart project planning from scratch
- replace technologies without justification
- add dependencies unnecessarily
- put business logic in route handlers
- allow tests to touch development data
- commit secrets
- mark work complete without verification

If an important architectural decision is made, record it in the
Engineering Decisions section.

If something is intentionally deferred, record it in Technical Debt.

When finished, update:
- Current Phase
- Current Task
- Completed
- Blockers
- Next Action
- Last Verified
```

---

# 34. Final Principle

> **The checklist provides the project's engineering foundation; the project requirements determine which parts of that foundation are actually needed.**

The current stack is the **default implementation choice**, not a requirement to activate every technology for every project.
