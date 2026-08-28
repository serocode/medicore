import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

/** Semantic tone, not a raw colour — keeps stat cards on the palette. */
export type StatTone = "primary" | "accent" | "neutral" | "danger";

const TONE_CLASSES: Record<StatTone, string> = {
  primary: "bg-primary-soft text-on-primary-soft",
  accent: "bg-accent-soft text-on-accent-soft",
  neutral: "bg-neutral-soft text-on-neutral-soft",
  danger: "bg-danger-soft text-on-danger-soft",
};

interface StatCardProps {
  icon: LucideIcon;
  count: number;
  label: string;
  tone: StatTone;
  /** Optional target — a stat that filters a list should be clickable. */
  to?: string;
}

export function StatCard({ icon: Icon, count, label, tone, to }: StatCardProps) {
  const body = (
    <>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control ${TONE_CLASSES[tone]}`}
      >
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-2xl font-bold tabular-nums text-ink">{count}</p>
        <p className="text-sm text-ink-muted">{label}</p>
      </div>
    </>
  );

  const shell =
    "flex items-center gap-4 rounded-card border border-line bg-white p-5 shadow-ambient";

  if (to) {
    return (
      <Link to={to} className={`${shell} transition-colors hover:border-primary-soft-dim`}>
        {body}
      </Link>
    );
  }

  return <div className={shell}>{body}</div>;
}
