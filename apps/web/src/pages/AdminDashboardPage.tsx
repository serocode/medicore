import { CalendarCheck, CircleDashed, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppointmentActionModal } from "../components/AppointmentActionModal";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { apiFetch } from "../lib/api-client";
import type { Appointment, AppointmentStatus } from "../lib/types";

type Stats = Record<AppointmentStatus, number>;

interface ActiveAction {
  id: string;
  mode: "confirm" | "cancel";
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null);

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

  const activeAppointment = appointments?.find((a) => a.id === activeAction?.id) ?? null;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 bg-slate-50 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome 👋</h1>
        <p className="text-slate-600">Here's an overview of today's appointments.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={CalendarCheck}
          count={stats?.scheduled ?? 0}
          label="Scheduled appointments"
          colorClassName="bg-emerald-600"
        />
        <StatCard
          icon={CircleDashed}
          count={stats?.pending ?? 0}
          label="Pending appointments"
          colorClassName="bg-amber-500"
        />
        <StatCard
          icon={XCircle}
          count={stats?.cancelled ?? 0}
          label="Cancelled appointments"
          colorClassName="bg-red-600"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Appointment</th>
              <th className="px-4 py-3 font-medium">Doctor</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments?.map((appointment) => (
              <tr key={appointment.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-slate-900">{appointment.patientName}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={appointment.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {appointment.status === "scheduled" && appointment.scheduledAt
                    ? new Date(appointment.scheduledAt).toLocaleString()
                    : new Date(appointment.preferredSchedule).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={appointment.doctorName}
                      imageUrl={appointment.doctorImageUrl}
                      size={24}
                    />
                    <span className="text-slate-700">{appointment.doctorName}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {appointment.status === "pending" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setActiveAction({ id: appointment.id, mode: "confirm" })}
                      >
                        Schedule
                      </Button>
                    )}
                    {appointment.status !== "cancelled" && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setActiveAction({ id: appointment.id, mode: "cancel" })}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {appointments?.length === 0 && (
          <p className="p-4 text-sm text-slate-500">No appointments yet.</p>
        )}
      </div>

      {activeAction && activeAppointment && activeAction.mode === "confirm" && (
        <AppointmentActionModal
          mode="confirm"
          onClose={() => setActiveAction(null)}
          onSubmit={(scheduledAt) => confirmAppointment(activeAppointment.id, scheduledAt)}
        />
      )}
      {activeAction && activeAppointment && activeAction.mode === "cancel" && (
        <AppointmentActionModal
          mode="cancel"
          onClose={() => setActiveAction(null)}
          onSubmit={(reason) => cancelAppointment(activeAppointment.id, reason)}
        />
      )}
    </main>
  );
}
