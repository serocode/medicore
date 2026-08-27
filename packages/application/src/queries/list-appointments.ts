import type { AppointmentStatus } from "@healthcare/domain";
import type { Appointment, AppointmentRepository, AppointmentWithDetails } from "../ports.js";

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

export async function listAppointmentsWithDetails(
  filter: ListAppointmentsFilter,
  deps: { appointments: AppointmentRepository },
): Promise<AppointmentWithDetails[]> {
  if (filter.patientId) {
    return deps.appointments.listByPatientIdDetailed(filter.patientId, filter.status);
  }

  return deps.appointments.listAllDetailed(filter.status);
}
