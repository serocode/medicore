import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

type StatusTone = "success" | "error" | "info";

const TONE_STYLES: Record<StatusTone, { classes: string; icon: typeof Info }> = {
  success: {
    classes: "border-primary-soft-dim bg-primary-soft/50 text-on-primary-soft",
    icon: CheckCircle2,
  },
  error: { classes: "border-danger/30 bg-danger-soft text-on-danger-soft", icon: AlertCircle },
  info: { classes: "border-accent-soft-dim bg-accent-soft/60 text-on-accent-soft", icon: Info },
};

interface StatusMessageProps {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}

/**
 * Inline feedback after an action. Errors announce assertively; successes and
 * hints announce politely, so a saved-confirmation never interrupts typing.
 */
export function StatusMessage({ tone, children, className = "" }: StatusMessageProps) {
  const { classes, icon: Icon } = TONE_STYLES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-control border px-3.5 py-2.5 text-sm ${classes} ${className}`}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
