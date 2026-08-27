import { reviewLabResult as applyReview } from "@healthcare/domain";
import {
  LabResultNotFoundError,
  ReviewInterpretationRequiredError,
  StaffPermissionError,
} from "../errors.js";
import type { LabResult, LabResultRepository, StaffRole } from "../ports.js";

export interface ReviewLabResultInput {
  labResultId: string;
  reviewedByUserId: string;
  reviewedByName: string;
  reviewedByRole: StaffRole;
  reviewInterpretation: string;
  reviewNotes?: string | null;
  followUpRecommendation?: string | null;
  actionTaken?: string | null;
}

export interface ReviewLabResultDeps {
  labResults: LabResultRepository;
}

// Doctor-only, mirroring the nurse-can't-diagnose rule in record-encounter.ts
// — uploading a result and clinically reviewing it are distinct roles here.
export async function reviewLabResult(
  input: ReviewLabResultInput,
  deps: ReviewLabResultDeps,
): Promise<LabResult> {
  if (input.reviewedByRole !== "doctor") {
    throw new StaffPermissionError("Only doctors can review laboratory results");
  }

  if (!input.reviewInterpretation.trim()) {
    throw new ReviewInterpretationRequiredError();
  }

  const existing = await deps.labResults.findById(input.labResultId);
  if (!existing) {
    throw new LabResultNotFoundError();
  }

  const reviewed = applyReview(existing);

  return deps.labResults.update(
    {
      ...existing,
      status: reviewed.status,
      reviewedByUserId: input.reviewedByUserId,
      reviewedByName: input.reviewedByName,
      reviewedAt: new Date(),
      reviewInterpretation: input.reviewInterpretation,
      reviewNotes: input.reviewNotes ?? null,
      followUpRecommendation: input.followUpRecommendation ?? null,
      actionTaken: input.actionTaken ?? null,
    },
    existing.status,
  );
}
