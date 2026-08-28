import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** The next step. An empty state without one is a dead end. */
  action?: ReactNode;
  /** Use inside a card that already has its own border. */
  bare?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  bare = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-2 px-6 py-10 text-center ${
        bare ? "" : "rounded-card border border-dashed border-line bg-white"
      }`}
    >
      {Icon && (
        <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-primary">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      )}
      <p className="font-display font-semibold text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
