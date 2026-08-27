import type { AppointmentStatus } from "@healthcare/domain";
import type { Appointment, AppointmentRepository } from "../ports.js";

export interface ListAppointmentsFilter {
  patientId?: string;
  status?: AppointmentStatus;
}

export async function listAppointments(
  filter: ListAppointmentsFilter,
  deps: { appointments: AppointmentRepository },
): Promise<Appointment[]> {
  if (filter.patientId) {
    const owned = await deps.appointments.listByPatientId(filter.patientId);
    return filter.status ? owned.filter((a) => a.status === filter.status) : owned;
  }

  return deps.appointments.listAll(filter.status);
}
