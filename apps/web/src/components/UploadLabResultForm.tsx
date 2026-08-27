import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetchForm } from "../lib/api-client";
import type { LabResult, LabResultParameter } from "../lib/types";
import { Button } from "./Button";
import { Field, Select, TextInput, Textarea } from "./Field";
import { FileUploader } from "./FileUploader";
import { FormSection } from "./FormSection";

const parameterSchema = z.object({
  parameterName: z.string().min(1, "Required"),
  value: z.string().min(1, "Required"),
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
    formState: { isSubmitting },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { parameters: [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "parameters" });

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
        values.parameters.map((p) => ({
          ...p,
          flag: p.flag || undefined,
        })),
      ),
    );

    try {
      const result = await apiFetchForm<{ labResult: LabResult; parameters: LabResultParameter[] }>(
        `/api/patients/${patientId}/lab-results/${labResultId}/result`,
        formData,
      );
      onSuccess(result);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to upload result");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-8">
      <FormSection title="Original Report">
        <FileUploader
          onChange={setReportFile}
          accept="application/pdf,image/jpeg,image/png"
          error={fileError}
        />
      </FormSection>

      <FormSection title="Result Information">
        <div className="grid gap-4 sm:grid-cols-2">
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
        <Field label="Findings" htmlFor="findings">
          <Textarea id="findings" {...register("findings")} />
        </Field>
        <Field label="Summary" htmlFor="summary">
          <Textarea id="summary" {...register("summary")} />
        </Field>
        <Field label="Interpretation" htmlFor="interpretation">
          <Textarea id="interpretation" {...register("interpretation")} />
        </Field>
        <Field label="Remarks" htmlFor="remarks">
          <Textarea id="remarks" {...register("remarks")} />
        </Field>
      </FormSection>

      <FormSection
        title="Structured Results"
        description="Add one row per test parameter. Different tests have different parameters — only add what applies."
      >
        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-6"
            >
              <TextInput
                placeholder="Parameter"
                {...register(`parameters.${index}.parameterName`)}
                className="sm:col-span-2"
              />
              <TextInput placeholder="Value" {...register(`parameters.${index}.value`)} />
              <TextInput placeholder="Unit" {...register(`parameters.${index}.unit`)} />
              <TextInput
                placeholder="Reference range"
                {...register(`parameters.${index}.referenceRange`)}
              />
              <div className="flex items-center gap-1">
                <Select {...register(`parameters.${index}.flag`)} defaultValue="">
                  <option value="">Normal</option>
                  <option value="abnormal">Abnormal</option>
                  <option value="critical">Critical</option>
                </Select>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Remove parameter"
                  className="text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() =>
              append({
                parameterName: "",
                value: "",
                unit: "",
                referenceRange: "",
                flag: "",
                remarks: "",
              })
            }
          >
            <Plus className="mr-1 inline h-3.5 w-3.5" />
            Add parameter
          </Button>
        </div>
      </FormSection>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Uploading…" : "Upload Result"}
      </Button>
    </form>
  );
}
