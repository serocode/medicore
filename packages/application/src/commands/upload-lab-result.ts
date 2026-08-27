import { receiveLabResult as applyReceiveResult } from "@healthcare/domain";
import { LabResultNotFoundError } from "../errors.js";
import type {
  LabResult,
  LabResultParameter,
  LabResultRepository,
  NewLabResultParameter,
  StaffRole,
} from "../ports.js";

export interface UploadLabResultInput {
  labResultId: string;
  datePerformed?: Date | null;
  dateReleased?: Date | null;
  facility?: string | null;
  findings?: string | null;
  summary?: string | null;
  interpretation?: string | null;
  remarks?: string | null;
  reportFilePath: string;
  uploadedByUserId: string;
  uploadedByName: string;
  uploadedByRole: StaffRole;
  parameters: NewLabResultParameter[];
}

export interface UploadLabResultDeps {
  labResults: LabResultRepository;
}

export interface UploadLabResultResult {
  labResult: LabResult;
  parameters: LabResultParameter[];
}

// Serves both the first upload and a later replace of the same result.
// First upload transitions requested/pending -> result_available via the
// domain rule; replacing an already-available (not yet reviewed) result
// keeps the status as-is. Uploading onto a reviewed or cancelled result is
// rejected by that same domain transition, since neither is a legal source
// state for it.
export async function uploadLabResult(
  input: UploadLabResultInput,
  deps: UploadLabResultDeps,
): Promise<UploadLabResultResult> {
  const existing = await deps.labResults.findById(input.labResultId);
  if (!existing) {
    throw new LabResultNotFoundError();
  }

  const status =
    existing.status === "result_available" ? existing.status : applyReceiveResult(existing).status;

  const labResult = await deps.labResults.update(
    {
      ...existing,
      status,
      datePerformed: input.datePerformed ?? null,
      dateReleased: input.dateReleased ?? null,
      facility: input.facility ?? null,
      findings: input.findings ?? null,
      summary: input.summary ?? null,
      interpretation: input.interpretation ?? null,
      remarks: input.remarks ?? null,
      reportFilePath: input.reportFilePath,
      uploadedByUserId: input.uploadedByUserId,
      uploadedByName: input.uploadedByName,
      uploadedByRole: input.uploadedByRole,
      uploadedAt: new Date(),
    },
    existing.status,
  );

  const parameters = await deps.labResults.replaceParameters(existing.id, input.parameters);

  return { labResult, parameters };
}
