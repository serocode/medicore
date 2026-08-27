import { assertConsentGiven } from "@healthcare/domain";
import { PatientAlreadyRegisteredError } from "../errors.js";
import type { NewPatient, Patient, PatientRepository } from "../ports.js";

export interface RegisterPatientDeps {
  patients: PatientRepository;
}

export async function registerPatient(
  input: NewPatient,
  deps: RegisterPatientDeps,
): Promise<Patient> {
  assertConsentGiven(input);

  const existing = await deps.patients.findByUserId(input.userId);
  if (existing) {
    throw new PatientAlreadyRegisteredError();
  }

  return deps.patients.create(input);
}
