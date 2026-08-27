import { useCallback, useEffect, useState } from "react";
import { Button } from "../components/Button";
import { Field, inputClassName } from "../components/Field";
import { apiFetch } from "../lib/api-client";
import type { Appointment, AppointmentStatus } from "../lib/types";

type Stats = Record<AppointmentStatus, number>;

function ConfirmForm({ onConfirm }: { onConfirm: (scheduledAt: string) => Promise<void> }) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        await onConfirm(new Date(value).toISOString());
        setIsSubmitting(false);
      }}
    >
      <Field label="Scheduled for" htmlFor={`schedule-${value}`}>
        <input
          id={`schedule-${value}`}
          type="datetime-local"
          required
          className={inputClassName}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </Field>
      <Button type="submit" disabled={isSubmitting || !value}>
        Confirm
      </Button>
    </form>
  );
}

function CancelForm({ onCancel }: { onCancel: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        await onCancel(reason);
        setIsSubmitting(false);
      }}
    >
      <Field label="Cancellation reason" htmlFor={`reason-${reason}`}>
        <input
          id={`reason-${reason}`}
          required
          className={inputClassName}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </Field>
      <Button type="submit" variant="danger" disabled={isSubmitting || !reason.trim()}>
        Cancel
      </Button>
    </form>
  );
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<{
    id: string;
    kind: "confirm" | "cancel";
  } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [statsResult, appointmentsResult] = await Promise.all([
        apiFetch<{ stats: Stats }>("/api/appointments/stats"),
        apiFetch<{ appointments: Appointment[] }>("/api/appointments"),
      ]);
      setStats(statsResult.stats);
      setAppointments(appointmentsResult.appointments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function confirmAppointment(id: string, scheduledAt: string) {
    setError(null);
    try {
      await apiFetch(`/api/appointments/${id}/confirm`, {
        method: "PATCH",
        body: JSON.stringify({ scheduledAt }),
      });
      setActiveAction(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm");
    }
  }

  async function cancelAppointment(id: string, reason: string) {
    setError(null);
    try {
      await apiFetch(`/api/appointments/${id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      });
      setActiveAction(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    }
  }

  const pending = appointments?.filter((a) => a.status === "pending") ?? [];

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 bg-slate-50 p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Admin dashboard</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-3 gap-4">
        {(["pending", "scheduled", "cancelled"] as const).map((status) => (
          <div key={status} className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-semibold text-slate-900">{stats?.[status] ?? "—"}</p>
            <p className="text-sm capitalize text-slate-500">{status}</p>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-slate-900">Pending appointments</h2>
        {pending.length === 0 && <p className="text-sm text-slate-600">Nothing pending.</p>}
        <ul className="flex flex-col gap-3">
          {pending.map((appointment) => (
            <li
              key={appointment.id}
              className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-slate-900">{appointment.reason}</p>
                <p className="text-sm text-slate-600">
                  Preferred: {new Date(appointment.preferredSchedule).toLocaleString()}
                </p>
              </div>

              {activeAction?.id === appointment.id && activeAction.kind === "confirm" && (
                <ConfirmForm
                  onConfirm={(scheduledAt) => confirmAppointment(appointment.id, scheduledAt)}
                />
              )}
              {activeAction?.id === appointment.id && activeAction.kind === "cancel" && (
                <CancelForm onCancel={(reason) => cancelAppointment(appointment.id, reason)} />
              )}

              {activeAction?.id !== appointment.id && (
                <div className="flex gap-2">
                  <Button onClick={() => setActiveAction({ id: appointment.id, kind: "confirm" })}>
                    Confirm
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setActiveAction({ id: appointment.id, kind: "cancel" })}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
