import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { Field, Textarea } from "../components/Field";
import { FormSection } from "../components/FormSection";
import { LabResultDetailView } from "../components/LabResultDetailView";
import { ReviewLabResultForm } from "../components/ReviewLabResultForm";
import { UploadLabResultForm } from "../components/UploadLabResultForm";
import { apiFetch } from "../lib/api-client";
import type { LabResult, LabResultParameter } from "../lib/types";
import { useStaffProfile } from "../lib/use-staff-profile";

interface LabResultDetail {
  labResult: LabResult;
  parameters: LabResultParameter[];
}

export function LabResultDetailPage() {
  const { patientId, labResultId } = useParams<{ patientId: string; labResultId: string }>();
  const { data: profile } = useStaffProfile();
  const [detail, setDetail] = useState<LabResultDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | undefined>(undefined);
  const [isCancelling, setIsCancelling] = useState(false);

  const load = useCallback(() => {
    if (!patientId || !labResultId) return;
    apiFetch<LabResultDetail>(`/api/patients/${patientId}/lab-results/${labResultId}`)
      .then(setDetail)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [patientId, labResultId]);

  useEffect(() => {
    load();
  }, [load]);

  async function cancelRequest() {
    if (!patientId || !labResultId || isCancelling) return;
    setCancelError(undefined);
    setIsCancelling(true);
    try {
      await apiFetch(`/api/patients/${patientId}/lab-results/${labResultId}/cancel`, {
        method: "PATCH",
        body: JSON.stringify({ reason: cancelReason }),
      });
      load();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setIsCancelling(false);
    }
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-red-600">
        {error}
      </main>
    );
  }
  if (!detail || !patientId || !labResultId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading…
      </main>
    );
  }

  const { labResult, parameters } = detail;
  const canUpload = labResult.status !== "cancelled" && labResult.status !== "reviewed";
  const canReview = profile?.role === "doctor" && labResult.status === "result_available";
  const canCancel = labResult.status === "requested" || labResult.status === "pending";

  return (
    <AuthLayout wide>
      <div className="flex flex-col gap-8">
        <LabResultDetailView labResult={labResult} parameters={parameters} />

        {canCancel && (
          <FormSection title="Cancel Request">
            <div className="flex flex-col gap-2">
              <Field
                label="Reason for cancellation"
                htmlFor="cancellationReason"
                error={cancelError}
              >
                <Textarea
                  id="cancellationReason"
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                />
              </Field>
              <Button
                variant="danger"
                className="self-start"
                disabled={isCancelling}
                onClick={cancelRequest}
              >
                {isCancelling ? "Cancelling…" : "Cancel Request"}
              </Button>
            </div>
          </FormSection>
        )}

        {canUpload && (
          <FormSection title={labResult.reportFilePath ? "Replace Result" : "Upload Result"}>
            <UploadLabResultForm
              patientId={patientId}
              labResultId={labResultId}
              onSuccess={() => load()}
            />
          </FormSection>
        )}

        {canReview && (
          <FormSection title="Review Result">
            <ReviewLabResultForm
              patientId={patientId}
              labResultId={labResultId}
              onSuccess={() => load()}
            />
          </FormSection>
        )}
      </div>
    </AuthLayout>
  );
}
