import { BookOpen, CircleAlert, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardBody, CardHeader } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { TabPanel, Tabs } from "../components/Tabs";
import { useSession } from "../lib/auth-client";
import { ROLE_GUIDES, type RoleGuide } from "../lib/help-content";
import type { UserAccountRole } from "../lib/types";

const ROLE_IDS = ROLE_GUIDES.map((guide) => guide.role);

function isRole(value: string | null): value is UserAccountRole {
  return value !== null && (ROLE_IDS as string[]).includes(value);
}

/** Where the reader's own role lands them, and where to send them back to. */
function dashboardFor(role: string | undefined): { label: string; to: string } {
  if (role === "admin") return { label: "Dashboard", to: "/admin" };
  if (role === "doctor" || role === "nurse") return { label: "Dashboard", to: "/staff/dashboard" };
  return { label: "My appointments", to: "/dashboard" };
}

function GuideBody({ guide, isOwnRole }: { guide: RoleGuide; isOwnRole: boolean }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Contents rail. Sticky on wide screens, a plain list on narrow ones —
          a sticky block on a phone eats the screen the guide needs. */}
      <nav
        aria-label={`Contents for ${guide.label}`}
        className="lg:sticky lg:top-24 lg:w-56 lg:shrink-0"
      >
        <p className="font-display text-label uppercase text-ink-subtle">On this page</p>
        <ul className="mt-3 flex flex-col gap-1">
          {guide.sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${guide.role}-${section.id}`}
                className="block rounded-control px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-container hover:text-ink"
              >
                {section.title}
              </a>
            </li>
          ))}
          <li>
            <a
              href={`#${guide.role}-limits`}
              className="block rounded-control px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-container hover:text-ink"
            >
              What you can't do
            </a>
          </li>
          {guide.glossary && (
            <li>
              <a
                href={`#${guide.role}-glossary`}
                className="block rounded-control px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-container hover:text-ink"
              >
                Terms and statuses
              </a>
            </li>
          )}
        </ul>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="rounded-card border border-line bg-white p-5 shadow-ambient">
          <p className="text-body-lg text-ink">{guide.summary}</p>
          <p className="mt-2 flex items-start gap-2 text-sm text-ink-muted">
            <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {guide.landing}
            {isOwnRole && <span className="text-ink-subtle"> This is your role.</span>}
          </p>
        </div>

        {guide.sections.map((section) => (
          <Card key={section.id} id={`${guide.role}-${section.id}`}>
            <CardHeader title={section.title} description={section.intro} as="h3" />
            <CardBody>
              {section.steps && (
                <ol className="flex flex-col gap-5">
                  {section.steps.map((step, index) => (
                    <li key={step.title} className="flex gap-4">
                      <span
                        aria-hidden="true"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display text-sm font-bold tabular-nums text-on-primary-soft"
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-ink">{step.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              {section.points && (
                <ul className="flex flex-col gap-3">
                  {section.points.map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-relaxed text-ink-muted">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        ))}

        <Card id={`${guide.role}-limits`}>
          <CardHeader
            title="What you can't do"
            description="Stated plainly so you don't go looking for something that isn't there."
            as="h3"
          />
          <CardBody>
            <ul className="flex flex-col gap-3">
              {guide.limits.map((limit) => (
                <li key={limit} className="flex gap-3 text-sm leading-relaxed text-ink-muted">
                  <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {limit}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        {guide.glossary && (
          <Card id={`${guide.role}-glossary`}>
            <CardHeader
              title="Terms and statuses"
              description="What the labels in the interface mean."
              as="h3"
            />
            <CardBody>
              <dl className="flex flex-col gap-4">
                {guide.glossary.map((entry) => (
                  <div key={entry.term}>
                    <dt className="font-display font-semibold text-ink">{entry.term}</dt>
                    <dd className="mt-0.5 text-sm leading-relaxed text-ink-muted">
                      {entry.definition}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

export function HelpPage() {
  const { data: session } = useSession();
  const ownRole = (session?.user as { role?: string } | undefined)?.role;
  const [searchParams, setSearchParams] = useSearchParams();

  // Open on the reader's own role, but let them read any of the four — a
  // nurse checking what a doctor sees is a legitimate question, and none of
  // this is patient data.
  const requested = searchParams.get("role");
  const [role, setRole] = useState<UserAccountRole>(() =>
    isRole(requested)
      ? requested
      : isRole(ownRole ?? null)
        ? (ownRole as UserAccountRole)
        : "patient",
  );

  // Once the session resolves, land on the reader's own role unless they
  // explicitly asked for another via the URL.
  useEffect(() => {
    if (!isRole(requested) && isRole(ownRole ?? null)) setRole(ownRole as UserAccountRole);
  }, [ownRole, requested]);

  function selectRole(next: UserAccountRole) {
    setRole(next);
    setSearchParams({ role: next });
  }

  const dashboard = dashboardFor(ownRole);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: dashboard.label, to: dashboard.to }, { label: "Help" }]}
        title="How Medicore works"
        description="A guide to what each role can do and how to do it. Every section describes the system as it works today."
      />

      <Tabs
        label="Guides by role"
        idPrefix="help"
        activeId={role}
        onChange={selectRole}
        tabs={ROLE_GUIDES.map((guide) => ({ id: guide.role, label: guide.label }))}
      />

      {ROLE_GUIDES.map((guide) => (
        <TabPanel key={guide.role} id={guide.role} activeId={role} idPrefix="help">
          <GuideBody guide={guide} isOwnRole={guide.role === ownRole} />
        </TabPanel>
      ))}

      <p className="flex items-center gap-2 text-sm text-ink-subtle">
        <BookOpen aria-hidden="true" className="h-4 w-4" />
        Something here not match what you see? Tell your clinic administrator — the guide is meant
        to track the system exactly.
      </p>
    </>
  );
}
