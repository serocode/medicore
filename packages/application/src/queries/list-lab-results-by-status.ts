import type { LabResultStatus } from "@healthcare/domain";
import type { LabResultRepository, LabResultWithPatientName } from "../ports.js";

// Cross-patient, name-joined — backs the dashboard widgets ("Pending
// Laboratory Requests", "Results Awaiting Review"), which the frontend
// selects by passing different status filters for the same endpoint.
export async function listLabResultsByStatus(
  statuses: LabResultStatus[] | undefined,
  deps: { labResults: LabResultRepository },
): Promise<LabResultWithPatientName[]> {
  return deps.labResults.listAllWithPatientName(statuses);
}
