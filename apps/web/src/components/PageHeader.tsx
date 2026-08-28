import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Primary/secondary actions for the page. Wraps onto its own row on mobile. */
  actions?: ReactNode;
  /**
   * Trail to this page. Omit on top-level pages — <Breadcrumbs> also drops a
   * single-entry trail, so a page that is its own root never shows one.
   */
  breadcrumbs?: Crumb[];
}

/** Title + supporting line + actions. Every page in the product opens with one. */
export function PageHeader({ title, description, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-headline-md text-ink sm:text-headline-lg">{title}</h1>
          {description && <p className="mt-1 max-w-prose text-ink-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
    </div>
  );
}
