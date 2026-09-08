import {
  COOKIE_POLICY,
  LEGAL_DOCUMENTS,
  type LegalDocument,
  type LegalSection,
  PRIVACY_POLICY,
  TERMS_OF_USE,
} from "@/features/legal/lib/legal-content";
import { formatDate } from "@/shared/lib/format";
import { useDocumentTitle } from "@/shared/lib/use-document-title";
import { Link } from "react-router-dom";

function SectionBody({ section }: { section: LegalSection }) {
  return (
    <>
      {section.body?.map((paragraph) => (
        <p key={paragraph} className="mt-3 text-ink-muted first:mt-0">
          {paragraph}
        </p>
      ))}

      {section.points && (
        <ul className="mt-3 flex flex-col gap-2">
          {section.points.map((point) => (
            <li key={point} className="flex gap-2.5 text-ink-muted">
              {/* Decorative bullet: the <li> already conveys list membership,
                  so announcing a dot on every row would only add noise. */}
              <span
                aria-hidden="true"
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-soft-dim"
              />
              <span className="min-w-0">{point}</span>
            </li>
          ))}
        </ul>
      )}

      {section.table && (
        // Scrolls inside its own box rather than pushing the page sideways.
        <div className="mt-4 overflow-x-auto rounded-card border border-line">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <caption className="sr-only">{section.table.caption}</caption>
            <thead>
              <tr className="bg-surface-low">
                {section.table.columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="border-b border-line px-4 py-2.5 font-display font-semibold text-ink"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.table.rows.map((row) => (
                <tr key={row.join("|")} className="border-b border-line last:border-b-0">
                  {row.map((cell, index) =>
                    // The first cell names the row, so it is a header for it.
                    index === 0 ? (
                      <th
                        key={cell}
                        scope="row"
                        className="px-4 py-3 align-top font-display font-semibold text-ink"
                      >
                        {cell}
                      </th>
                    ) : (
                      <td key={cell} className="px-4 py-3 align-top text-ink-muted">
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/**
 * One renderer for all three legal documents — they differ in words, not in
 * shape, and three near-identical page components would drift apart the first
 * time one of them was edited.
 */
export function LegalPage({ doc }: { doc: LegalDocument }) {
  const others = LEGAL_DOCUMENTS.filter((entry) => entry.slug !== doc.slug);
  useDocumentTitle(doc.title);

  return (
    <article className="flex flex-col gap-8">
      <header>
        <h1 className="text-headline-md text-ink sm:text-headline-lg">{doc.title}</h1>
        <p className="mt-2 max-w-prose text-body-lg text-ink-muted">{doc.summary}</p>
        <p className="mt-3 text-sm text-ink-subtle">
          Last updated{" "}
          {/* Pinned to the clinic's offset: a bare "T00:00:00" is parsed as
              the *viewer's* midnight, which renders as the previous day for
              anyone east of Manila. */}
          <time dateTime={doc.updated}>{formatDate(`${doc.updated}T00:00:00+08:00`)}</time>
        </p>
      </header>

      {/* A contents list earns its place here: these documents are long, and
          people arrive looking for one specific answer. */}
      <nav aria-label={`Sections of the ${doc.title.toLowerCase()}`}>
        <h2 className="font-display text-label uppercase text-ink-subtle">On this page</h2>
        <ol className="mt-3 flex flex-col gap-1.5">
          {doc.sections.map((section, index) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-ink-muted underline-offset-4 hover:text-primary hover:underline"
              >
                <span className="tabular-nums text-ink-subtle">{index + 1}.</span> {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex flex-col gap-8">
        {doc.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-heading`}
            // Clears the sticky nav bar when jumped to from the contents list.
            className="scroll-mt-24"
          >
            <h2 id={`${section.id}-heading`} className="text-headline-sm text-ink">
              {section.title}
            </h2>
            <div className="mt-2">
              <SectionBody section={section} />
            </div>
          </section>
        ))}
      </div>

      <footer className="border-t border-line pt-6">
        <h2 className="font-display text-label uppercase text-ink-subtle">The other documents</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {others.map((entry) => (
            <li key={entry.slug}>
              <Link
                to={entry.path}
                className="font-display font-semibold text-primary underline-offset-4 hover:underline"
              >
                {entry.title}
              </Link>
              <span className="text-ink-muted"> — {entry.summary}</span>
            </li>
          ))}
        </ul>
      </footer>
    </article>
  );
}

export function PrivacyPolicyPage() {
  return <LegalPage doc={PRIVACY_POLICY} />;
}

export function TermsPage() {
  return <LegalPage doc={TERMS_OF_USE} />;
}

export function CookiePolicyPage() {
  return <LegalPage doc={COOKIE_POLICY} />;
}
