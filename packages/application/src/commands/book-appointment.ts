import type { Appointment, AppointmentRepository, NewAppointment } from "../ports.js";

export interface BookAppointmentDeps {
  appointments: AppointmentRepository;
}

export async function bookAppointment(
  input: NewAppointment,
  deps: BookAppointmentDeps,
): Promise<Appointment> {
  return deps.appointments.create(input);
}
