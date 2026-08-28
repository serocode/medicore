import { apiFetch } from "@/shared/lib/api-client";
import type { LabResult } from "@/shared/lib/types";
import { Button } from "@/shared/ui/Button";
import { Field, RequiredLegend, Textarea } from "@/shared/ui/Field";
import { StatusMessage } from "@/shared/ui/StatusMessage";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
      setSubmitError(error instanceof Error ? error.message : "We couldn't record this review.");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-5">
      <RequiredLegend />

      <Field
        label="Clinical interpretation"
        htmlFor="reviewInterpretation"
        error={errors.reviewInterpretation?.message}
        hint="What these results mean for this patient. Signing off closes the request."
        required
      >
        <Textarea id="reviewInterpretation" rows={4} {...register("reviewInterpretation")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Notes" htmlFor="reviewNotes">
          <Textarea id="reviewNotes" {...register("reviewNotes")} />
        </Field>
        <Field label="Follow-up recommendation" htmlFor="followUpRecommendation">
          <Textarea id="followUpRecommendation" {...register("followUpRecommendation")} />
        </Field>
      </div>
      <Field label="Action taken" htmlFor="actionTaken">
        <Textarea id="actionTaken" {...register("actionTaken")} />
      </Field>

      {submitError && <StatusMessage tone="error">{submitError}</StatusMessage>}

      <Button type="submit" size="lg" className="self-start" disabled={isSubmitting}>
        {isSubmitting ? "Saving review…" : "Sign off review"}
      </Button>
    </form>
  );
}
