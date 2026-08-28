import type { ReactNode } from "react";

/**
 * The one card shell for the product. Before this existed the string
 * `rounded-lg border border-slate-200 bg-white` was copy-pasted into a dozen
 * files, which is how card styling drifts.
 */
export function Card({
  children,
  className = "",
  interactive = false,
  id,
}: {
  children: ReactNode;
  className?: string;
  /** Adds the design system's hover border shift. Only for cards that link somewhere. */
  interactive?: boolean;
  /**
   * Makes the card an in-page anchor target. `scroll-mt-24` keeps the card's
   * heading clear of the sticky nav bar when jumped to, which a bare anchor
   * would hide underneath it.
   */
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`rounded-card border border-line bg-white shadow-ambient ${
        id ? "scroll-mt-24" : ""
      } ${interactive ? "transition-colors hover:border-primary-soft-dim" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  /** Right-hand slot for a filter, a link, or a small action. */
  action?: ReactNode;
  /** `h2` by default; drop to `h3` when the card sits under another heading. */
  as?: "h2" | "h3";
}

export function CardHeader({ title, description, action, as: Heading = "h2" }: CardHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <Heading className="text-headline-sm text-ink">{title}</Heading>
        {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
