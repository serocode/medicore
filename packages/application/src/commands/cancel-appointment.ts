import { cancelAppointment as applyCancel } from "@healthcare/domain";
import { AppointmentNotFoundError } from "../errors.js";
import type { Appointment, AppointmentRepository } from "../ports.js";

export interface CancelAppointmentInput {
  appointmentId: string;
  reason: string;
}

export interface CancelAppointmentDeps {
  appointments: AppointmentRepository;
}

export async function cancelAppointment(
  input: CancelAppointmentInput,
  deps: CancelAppointmentDeps,
): Promise<Appointment> {
  const appointment = await deps.appointments.findById(input.appointmentId);
  if (!appointment) {
    throw new AppointmentNotFoundError();
  }

  const cancelled = applyCancel(appointment, input.reason);
  return deps.appointments.update({ ...appointment, ...cancelled });
}
