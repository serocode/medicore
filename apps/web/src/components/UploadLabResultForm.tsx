import { zodResolver } from "@hookform/resolvers/zod";
import { CornerDownLeft, Plus, Trash2 } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetchForm } from "../lib/api-client";
import type { LabResult, LabResultParameter } from "../lib/types";
import { Button } from "./Button";
import { Field, RequiredLegend, Select, TextInput, Textarea } from "./Field";
import { FileUploader } from "./FileUploader";
import { FormSection } from "./FormSection";
import { StatusMessage } from "./StatusMessage";

const parameterSchema = z.object({
  parameterName: z.string().min(1, "Name the parameter"),
  value: z.string().min(1, "Enter the measured value"),
  unit: z.string().optional(),
  referenceRange: z.string().optional(),
  flag: z.enum(["normal", "abnormal", "critical", ""]).optional(),
  remarks: z.string().optional(),
});

const uploadSchema = z.object({
  datePerformed: z.string().optional(),
  dateReleased: z.string().optional(),
  facility: z.string().optional(),
  findings: z.string().optional(),
  summary: z.string().optional(),
  interpretation: z.string().optional(),
  remarks: z.string().optional(),
  parameters: z.array(parameterSchema),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

const EMPTY_PARAMETER = {
  parameterName: "",
  value: "",
  unit: "",
  referenceRange: "",
  flag: "" as const,
  remarks: "",
};

interface UploadLabResultFormProps {
  patientId: string;
  labResultId: string;
  onSuccess: (result: { labResult: LabResult; parameters: LabResultParameter[] }) => void;
}

export function UploadLabResultForm({
  patientId,
  labResultId,
  onSuccess,
}: UploadLabResultFormProps) {
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { parameters: [EMPTY_PARAMETER] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "parameters" });

  /**
   * Entering a panel of ten parameters should not mean ten trips to a button.
   * Enter anywhere in a row appends the next one and focuses it — RHF's
   * `shouldFocus` lands the caret on the new Parameter box.
   */
  function handleRowKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter") return;
    const target = event.target as HTMLElement;
    if (target.tagName !== "INPUT") return;
    event.preventDefault();
    append(EMPTY_PARAMETER);
  }

  async function submit(values: UploadFormValues) {
    setSubmitError(undefined);
    if (!reportFile) {
      setFileError("The original report file is required");
      return;
    }
    setFileError(undefined);

    const formData = new FormData();
    formData.append("reportFile", reportFile);
    if (values.datePerformed) formData.append("datePerformed", values.datePerformed);
    if (values.dateReleased) formData.append("dateReleased", values.dateReleased);
    if (values.facility) formData.append("facility", values.facility);
    if (values.findings) formData.append("findings", values.findings);
    if (values.summary) formData.append("summary", values.summary);
    if (values.interpretation) formData.append("interpretation", values.interpretation);
    if (values.remarks) formData.append("remarks", values.remarks);
    formData.append(
      "parameters",
      JSON.stringify(
        // A trailing blank row is an artefact of the entry flow, not data.
        values.parameters
          .filter((p) => p.parameterName.trim() || p.value.trim())
          .map((p) => ({ ...p, flag: p.flag || undefined })),
      ),
    );

    try {
      const result = await apiFetchForm<{ labResult: LabResult; parameters: LabResultParameter[] }>(
        `/api/patients/${patientId}/lab-results/${labResultId}/result`,
        formData,
      );
      onSuccess(result);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We couldn't upload this result.");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-8">
      <RequiredLegend />

      <FormSection title="Original report">
        <Field
          label="Scanned or exported report"
          htmlFor="reportFile"
          error={fileError}
          hint="The signed laboratory document. JPEG, PNG, or PDF."
          required
        >
          <FileUploader
            onChange={setReportFile}
            accept="application/pdf,image/jpeg,image/png"
            error={fileError}
          />
        </Field>
      </FormSection>

      <FormSection title="Result details">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date performed" htmlFor="datePerformed">
            <TextInput id="datePerformed" type="date" {...register("datePerformed")} />
          </Field>
          <Field label="Date released" htmlFor="dateReleased">
            <TextInput id="dateReleased" type="date" {...register("dateReleased")} />
          </Field>
          <Field label="Laboratory / facility" htmlFor="facility">
            <TextInput id="facility" {...register("facility")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Findings" htmlFor="findings">
            <Textarea id="findings" {...register("findings")} />
          </Field>
          <Field label="Summary" htmlFor="summary">
            <Textarea id="summary" {...register("summary")} />
          </Field>
          <Field label="Laboratory interpretation" htmlFor="interpretation">
            <Textarea id="interpretation" {...register("interpretation")} />
          </Field>
          <Field label="Remarks" htmlFor="remarks">
            <Textarea id="remarks" {...register("remarks")} />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Measured parameters"
        description="One row per value on the report. Press Enter in any row to start the next one."
      >
        {/* Column headers carry the meaning on wide screens; each control keeps
            its own <label>, hidden there and shown when the grid stacks. */}
        <div className="hidden gap-2 px-3 font-display text-caption font-semibold uppercase tracking-wide text-ink-subtle sm:grid sm:grid-cols-[1.5rem_1.8fr_1fr_0.9fr_1.4fr_1.4fr_2rem]">
          <span aria-hidden="true" />
          <span>Parameter</span>
          <span>Value</span>
          <span>Unit</span>
          <span>Reference range</span>
          <span>Flag</span>
          <span aria-hidden="true" />
        </div>

        <ul className="flex flex-col gap-3 sm:gap-2">
          {fields.map((field, index) => {
            const rowErrors = errors.parameters?.[index];
            return (
              <li key={field.id}>
                <div
                  onKeyDown={handleRowKeyDown}
                  className="grid items-start gap-2 rounded-control border border-line bg-surface-low p-3 sm:grid-cols-[1.5rem_1.8fr_1fr_0.9fr_1.4fr_1.4fr_2rem] sm:items-center sm:border-0 sm:bg-transparent sm:py-1"
                >
                  <span className="hidden pt-1 text-caption tabular-nums text-ink-subtle sm:block">
                    {index + 1}
                  </span>

                  <div>
                    <label
                      htmlFor={`parameter-name-${field.id}`}
                      className="mb-1 block font-display text-sm font-semibold text-ink sm:sr-only"
                    >
                      Parameter {index + 1} name
                    </label>
                    <TextInput
                      id={`parameter-name-${field.id}`}
                      aria-invalid={rowErrors?.parameterName ? true : undefined}
                      placeholder="Haemoglobin"
                      {...register(`parameters.${index}.parameterName`)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`parameter-value-${field.id}`}
                      className="mb-1 block font-display text-sm font-semibold text-ink sm:sr-only"
                    >
                      Parameter {index + 1} value
                    </label>
                    <TextInput
                      id={`parameter-value-${field.id}`}
                      aria-invalid={rowErrors?.value ? true : undefined}
                      placeholder="13.4"
                      {...register(`parameters.${index}.value`)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`parameter-unit-${field.id}`}
                      className="mb-1 block font-display text-sm font-semibold text-ink sm:sr-only"
                    >
                      Parameter {index + 1} unit
                    </label>
                    <TextInput
                      id={`parameter-unit-${field.id}`}
                      placeholder="g/dL"
                      {...register(`parameters.${index}.unit`)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`parameter-range-${field.id}`}
                      className="mb-1 block font-display text-sm font-semibold text-ink sm:sr-only"
                    >
                      Parameter {index + 1} reference range
                    </label>
                    <TextInput
                      id={`parameter-range-${field.id}`}
                      placeholder="12.0–15.5"
                      {...register(`parameters.${index}.referenceRange`)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`parameter-flag-${field.id}`}
                      className="mb-1 block font-display text-sm font-semibold text-ink sm:sr-only"
                    >
                      Parameter {index + 1} flag
                    </label>
                    <Select
                      id={`parameter-flag-${field.id}`}
                      defaultValue=""
                      {...register(`parameters.${index}.flag`)}
                    >
                      <option value="">Normal</option>
                      <option value="abnormal">Abnormal</option>
                      <option value="critical">Critical</option>
                    </Select>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label={`Remove parameter ${index + 1}`}
                    className="justify-self-start rounded-control p-2 text-ink-subtle transition-colors hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 sm:justify-self-center"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>

                {(rowErrors?.parameterName || rowErrors?.value) && (
                  <p role="alert" className="mt-1 px-3 text-sm text-danger">
                    {rowErrors.parameterName?.message ?? rowErrors.value?.message}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append(EMPTY_PARAMETER)}
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add parameter
          </Button>
          <p className="flex items-center gap-1.5 text-caption text-ink-subtle">
            <CornerDownLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Or press Enter in any row
          </p>
        </div>
      </FormSection>

      {submitError && <StatusMessage tone="error">{submitError}</StatusMessage>}

      <Button type="submit" size="lg" className="self-start" disabled={isSubmitting}>
        {isSubmitting ? "Uploading…" : "Upload result"}
      </Button>
    </form>
  );
}
