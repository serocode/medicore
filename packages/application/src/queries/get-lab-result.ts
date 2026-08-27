import { LabResultNotFoundError } from "../errors.js";
import type { LabResult, LabResultParameter, LabResultRepository } from "../ports.js";

export interface LabResultDetail {
  labResult: LabResult;
  parameters: LabResultParameter[];
}

export async function getLabResultDetail(
  labResultId: string,
  deps: { labResults: LabResultRepository },
): Promise<LabResultDetail> {
  const labResult = await deps.labResults.findById(labResultId);
  if (!labResult) {
    throw new LabResultNotFoundError();
  }

  const parameters = await deps.labResults.listParametersByLabResultId(labResultId);
  return { labResult, parameters };
}
