import { DoctorSlotUnavailableError, confirmAppointment as applyConfirm } from "@healthcare/domain";
import { AppointmentNotFoundError } from "../errors.js";
import type { Appointment, AppointmentRepository } from "../ports.js";

export interface ConfirmAppointmentInput {
  appointmentId: string;
  scheduledAt: Date;
}

export interface ConfirmAppointmentDeps {
  appointments: AppointmentRepository;
}

export async function confirmAppointment(
  input: ConfirmAppointmentInput,
  deps: ConfirmAppointmentDeps,
): Promise<Appointment> {
  const appointment = await deps.appointments.findById(input.appointmentId);
  if (!appointment) {
    throw new AppointmentNotFoundError();
  }

  const conflict = await deps.appointments.findScheduledForDoctorAt(
    appointment.doctorId,
    input.scheduledAt,
  );
  if (conflict && conflict.id !== appointment.id) {
    throw new DoctorSlotUnavailableError(appointment.doctorId, input.scheduledAt);
  }

  const confirmed = applyConfirm(appointment, input.scheduledAt);
  return deps.appointments.update({ ...appointment, ...confirmed });
}
