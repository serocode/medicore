import type { Doctor } from "@/features/appointments/hooks/use-doctors";
import { formatDateTime } from "@/shared/lib/format";
import { CLINIC_TIME_ZONE_LABEL } from "@/shared/lib/timezone";
import type { Appointment } from "@/shared/lib/types";
import { Avatar } from "@/shared/ui/Avatar";
import { ButtonLink } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { CheckCircle2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";

interface SuccessState {
  appointment: Appointment;
  doctor: Doctor | null;
}

export function BookingSuccessPage() {
  const location = useLocation();
  const state = location.state as SuccessState | null;

  if (!state?.appointment) {
    return <Navigate to="/dashboard" replace />;
  }

  const { appointment, doctor } = state;

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
        <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-primary" />
      </span>

      <div>
        <h1 className="text-headline-lg text-ink">Request sent</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-muted">
          The clinic will confirm your time and email you. Until then it shows as
          <span className="whitespace-nowrap"> “awaiting confirmation”</span> on your dashboard.
        </p>
      </div>

      <Card className="w-full max-w-sm p-6 text-left">
        <p className="font-display text-label uppercase text-ink-subtle">You requested</p>
        <div className="mt-4 flex items-center gap-3">
          <Avatar name={doctor?.name ?? "Physician"} imageUrl={doctor?.imageUrl} size={44} />
          <div className="min-w-0">
            <p className="font-display font-semibold text-ink">
              {doctor?.name ?? "Selected physician"}
            </p>
            <p className="text-sm text-ink-muted">
              {formatDateTime(appointment.preferredSchedule)}
            </p>
            <p className="text-caption text-ink-subtle">{CLINIC_TIME_ZONE_LABEL}</p>
          </div>
        </div>
        <p className="mt-4 border-t border-line pt-4 text-sm text-ink-muted">
          {appointment.reason}
        </p>
      </Card>

      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink to="/dashboard">View my appointments</ButtonLink>
        <ButtonLink to="/book" variant="secondary">
          Book another
        </ButtonLink>
      </div>
    </div>
  );
}
