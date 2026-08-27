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

  const existing = await deps.patients.findByUserIdIncludingDeleted(input.userId);
  if (existing) {
    if (!existing.deletedAt) {
      throw new PatientAlreadyRegisteredError();
    }
    // Reactivate a previously soft-deleted profile instead of inserting a
    // second row, which would violate the unique constraint on userId.
    return deps.patients.update({ ...existing, ...input, deletedAt: null });
  }

  return deps.patients.create(input);
}
