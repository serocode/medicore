import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiFetch } from "../lib/api-client";
import type { LabResult, LabTestCatalogItem, LabTestCategory } from "../lib/types";
import { useLabTestCatalog } from "../lib/use-lab-test-catalog";
import { Button } from "./Button";
import { Field, Select, Textarea } from "./Field";

const CATEGORY_LABELS: Record<LabTestCategory, string> = {
  hematology: "Hematology",
  blood_chemistry: "Blood Chemistry",
  urinalysis: "Urinalysis",
  microbiology: "Microbiology",
  immunology: "Immunology",
  imaging: "Imaging",
  pathology: "Pathology",
  other: "Other",
};

const requestSchema = z.object({
  catalogItemId: z.string().uuid("Select a test"),
  requestNotes: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

interface RequestLabTestFormProps {
  patientId: string;
  onSuccess: (labResult: LabResult) => void;
}

function groupByCategory(items: LabTestCatalogItem[]): Map<LabTestCategory, LabTestCatalogItem[]> {
  const groups = new Map<LabTestCategory, LabTestCatalogItem[]>();
  for (const item of items) {
    const group = groups.get(item.category) ?? [];
    group.push(item);
    groups.set(item.category, group);
  }
  return groups;
}

export function RequestLabTestForm({ patientId, onSuccess }: RequestLabTestFormProps) {
  const { data: catalog, isLoading, error: catalogError } = useLabTestCatalog();
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormValues>({ resolver: zodResolver(requestSchema) });

  async function submit(values: RequestFormValues) {
    setSubmitError(undefined);
    try {
      const result = await apiFetch<{ labResult: LabResult }>(
        `/api/patients/${patientId}/lab-results`,
        {
          method: "POST",
          body: JSON.stringify({
            catalogItemId: values.catalogItemId,
            requestNotes: values.requestNotes || undefined,
          }),
        },
      );
      onSuccess(result.labResult);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to request test");
    }
  }

  if (isLoading) return <p className="text-sm text-slate-500">Loading test catalog…</p>;
  if (catalogError) return <p className="text-sm text-red-600">{catalogError}</p>;

  const groups = groupByCategory(catalog ?? []);

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <Field label="Test" htmlFor="catalogItemId" error={errors.catalogItemId?.message}>
        <Select id="catalogItemId" defaultValue="" {...register("catalogItemId")}>
          <option value="" disabled>
            Select a test
          </option>
          {[...groups.entries()].map(([category, items]) => (
            <optgroup key={category} label={CATEGORY_LABELS[category]}>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </Field>

      <Field label="Reason / clinical indication" htmlFor="requestNotes">
        <Textarea id="requestNotes" {...register("requestNotes")} />
      </Field>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Requesting…" : "Request Test"}
      </Button>
    </form>
  );
}
