import { CancellationReasonRequiredError, InvalidAppointmentTransitionError } from "./errors.js";

export type AppointmentStatus = "pending" | "scheduled" | "cancelled";

export interface AppointmentState {
  id: string;
  doctorId: string;
  status: AppointmentStatus;
  scheduledAt: Date | null;
  cancellationReason: string | null;
}

export function confirmAppointment(
  appointment: AppointmentState,
  scheduledAt: Date,
): AppointmentState {
  if (appointment.status !== "pending") {
    throw new InvalidAppointmentTransitionError(appointment.status, "scheduled");
  }

  return { ...appointment, status: "scheduled", scheduledAt };
}

export function cancelAppointment(appointment: AppointmentState, reason: string): AppointmentState {
  if (appointment.status === "cancelled") {
    throw new InvalidAppointmentTransitionError(appointment.status, "cancelled");
  }
  if (!reason.trim()) {
    throw new CancellationReasonRequiredError();
  }

  return { ...appointment, status: "cancelled", cancellationReason: reason };
}
