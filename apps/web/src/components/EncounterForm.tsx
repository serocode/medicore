import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { type FieldValues, type UseFormRegister, useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetch } from "../lib/api-client";
import type { Encounter, EncounterType, StaffRole, VitalSign } from "../lib/types";
import { Button } from "./Button";
import { Field, Select, Textarea } from "./Field";
import { FormSection } from "./FormSection";
import { VitalsForm } from "./VitalsForm";

const ENCOUNTER_TYPE_OPTIONS: { value: EncounterType; label: string }[] = [
  { value: "consultation", label: "Consultation" },
  { value: "follow_up", label: "Follow-up" },
  { value: "nursing_check", label: "Nursing Check" },
  { value: "vitals_only", label: "Vitals Only" },
  { value: "other", label: "Other" },
];

const encounterFormSchema = z.object({
  encounterType: z.enum(["consultation", "follow_up", "nursing_check", "vitals_only", "other"]),
  chiefComplaint: z.string().optional(),
  subjective: z.string().optional(),
  objectiveFindings: z.string().optional(),
  assessment: z.string().optional(),
  diagnosis: z.string().optional(),
  plan: z.string().optional(),
  recommendations: z.string().optional(),
  followUpInstructions: z.string().optional(),
  additionalNotes: z.string().optional(),
  bpSystolic: z.string().optional(),
  bpDiastolic: z.string().optional(),
  heartRate: z.string().optional(),
  respiratoryRate: z.string().optional(),
  temperatureCelsius: z.string().optional(),
  oxygenSaturation: z.string().optional(),
  weightKg: z.string().optional(),
  heightCm: z.string().optional(),
  vitalsNotes: z.string().optional(),
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EncounterFormValues>({
    resolver: zodResolver(encounterFormSchema),
    defaultValues: { encounterType: role === "doctor" ? "consultation" : "nursing_check" },
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
      onSuccess(result);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to save encounter");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-8">
      <FormSection title="Encounter">
        <Field label="Encounter type" htmlFor="encounterType" error={errors.encounterType?.message}>
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

      <FormSection title="Vital Signs">
        {/* VitalsForm's register prop is intentionally loosely typed
            (RHF's own composition pattern for sharing a sub-form across
            components) — this cast is the documented boundary for it. */}
        <VitalsForm register={register as unknown as UseFormRegister<FieldValues>} />
      </FormSection>

      {role === "doctor" ? (
        <FormSection title="SOAP Note" description="Subjective, Objective, Assessment, Plan">
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
        <FormSection title="Nursing Notes">
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
        <FormSection title="Recommendations & Follow-up">
          <Field label="Recommendations" htmlFor="recommendations">
            <Textarea id="recommendations" {...register("recommendations")} />
          </Field>
          <Field label="Follow-up instructions" htmlFor="followUpInstructions">
            <Textarea id="followUpInstructions" {...register("followUpInstructions")} />
          </Field>
        </FormSection>
      )}

      <FormSection title="Additional Notes">
        <Field label="Notes" htmlFor="additionalNotes">
          <Textarea id="additionalNotes" {...register("additionalNotes")} />
        </Field>
      </FormSection>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save Encounter"}
      </Button>
    </form>
  );
}
