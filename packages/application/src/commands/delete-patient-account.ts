import { cancelAppointment as applyCancel } from "@healthcare/domain";
import type { AppointmentRepository, PatientRepository } from "../ports.js";

export interface DeletePatientAccountDeps {
  patients: PatientRepository;
  appointments: AppointmentRepository;
}

const ACCOUNT_CLOSED_REASON = "Patient account closed";

export async function deletePatientAccount(
  patientId: string,
  deps: DeletePatientAccountDeps,
): Promise<void> {
  const appointments = await deps.appointments.listByPatientId(patientId);
  for (const appointment of appointments) {
    if (appointment.status === "cancelled") continue;
    const cancelled = applyCancel(appointment, ACCOUNT_CLOSED_REASON);
    await deps.appointments.update({ ...appointment, ...cancelled });
  }

  await deps.patients.softDelete(patientId);
}
