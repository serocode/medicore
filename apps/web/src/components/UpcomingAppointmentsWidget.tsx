import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";
import { displayName, formatWeekdayTime, isToday } from "../lib/format";
import type { Appointment, StaffRole } from "../lib/types";
import { Avatar } from "./Avatar";
import { Card, CardHeader } from "./Card";
import { EmptyState } from "./EmptyState";
import { StatusMessage } from "./StatusMessage";

/**
 * "Who am I seeing today, and what's next?" — the question a clinician opens
 * the dashboard to answer. Confirmed visits only: an unconfirmed request has
 * no time to plan around.
 */
export function UpcomingAppointmentsWidget({ role }: { role: StaffRole }) {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    apiFetch<{ appointments: Appointment[] }>("/api/appointments?status=scheduled")
      .then((result) => setAppointments(result.appointments))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "We couldn't load the schedule."),
      );
  }, []);

  const now = Date.now();
  const upcoming = (appointments ?? [])
    .filter((a) => a.scheduledAt && new Date(a.scheduledAt).getTime() >= now)
    .sort(
      (a, b) => new Date(a.scheduledAt ?? 0).getTime() - new Date(b.scheduledAt ?? 0).getTime(),
    );
  const todayCount = upcoming.filter((a) => a.scheduledAt && isToday(a.scheduledAt)).length;

  return (
    <Card>
      <CardHeader
        title="Upcoming appointments"
        description={
          role === "doctor"
            ? "Confirmed visits booked with you."
            : "Confirmed visits across the clinic."
        }
        action={
          appointments !== null && (
            <span className="rounded-full bg-primary-soft px-3 py-1 font-display text-xs font-semibold text-on-primary-soft">
              {todayCount} today
            </span>
          )
        }
      />

      {error ? (
        <div className="p-5">
          <StatusMessage tone="error">{error}</StatusMessage>
        </div>
      ) : appointments === null ? (
        <output className="block px-5 py-6 text-center text-sm text-ink-muted">
          Loading the schedule…
        </output>
      ) : upcoming.length === 0 ? (
        <EmptyState
          bare
          icon={CalendarDays}
          title="Nothing scheduled"
          description={
            role === "doctor"
              ? "No confirmed appointments are booked with you yet."
              : "The clinic has no confirmed appointments coming up."
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {upcoming.slice(0, 6).map((appointment) => (
            <li key={appointment.id} className="flex items-center gap-3 px-5 py-3">
              <Avatar name={displayName(appointment.patientName)} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold text-ink">
                  {displayName(appointment.patientName)}
                </p>
                <p className="truncate text-sm text-ink-muted">{appointment.reason}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-sm font-semibold tabular-nums text-ink">
                  {appointment.scheduledAt ? formatWeekdayTime(appointment.scheduledAt) : "—"}
                </p>
                {appointment.scheduledAt && isToday(appointment.scheduledAt) && (
                  <p className="text-caption font-semibold text-primary">Today</p>
                )}
                {role === "nurse" && (
                  <p className="text-caption text-ink-subtle">{appointment.doctorName}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
