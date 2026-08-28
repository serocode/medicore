import {
  DoctorSlotUnavailableError,
  confirmAppointment as applyConfirm,
  assertWithinClinicHours,
} from "@healthcare/domain";
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

  // The confirmed time is the one the patient is actually told, so it has to
  // land in clinic hours even though an administrator sets it by hand.
  assertWithinClinicHours(input.scheduledAt);

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
