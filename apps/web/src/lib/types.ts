export type AppointmentStatus = "pending" | "scheduled" | "cancelled";

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  reason: string;
  preferredSchedule: string;
  scheduledAt: string | null;
  status: AppointmentStatus;
  cancellationReason: string | null;
  notes: string | null;
}
