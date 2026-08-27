import { describe, expect, it } from "vitest";
import { CancellationReasonRequiredError, InvalidLabResultTransitionError } from "./errors.js";
import { cancelLabResult, receiveLabResult, reviewLabResult } from "./laboratory.js";
import type { LabResultState } from "./laboratory.js";

function requestedResult(): LabResultState {
  return { id: "lab-1", status: "requested", cancellationReason: null };
}

describe("receiveLabResult", () => {
  it("moves a requested result to result_available", () => {
    const result = receiveLabResult(requestedResult());
    expect(result.status).toBe("result_available");
  });

  it("moves a pending result to result_available", () => {
    const result = receiveLabResult({ ...requestedResult(), status: "pending" });
    expect(result.status).toBe("result_available");
  });

  it("rejects receiving a result that's already available", () => {
    const available: LabResultState = { ...requestedResult(), status: "result_available" };
    expect(() => receiveLabResult(available)).toThrow(InvalidLabResultTransitionError);
  });

  it("rejects receiving a cancelled result", () => {
    const cancelled: LabResultState = { ...requestedResult(), status: "cancelled" };
    expect(() => receiveLabResult(cancelled)).toThrow(InvalidLabResultTransitionError);
  });
});

describe("reviewLabResult", () => {
  it("moves a result_available result to reviewed", () => {
    const available: LabResultState = { ...requestedResult(), status: "result_available" };
    const result = reviewLabResult(available);
    expect(result.status).toBe("reviewed");
  });

  it("rejects reviewing a result with no upload yet", () => {
    expect(() => reviewLabResult(requestedResult())).toThrow(InvalidLabResultTransitionError);
  });

  it("rejects reviewing an already-reviewed result", () => {
    const reviewed: LabResultState = { ...requestedResult(), status: "reviewed" };
    expect(() => reviewLabResult(reviewed)).toThrow(InvalidLabResultTransitionError);
  });
});

describe("cancelLabResult", () => {
  it("cancels a requested result with a reason", () => {
    const result = cancelLabResult(requestedResult(), "Ordered in error");
    expect(result.status).toBe("cancelled");
    expect(result.cancellationReason).toBe("Ordered in error");
  });

  it("requires a non-empty reason", () => {
    expect(() => cancelLabResult(requestedResult(), "   ")).toThrow(
      CancellationReasonRequiredError,
    );
  });

  it("rejects cancelling a result that already has a result available", () => {
    const available: LabResultState = { ...requestedResult(), status: "result_available" };
    expect(() => cancelLabResult(available, "reason")).toThrow(InvalidLabResultTransitionError);
  });
});
