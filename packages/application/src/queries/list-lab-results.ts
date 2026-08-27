import type { LabResult, LabResultRepository } from "../ports.js";

export async function listLabResultsForPatient(
  patientId: string,
  deps: { labResults: LabResultRepository },
): Promise<LabResult[]> {
  return deps.labResults.listByPatientId(patientId);
}
