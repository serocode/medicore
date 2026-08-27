import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api-client";
import type { Appointment } from "../lib/types";

const STATUS_STYLES: Record<Appointment["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  scheduled: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export function PatientDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ appointments: Appointment[] }>("/api/appointments")
      .then((result) => setAppointments(result.appointments))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-slate-50 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Your appointments</h1>
        <Link
          to="/book"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Book new appointment
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {appointments && appointments.length === 0 && (
        <p className="text-sm text-slate-600">
          You have no appointments yet. Once you register, you can book one.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {appointments?.map((appointment) => (
          <li
            key={appointment.id}
            className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900">{appointment.reason}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[appointment.status]}`}
              >
                {appointment.status}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              {appointment.status === "scheduled" && appointment.scheduledAt
                ? `Scheduled for ${new Date(appointment.scheduledAt).toLocaleString()}`
                : `Preferred: ${new Date(appointment.preferredSchedule).toLocaleString()}`}
            </p>
            {appointment.cancellationReason && (
              <p className="text-sm text-red-600">Cancelled: {appointment.cancellationReason}</p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
