import { CheckCircle, CircleDashed, Clock, FileCheck, XCircle } from "lucide-react";
import type { LabResultStatus } from "../lib/types";

const STYLES: Record<
  LabResultStatus,
  { classes: string; icon: typeof CheckCircle; label: string }
> = {
  requested: { classes: "bg-slate-100 text-slate-700", icon: CircleDashed, label: "Requested" },
  pending: { classes: "bg-amber-100 text-amber-800", icon: Clock, label: "Pending" },
  result_available: {
    classes: "bg-blue-100 text-blue-800",
    icon: FileCheck,
    label: "Result Available",
  },
  reviewed: { classes: "bg-emerald-100 text-emerald-800", icon: CheckCircle, label: "Reviewed" },
  cancelled: { classes: "bg-red-100 text-red-800", icon: XCircle, label: "Cancelled" },
};

export function LabResultStatusBadge({ status }: { status: LabResultStatus }) {
  const { classes, icon: Icon, label } = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
