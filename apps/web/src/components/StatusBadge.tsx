import { CalendarCheck, CircleDashed, XCircle } from "lucide-react";
import type { AppointmentStatus } from "../lib/types";

const STYLES: Record<
  AppointmentStatus,
  { classes: string; icon: typeof CalendarCheck; label: string }
> = {
  pending: {
    classes: "bg-accent-soft text-on-accent-soft",
    icon: CircleDashed,
    label: "Awaiting confirmation",
  },
  scheduled: {
    classes: "bg-primary-soft text-on-primary-soft",
    icon: CalendarCheck,
    label: "Scheduled",
  },
  cancelled: { classes: "bg-danger-soft text-on-danger-soft", icon: XCircle, label: "Cancelled" },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
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
