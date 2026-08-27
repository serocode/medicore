import { cancelLabResult as applyCancelLabResult } from "@healthcare/domain";
import { LabResultNotFoundError } from "../errors.js";
import type { LabResult, LabResultRepository } from "../ports.js";

export interface CancelLabRequestInput {
  labResultId: string;
  reason: string;
}

export interface CancelLabRequestDeps {
  labResults: LabResultRepository;
}

// Only a requested/pending request can be cancelled — once a result has
// been uploaded, cancelling no longer makes sense (see the domain rule).
export async function cancelLabRequest(
  input: CancelLabRequestInput,
  deps: CancelLabRequestDeps,
): Promise<LabResult> {
  const existing = await deps.labResults.findById(input.labResultId);
  if (!existing) {
    throw new LabResultNotFoundError();
  }

  const cancelled = applyCancelLabResult(existing, input.reason);

  return deps.labResults.update(
    {
      ...existing,
      status: cancelled.status,
      cancellationReason: cancelled.cancellationReason,
    },
    existing.status,
  );
}
