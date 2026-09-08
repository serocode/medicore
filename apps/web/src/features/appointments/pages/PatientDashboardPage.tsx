import { AppointmentActionModal } from "@/features/appointments/components/AppointmentActionModal";
import { StatusBadge } from "@/features/appointments/components/StatusBadge";
import { apiFetch } from "@/shared/lib/api-client";
import { formatDateTime } from "@/shared/lib/format";
import type { Appointment } from "@/shared/lib/types";
import { Avatar } from "@/shared/ui/Avatar";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatusMessage } from "@/shared/ui/StatusMessage";
import { CalendarDays, CalendarPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/** Upcoming and undecided appointments belong above settled history. */
function isOpen(appointment: Appointment): boolean {
  return appointment.status !== "cancelled";
}

export function PatientDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<{ appointments: Appointment[] }>("/api/appointments")
      .then((result) => setAppointments(result.appointments))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "We couldn't load your appointments."),
      );
  }, []);

  useEffect(() => load(), [load]);

  async function cancelAppointment(id: string, reason: string) {
    await apiFetch(`/api/appointments/${id}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });
    setCancellingId(null);
    setNotice("Your appointment has been cancelled.");
    load();
  }

  const open = appointments?.filter(isOpen) ?? [];
  const past = appointments?.filter((a) => !isOpen(a)) ?? [];

  return (
    <>
      <PageHeader
        title="Your appointments"
        description="Requests waiting on the clinic, confirmed visits, and everything you've cancelled."
        actions={
          <ButtonLink to="/book">
            <CalendarPlus aria-hidden="true" className="h-4 w-4" />
            Book appointment
          </ButtonLink>
        }
      />

      {error && <StatusMessage tone="error">{error}</StatusMessage>}
      {notice && <StatusMessage tone="success">{notice}</StatusMessage>}

      {!error && appointments === null && (
        <output className="text-sm text-ink-muted">Loading your appointments…</output>
      )}

      {appointments && appointments.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="No appointments yet"
          description="Choose a physician and a time that suits you — the clinic will confirm the slot by email."
          action={<ButtonLink to="/book">Book your first appointment</ButtonLink>}
        />
      )}

      {open.length > 0 && (
        <section aria-labelledby="open-appointments" className="flex flex-col gap-3">
          <h2 id="open-appointments" className="text-headline-sm text-ink">
            Upcoming
          </h2>
          <ul className="flex flex-col gap-3">
            {open.map((appointment) => (
              <li key={appointment.id}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        name={appointment.doctorName}
                        imageUrl={appointment.doctorImageUrl}
                        size={40}
                      />
                      <div className="min-w-0">
                        <p className="font-display font-semibold text-ink">
                          {appointment.doctorName}
                        </p>
                        <p className="truncate text-sm text-ink-muted">{appointment.reason}</p>
                      </div>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>

                  <dl className="mt-4 border-t border-line pt-4 text-sm">
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-ink-subtle">
                        {appointment.status === "scheduled" ? "Confirmed for" : "You asked for"}
                      </dt>
                      <dd className="font-medium text-ink">
                        {formatDateTime(
                          appointment.status === "scheduled" && appointment.scheduledAt
                            ? appointment.scheduledAt
                            : appointment.preferredSchedule,
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-caption text-ink-subtle">
                      {appointment.status === "scheduled"
                        ? "Need a different time? Cancel this visit and book a new one."
                        : "The clinic will email you once this is confirmed."}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Cancel your appointment with ${appointment.doctorName}`}
                      onClick={() => setCancellingId(appointment.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section aria-labelledby="past-appointments" className="flex flex-col gap-3">
          <h2 id="past-appointments" className="text-headline-sm text-ink">
            Cancelled
          </h2>
          <ul className="flex flex-col gap-3">
            {past.map((appointment) => (
              <li key={appointment.id}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-ink">
                        {appointment.doctorName}
                      </p>
                      <p className="text-sm text-ink-muted">
                        {formatDateTime(appointment.preferredSchedule)} · {appointment.reason}
                      </p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                  {appointment.cancellationReason && (
                    <p className="mt-3 border-t border-line pt-3 text-sm text-ink-muted">
                      <span className="font-medium text-ink">Reason:</span>{" "}
                      {appointment.cancellationReason}
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {cancellingId && (
        <AppointmentActionModal
          mode="cancel"
          description="The clinic will see why you cancelled. This can't be undone — you'd need to book again."
          footnote="Rescheduling works the same way: cancel this one, then book the time you want."
          onClose={() => setCancellingId(null)}
          onSubmit={(reason) => cancelAppointment(cancellingId, reason)}
        />
      )}
    </>
  );
}
