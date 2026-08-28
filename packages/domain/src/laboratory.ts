import { CancellationReasonRequiredError, InvalidLabResultTransitionError } from "./errors.js";

export type LabResultStatus =
  | "requested"
  | "pending"
  | "result_available"
  | "reviewed"
  | "cancelled";

export interface LabResultState {
  id: string;
  status: LabResultStatus;
  cancellationReason: string | null;
}

export function receiveLabResult(result: LabResultState): LabResultState {
  if (result.status !== "requested" && result.status !== "pending") {
    throw new InvalidLabResultTransitionError(result.status, "result_available");
  }
  return { ...result, status: "result_available" };
}

export function reviewLabResult(result: LabResultState): LabResultState {
  if (result.status !== "result_available") {
    throw new InvalidLabResultTransitionError(result.status, "reviewed");
  }
  return { ...result, status: "reviewed" };
}

export function cancelLabResult(result: LabResultState, reason: string): LabResultState {
  if (result.status !== "requested" && result.status !== "pending") {
    throw new InvalidLabResultTransitionError(result.status, "cancelled");
  }
  if (!reason.trim()) {
    throw new CancellationReasonRequiredError();
  }
  return { ...result, status: "cancelled", cancellationReason: reason };
}

/**
 * The specimen has left the clinic for the laboratory. This is the step that
 * makes "pending" reachable — the status was modelled through the whole stack
 * (domain type, database enum, status filter, dashboard query) but nothing
 * ever produced it, so users could filter for a state that never existed.
 */
export function sendLabRequestToLaboratory(result: LabResultState): LabResultState {
  if (result.status !== "requested") {
    throw new InvalidLabResultTransitionError(result.status, "pending");
  }
  return { ...result, status: "pending" };
}
