import type { Patient, PatientRepository } from "../ports.js";

export async function getPatientByUserId(
  userId: string,
  deps: { patients: PatientRepository },
): Promise<Patient | null> {
  return deps.patients.findByUserId(userId);
}
