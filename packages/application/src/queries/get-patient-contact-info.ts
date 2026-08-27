import type { PatientRepository } from "../ports.js";

export async function getPatientContactInfo(
  patientId: string,
  deps: { patients: PatientRepository },
): Promise<{ name: string; email: string } | null> {
  return deps.patients.getContactInfo(patientId);
}
