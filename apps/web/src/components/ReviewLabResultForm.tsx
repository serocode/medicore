import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetch } from "../lib/api-client";
import type { LabResult } from "../lib/types";
import { Button } from "./Button";
import { Field, Textarea } from "./Field";

const reviewSchema = z.object({
  reviewInterpretation: z.string().min(1, "A clinical interpretation is required"),
  reviewNotes: z.string().optional(),
  followUpRecommendation: z.string().optional(),
  actionTaken: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewLabResultFormProps {
  patientId: string;
  labResultId: string;
  onSuccess: (labResult: LabResult) => void;
}

export function ReviewLabResultForm({
  patientId,
  labResultId,
  onSuccess,
}: ReviewLabResultFormProps) {
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormValues>({ resolver: zodResolver(reviewSchema) });

  async function submit(values: ReviewFormValues) {
    setSubmitError(undefined);
    try {
      const result = await apiFetch<{ labResult: LabResult }>(
        `/api/patients/${patientId}/lab-results/${labResultId}/review`,
        {
          method: "PATCH",
          body: JSON.stringify({
            reviewInterpretation: values.reviewInterpretation,
            reviewNotes: values.reviewNotes || undefined,
            followUpRecommendation: values.followUpRecommendation || undefined,
            actionTaken: values.actionTaken || undefined,
          }),
        },
      );
      onSuccess(result.labResult);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit review");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <Field
        label="Clinical interpretation"
        htmlFor="reviewInterpretation"
        error={errors.reviewInterpretation?.message}
      >
        <Textarea id="reviewInterpretation" {...register("reviewInterpretation")} />
      </Field>
      <Field label="Notes" htmlFor="reviewNotes">
        <Textarea id="reviewNotes" {...register("reviewNotes")} />
      </Field>
      <Field label="Follow-up recommendation" htmlFor="followUpRecommendation">
        <Textarea id="followUpRecommendation" {...register("followUpRecommendation")} />
      </Field>
      <Field label="Action taken" htmlFor="actionTaken">
        <Textarea id="actionTaken" {...register("actionTaken")} />
      </Field>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Review Result"}
      </Button>
    </form>
  );
}
