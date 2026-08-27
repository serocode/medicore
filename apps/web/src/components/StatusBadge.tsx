import { CalendarCheck, CircleDashed, XCircle } from "lucide-react";
import type { AppointmentStatus } from "../lib/types";

const STYLES: Record<AppointmentStatus, { classes: string; icon: typeof CalendarCheck }> = {
  pending: { classes: "bg-amber-100 text-amber-800", icon: CircleDashed },
  scheduled: { classes: "bg-emerald-100 text-emerald-800", icon: CalendarCheck },
  cancelled: { classes: "bg-red-100 text-red-800", icon: XCircle },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { classes, icon: Icon } = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${classes}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}
