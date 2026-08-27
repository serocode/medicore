import type { AppointmentStatus } from "@healthcare/domain";
import type { AppointmentRepository } from "../ports.js";

export async function getAppointmentStats(deps: {
  appointments: AppointmentRepository;
}): Promise<Record<AppointmentStatus, number>> {
  return deps.appointments.countByStatus();
}
