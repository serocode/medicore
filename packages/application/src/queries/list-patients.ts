import type { PatientRepository, PatientSummary } from "../ports.js";

export async function listPatients(deps: { patients: PatientRepository }): Promise<
  PatientSummary[]
> {
  return deps.patients.listActiveWithNames();
}
