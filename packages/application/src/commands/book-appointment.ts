import { AppointmentInPastError, assertWithinClinicHours } from "@healthcare/domain";
import type { Appointment, AppointmentRepository, NewAppointment } from "../ports.js";

export interface BookAppointmentDeps {
  appointments: AppointmentRepository;
}

export async function bookAppointment(
  input: NewAppointment,
  deps: BookAppointmentDeps,
): Promise<Appointment> {
  // Enforced here rather than only in the booking form: the form can be
  // bypassed, and a request for 03:00 on a Sunday — or for a date that has
  // already passed — is not something the clinic can honour.
  if (input.preferredSchedule.getTime() <= Date.now()) {
    throw new AppointmentInPastError();
  }
  assertWithinClinicHours(input.preferredSchedule);

  return deps.appointments.create(input);
}
