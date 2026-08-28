import { useLabTestCatalog } from "@/features/lab-results/hooks/use-lab-test-catalog";
import { apiFetch } from "@/shared/lib/api-client";
import type { LabResult, LabTestCatalogItem, LabTestCategory } from "@/shared/lib/types";
import { Button } from "@/shared/ui/Button";
import { Field, RequiredLegend, Select, Textarea } from "@/shared/ui/Field";
import { StatusMessage } from "@/shared/ui/StatusMessage";
import { zodResolver } from "@hookform/resolvers/zod";
import { FlaskConical } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const CATEGORY_LABELS: Record<LabTestCategory, string> = {
  hematology: "Hematology",
  blood_chemistry: "Blood chemistry",
  urinalysis: "Urinalysis",
  microbiology: "Microbiology",
  immunology: "Immunology",
  imaging: "Imaging",
  pathology: "Pathology",
  other: "Other",
};

const requestSchema = z.object({
  catalogItemId: z.string().uuid("Choose the test to order"),
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
      setSubmitError(error instanceof Error ? error.message : "We couldn't submit this request.");
    }
  }

  if (isLoading) {
    return <output className="text-sm text-ink-muted">Loading the test catalogue…</output>;
  }
  if (catalogError) return <StatusMessage tone="error">{catalogError}</StatusMessage>;

  const groups = groupByCategory(catalog ?? []);

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-5">
      <RequiredLegend />

      <Field label="Test" htmlFor="catalogItemId" error={errors.catalogItemId?.message} required>
        <Select
          id="catalogItemId"
          icon={FlaskConical}
          defaultValue=""
          {...register("catalogItemId")}
        >
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

      <Field
        label="Clinical indication"
        htmlFor="requestNotes"
        hint="Optional, but it tells the laboratory and the reviewing doctor what you're looking for."
      >
        <Textarea id="requestNotes" {...register("requestNotes")} />
      </Field>

      {submitError && <StatusMessage tone="error">{submitError}</StatusMessage>}

      <Button type="submit" size="lg" className="self-start" disabled={isSubmitting}>
        {isSubmitting ? "Requesting…" : "Request test"}
      </Button>
    </form>
  );
}
