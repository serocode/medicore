import { VitalsForm } from "@/features/encounters/components/VitalsForm";
import { apiFetch, applyApiErrorToForm } from "@/shared/lib/api-client";
import { MAX_CLINICAL_TEXT } from "@/shared/lib/constants";
import type { Encounter, EncounterType, StaffRole, VitalSign } from "@/shared/lib/types";
import { Button } from "@/shared/ui/Button";
import { Field, RequiredLegend, Select, Textarea } from "@/shared/ui/Field";
import { FormSection } from "@/shared/ui/FormSection";
import { StatusMessage } from "@/shared/ui/StatusMessage";
import { UnsavedChangesGuard } from "@/shared/ui/UnsavedChangesGuard";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { type FieldValues, type UseFormRegister, useForm } from "react-hook-form";
import { z } from "zod";

const ENCOUNTER_TYPE_OPTIONS: { value: EncounterType; label: string }[] = [
  { value: "consultation", label: "Consultation" },
  { value: "follow_up", label: "Follow-up" },
  { value: "nursing_check", label: "Nursing Check" },
  { value: "vitals_only", label: "Vitals Only" },
  { value: "other", label: "Other" },
];

// Matches the server ceiling so an over-long note is caught in the form
// rather than coming back as a request failure.
const clinicalText = z
  .string()
  .max(MAX_CLINICAL_TEXT, `Must be ${MAX_CLINICAL_TEXT} characters or fewer`)
  .optional();

const encounterFormSchema = z.object({
  encounterType: z.enum(["consultation", "follow_up", "nursing_check", "vitals_only", "other"]),
  chiefComplaint: clinicalText,
  subjective: clinicalText,
  objectiveFindings: clinicalText,
  assessment: clinicalText,
  diagnosis: clinicalText,
  plan: clinicalText,
  recommendations: clinicalText,
  followUpInstructions: clinicalText,
  additionalNotes: clinicalText,
  bpSystolic: z.string().optional(),
  bpDiastolic: z.string().optional(),
  heartRate: z.string().optional(),
  respiratoryRate: z.string().optional(),
  temperatureCelsius: z.string().optional(),
  oxygenSaturation: z.string().optional(),
  weightKg: z.string().optional(),
  heightCm: z.string().optional(),
  vitalsNotes: clinicalText,
});

type EncounterFormValues = z.infer<typeof encounterFormSchema>;

interface EncounterFormResult {
  encounter: Encounter;
  vitalSign: VitalSign | null;
}

interface EncounterFormProps {
  patientId: string;
  role: StaffRole;
  onSuccess: (result: EncounterFormResult) => void;
}

function toNumberOrUndefined(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export function EncounterForm({ patientId, role, onSuccess }: EncounterFormProps) {
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  // Held until the guard below has re-rendered as disabled. The parent
  // navigates in onSuccess, and calling it from inside the submit handler ran
  // while the form was still dirty — the unsaved-changes guard then blocked
  // the redirect and a saved encounter looked like it had gone nowhere.
  const [savedResult, setSavedResult] = useState<EncounterFormResult | null>(null);

  useEffect(() => {
    if (savedResult) onSuccess(savedResult);
  }, [savedResult, onSuccess]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty, isSubmitSuccessful },
  } = useForm<EncounterFormValues>({
    resolver: zodResolver(encounterFormSchema),
    // Every field needs a default, not just encounterType. React Hook Form
    // derives `isDirty` by comparing against defaultValues, so a registered
    // input missing from here reads as "" !== undefined — dirty on mount.
    // That made the unsaved-changes guard challenge people who had typed
    // nothing at all.
    defaultValues: {
      encounterType: role === "doctor" ? "consultation" : "nursing_check",
      chiefComplaint: "",
      subjective: "",
      objectiveFindings: "",
      assessment: "",
      diagnosis: "",
      plan: "",
      recommendations: "",
      followUpInstructions: "",
      additionalNotes: "",
      bpSystolic: "",
      bpDiastolic: "",
      heartRate: "",
      respiratoryRate: "",
      temperatureCelsius: "",
      oxygenSaturation: "",
      weightKg: "",
      heightCm: "",
      vitalsNotes: "",
    },
  });

  async function submit(values: EncounterFormValues) {
    setSubmitError(undefined);

    const vitals = {
      bpSystolic: toNumberOrUndefined(values.bpSystolic),
      bpDiastolic: toNumberOrUndefined(values.bpDiastolic),
      heartRate: toNumberOrUndefined(values.heartRate),
      respiratoryRate: toNumberOrUndefined(values.respiratoryRate),
      temperatureCelsius: toNumberOrUndefined(values.temperatureCelsius),
      oxygenSaturation: toNumberOrUndefined(values.oxygenSaturation),
      weightKg: toNumberOrUndefined(values.weightKg),
      heightCm: toNumberOrUndefined(values.heightCm),
      notes: values.vitalsNotes || undefined,
    };
    const hasVitals = Object.values(vitals).some((v) => v !== undefined);

    try {
      const result = await apiFetch<EncounterFormResult>(`/api/patients/${patientId}/encounters`, {
        method: "POST",
        body: JSON.stringify({
          encounterType: values.encounterType,
          chiefComplaint: values.chiefComplaint || undefined,
          subjective: values.subjective || undefined,
          objectiveFindings: values.objectiveFindings || undefined,
          assessment: values.assessment || undefined,
          diagnosis: role === "doctor" ? values.diagnosis || undefined : undefined,
          plan: values.plan || undefined,
          recommendations: values.recommendations || undefined,
          followUpInstructions: values.followUpInstructions || undefined,
          additionalNotes: values.additionalNotes || undefined,
          vitals: hasVitals ? vitals : undefined,
        }),
      });
      setSavedResult(result);
    } catch (error) {
      applyApiErrorToForm(error, setError);
      setSubmitError(error instanceof Error ? error.message : "We couldn't save this encounter.");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-8">
      {/* A part-written consultation note is the most expensive thing in this
          product to lose, so navigating away asks first. */}
      <UnsavedChangesGuard when={isDirty && !isSubmitSuccessful && !savedResult} />

      <RequiredLegend />

      <FormSection title="Encounter">
        <Field
          label="Encounter type"
          htmlFor="encounterType"
          error={errors.encounterType?.message}
          required
        >
          <Select id="encounterType" {...register("encounterType")}>
            {ENCOUNTER_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Chief complaint / reason for visit" htmlFor="chiefComplaint">
          <Textarea id="chiefComplaint" {...register("chiefComplaint")} />
        </Field>
      </FormSection>

      <FormSection
        title="Vital signs"
        description="Leave a field blank if it wasn't measured — blanks are not recorded as zero."
      >
        {/* VitalsForm's register prop is intentionally loosely typed
            (RHF's own composition pattern for sharing a sub-form across
            components) — this cast is the documented boundary for it. */}
        <VitalsForm register={register as unknown as UseFormRegister<FieldValues>} />
      </FormSection>

      {role === "doctor" ? (
        <FormSection title="SOAP note" description="Subjective, objective, assessment, plan.">
          <Field label="Subjective" htmlFor="subjective">
            <Textarea id="subjective" {...register("subjective")} />
          </Field>
          <Field label="Objective findings" htmlFor="objectiveFindings">
            <Textarea id="objectiveFindings" {...register("objectiveFindings")} />
          </Field>
          <Field label="Assessment" htmlFor="assessment">
            <Textarea id="assessment" {...register("assessment")} />
          </Field>
          <Field label="Diagnosis" htmlFor="diagnosis">
            <Textarea id="diagnosis" {...register("diagnosis")} />
          </Field>
          <Field label="Plan" htmlFor="plan">
            <Textarea id="plan" {...register("plan")} />
          </Field>
        </FormSection>
      ) : (
        <FormSection title="Nursing notes">
          <Field label="Assessment" htmlFor="assessment">
            <Textarea id="assessment" {...register("assessment")} />
          </Field>
          <Field label="Nursing observations" htmlFor="objectiveFindings">
            <Textarea id="objectiveFindings" {...register("objectiveFindings")} />
          </Field>
          <Field label="Intervention" htmlFor="plan">
            <Textarea id="plan" {...register("plan")} />
          </Field>
          <Field label="Patient response" htmlFor="recommendations">
            <Textarea id="recommendations" {...register("recommendations")} />
          </Field>
        </FormSection>
      )}

      {role === "doctor" && (
        <FormSection title="Recommendations and follow-up">
          <Field label="Recommendations" htmlFor="recommendations">
            <Textarea id="recommendations" {...register("recommendations")} />
          </Field>
          <Field label="Follow-up instructions" htmlFor="followUpInstructions">
            <Textarea id="followUpInstructions" {...register("followUpInstructions")} />
          </Field>
        </FormSection>
      )}

      <FormSection title="Additional notes">
        <Field label="Notes" htmlFor="additionalNotes">
          <Textarea id="additionalNotes" {...register("additionalNotes")} />
        </Field>
      </FormSection>

      {submitError && <StatusMessage tone="error">{submitError}</StatusMessage>}

      <Button type="submit" size="lg" className="self-start" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save encounter"}
      </Button>
    </form>
  );
}
