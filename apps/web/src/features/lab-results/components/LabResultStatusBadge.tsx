import type { LabResultStatus } from "@/shared/lib/types";
import { CheckCircle, CircleDashed, Clock, FileCheck, XCircle } from "lucide-react";

// The tonal ladder tracks urgency, not just identity: neutral while nothing is
// owed, ochre while someone is waited on, the stronger ochre once a clinician
// has to act, emerald when the loop is closed.
const STYLES: Record<
  LabResultStatus,
  { classes: string; icon: typeof CheckCircle; label: string }
> = {
  requested: {
    classes: "bg-neutral-soft text-on-neutral-soft",
    icon: CircleDashed,
    label: "Requested",
  },
  pending: { classes: "bg-accent-soft text-on-accent-soft", icon: Clock, label: "At laboratory" },
  result_available: {
    classes: "bg-accent-soft-dim text-on-accent-soft",
    icon: FileCheck,
    label: "Awaiting review",
  },
  reviewed: {
    classes: "bg-primary-soft text-on-primary-soft",
    icon: CheckCircle,
    label: "Reviewed",
  },
  cancelled: { classes: "bg-danger-soft text-on-danger-soft", icon: XCircle, label: "Cancelled" },
};

/** Single source of truth for status wording — filters must match badges. */
export const LAB_RESULT_STATUS_LABELS: Record<LabResultStatus, string> = {
  requested: STYLES.requested.label,
  pending: STYLES.pending.label,
  result_available: STYLES.result_available.label,
  reviewed: STYLES.reviewed.label,
  cancelled: STYLES.cancelled.label,
};

export function LabResultStatusBadge({ status }: { status: LabResultStatus }) {
  const { classes, icon: Icon, label } = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-display text-xs font-semibold ${classes}`}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
