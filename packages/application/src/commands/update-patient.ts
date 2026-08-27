import { assertConsentGiven } from "@healthcare/domain";
import type { Patient, PatientRepository } from "../ports.js";

export interface UpdatePatientDeps {
  patients: PatientRepository;
}

export async function updatePatient(input: Patient, deps: UpdatePatientDeps): Promise<Patient> {
  assertConsentGiven(input);
  return deps.patients.update(input);
}
