import { CalendarCheck, CalendarX, CircleDashed } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppointmentActionModal } from "../components/AppointmentActionModal";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { Card, CardHeader } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { StaffManagementSection } from "../components/StaffManagementSection";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { StatusMessage } from "../components/StatusMessage";
import { TabPanel, Tabs } from "../components/Tabs";
import { apiFetch } from "../lib/api-client";
import { displayName, formatDateTime } from "../lib/format";
import type { Appointment, AppointmentStatus } from "../lib/types";

type Stats = Record<AppointmentStatus, number>;

interface ActiveAction {
  id: string;
  mode: "confirm" | "cancel";
}

type Tab = "appointments" | "staff";

const TABS = [
  { id: "appointments" as const, label: "Appointments" },
  { id: "staff" as const, label: "Staff" },
];

export function AdminDashboardPage() {
  const [tab, setTab] = useState<Tab>("appointments");
  const [stats, setStats] = useState<Stats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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
      setError(err instanceof Error ? err.message : "We couldn't load the dashboard.");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // These throw on failure rather than swallowing — the modal that called them
  // owns the error display, and closing on a failed request would hide it.
  async function confirmAppointment(id: string, scheduledAt: string) {
    await apiFetch(`/api/appointments/${id}/confirm`, {
      method: "PATCH",
      body: JSON.stringify({ scheduledAt }),
    });
    setActiveAction(null);
    setNotice("Appointment scheduled. The patient has been emailed.");
    await refresh();
  }

  async function cancelAppointment(id: string, reason: string) {
    await apiFetch(`/api/appointments/${id}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });
    setActiveAction(null);
    setNotice("Appointment cancelled. The patient has been emailed.");
    await refresh();
  }

  const activeAppointment = appointments?.find((a) => a.id === activeAction?.id) ?? null;

  return (
    <>
      <PageHeader
        title="Clinic administration"
        description="Confirm or cancel appointment requests, and manage who can sign in as staff."
      />

      {error && <StatusMessage tone="error">{error}</StatusMessage>}
      {notice && <StatusMessage tone="success">{notice}</StatusMessage>}

      <Tabs
        label="Administration sections"
        tabs={TABS}
        activeId={tab}
        onChange={setTab}
        idPrefix="admin"
      />

      <TabPanel id="appointments" activeId={tab} idPrefix="admin">
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={CircleDashed}
              count={stats?.pending ?? 0}
              label="Awaiting confirmation"
              tone="accent"
            />
            <StatCard
              icon={CalendarCheck}
              count={stats?.scheduled ?? 0}
              label="Scheduled"
              tone="primary"
            />
            <StatCard
              icon={CalendarX}
              count={stats?.cancelled ?? 0}
              label="Cancelled"
              tone="danger"
            />
          </div>

          <Card>
            <CardHeader
              title="Appointment requests"
              description="Newest requests need a confirmed time before the patient hears back."
            />

            {appointments === null && !error && (
              <output className="block px-5 py-6 text-center text-sm text-ink-muted">
                Loading appointments…
              </output>
            )}

            {appointments?.length === 0 && (
              <EmptyState
                bare
                icon={CalendarCheck}
                title="No appointments yet"
                description="Requests appear here as soon as a patient books."
              />
            )}

            {appointments && appointments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-2xl text-left text-sm">
                  <thead className="bg-surface-low text-ink-muted">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-display font-semibold">
                        Patient
                      </th>
                      <th scope="col" className="px-5 py-3 font-display font-semibold">
                        Status
                      </th>
                      <th scope="col" className="px-5 py-3 font-display font-semibold">
                        Appointment
                      </th>
                      <th scope="col" className="px-5 py-3 font-display font-semibold">
                        Physician
                      </th>
                      <th scope="col" className="px-5 py-3 text-right font-display font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {appointments.map((appointment) => (
                      <tr key={appointment.id} className="hover:bg-surface">
                        <td className="px-5 py-3 font-medium text-ink">
                          {displayName(appointment.patientName)}
                          <span className="block text-caption font-normal text-ink-subtle">
                            {appointment.reason}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={appointment.status} />
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-ink-muted">
                          {formatDateTime(
                            appointment.status === "scheduled" && appointment.scheduledAt
                              ? appointment.scheduledAt
                              : appointment.preferredSchedule,
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={appointment.doctorName}
                              imageUrl={appointment.doctorImageUrl}
                              size={28}
                            />
                            <span className="text-ink-muted">{appointment.doctorName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-2">
                            {appointment.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  setActiveAction({ id: appointment.id, mode: "confirm" })
                                }
                              >
                                Schedule
                              </Button>
                            )}
                            {appointment.status !== "cancelled" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                  setActiveAction({ id: appointment.id, mode: "cancel" })
                                }
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
              </div>
            )}
          </Card>
        </div>
      </TabPanel>

      <TabPanel id="staff" activeId={tab} idPrefix="admin">
        <StaffManagementSection />
      </TabPanel>

      {activeAction && activeAppointment && activeAction.mode === "confirm" && (
        <AppointmentActionModal
          mode="confirm"
          description={`Set the time ${displayName(activeAppointment.patientName)} will be seen. They asked for ${formatDateTime(activeAppointment.preferredSchedule)}.`}
          onClose={() => setActiveAction(null)}
          onSubmit={(scheduledAt) => confirmAppointment(activeAppointment.id, scheduledAt)}
        />
      )}
      {activeAction && activeAppointment && activeAction.mode === "cancel" && (
        <AppointmentActionModal
          mode="cancel"
          description={`${displayName(activeAppointment.patientName)} will be emailed the reason you give here.`}
          onClose={() => setActiveAction(null)}
          onSubmit={(reason) => cancelAppointment(activeAppointment.id, reason)}
        />
      )}
    </>
  );
}
