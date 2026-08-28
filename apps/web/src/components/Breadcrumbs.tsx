import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export interface Crumb {
  label: string;
  /** Omit on the final crumb — the page you're already on isn't a link. */
  to?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
}

/**
 * Shows where you are in the hierarchy and gets you back up it.
 *
 * Rendered only where there's somewhere to go: a trail with a single entry is
 * decoration, so it returns null rather than printing the page's own name back
 * at it. The last crumb is plain text carrying aria-current, per the WAI-ARIA
 * breadcrumb pattern.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb">
      {/* Scrolls rather than wraps on narrow screens — a deep trail folding
          onto three lines pushes the page heading below the fold. */}
      <ol className="flex items-center gap-1.5 overflow-x-auto text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${item.to ?? "current"}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />
              )}
              {isLast || !item.to ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="truncate font-medium text-ink"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="whitespace-nowrap text-ink-muted underline-offset-4 transition-colors hover:text-primary hover:underline"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
