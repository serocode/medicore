import { sendLabRequestToLaboratory } from "@healthcare/domain";
import { LabResultNotFoundError } from "../errors.js";
import type { LabResult, LabResultRepository } from "../ports.js";

export interface SendLabRequestInput {
  labResultId: string;
}

export interface SendLabRequestDeps {
  labResults: LabResultRepository;
}

/** Marks an ordered test as handed over to the laboratory. */
export async function sendLabRequest(
  input: SendLabRequestInput,
  deps: SendLabRequestDeps,
): Promise<LabResult> {
  const existing = await deps.labResults.findById(input.labResultId);
  if (!existing) {
    throw new LabResultNotFoundError();
  }

  const sent = sendLabRequestToLaboratory(existing);

  return deps.labResults.update({ ...existing, status: sent.status }, existing.status);
}
