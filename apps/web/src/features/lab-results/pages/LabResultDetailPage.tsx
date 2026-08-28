import { LabResultDetailView } from "@/features/lab-results/components/LabResultDetailView";
import { ReviewLabResultForm } from "@/features/lab-results/components/ReviewLabResultForm";
import { UploadLabResultForm } from "@/features/lab-results/components/UploadLabResultForm";
import { usePatientName } from "@/features/patients/hooks/use-patient-name";
import { useStaffProfile } from "@/features/staff/hooks/use-staff-profile";
import { apiFetch } from "@/shared/lib/api-client";
import type { LabResult, LabResultParameter } from "@/shared/lib/types";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { Button } from "@/shared/ui/Button";
import { Field, Textarea } from "@/shared/ui/Field";
import { FormSection } from "@/shared/ui/FormSection";
import { StatusMessage } from "@/shared/ui/StatusMessage";
import { FlaskConical } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface LabResultDetail {
  labResult: LabResult;
  parameters: LabResultParameter[];
}

export function LabResultDetailPage() {
  const { patientId, labResultId } = useParams<{ patientId: string; labResultId: string }>();
  const { data: profile } = useStaffProfile();
  const patientName = usePatientName(patientId);
  const [detail, setDetail] = useState<LabResultDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | undefined>(undefined);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [actionError, setActionError] = useState<string | undefined>(undefined);

  const load = useCallback(() => {
    if (!patientId || !labResultId) return;
    apiFetch<LabResultDetail>(`/api/patients/${patientId}/lab-results/${labResultId}`)
      .then(setDetail)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "We couldn't load this result."),
      );
  }, [patientId, labResultId]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendToLaboratory() {
    if (!patientId || !labResultId || isSending) return;
    setActionError(undefined);
    setIsSending(true);
    try {
      await apiFetch(`/api/patients/${patientId}/lab-results/${labResultId}/send-to-laboratory`, {
        method: "PATCH",
      });
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "We couldn't update this request.");
    } finally {
      setIsSending(false);
    }
  }

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
      setCancelError(err instanceof Error ? err.message : "We couldn't cancel this request.");
    } finally {
      setIsCancelling(false);
    }
  }

  if (error) return <StatusMessage tone="error">{error}</StatusMessage>;
  if (!detail || !patientId || !labResultId) {
    return <output className="text-sm text-ink-muted">Loading this result…</output>;
  }

  const { labResult, parameters } = detail;
  const canUpload = labResult.status !== "cancelled" && labResult.status !== "reviewed";
  // Only an order that hasn't left the clinic yet can be handed over.
  const canSendToLab = labResult.status === "requested";
  const canReview = profile?.role === "doctor" && labResult.status === "result_available";
  const canCancel = labResult.status === "requested" || labResult.status === "pending";

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumbs
        items={[
          { label: "Dashboard", to: "/staff/dashboard" },
          { label: patientName ?? "Patient record", to: `/patients/${patientId}` },
          { label: "Labs", to: `/patients/${patientId}?tab=labs` },
          { label: labResult.testName },
        ]}
      />

      <LabResultDetailView labResult={labResult} parameters={parameters} />

      {actionError && <StatusMessage tone="error">{actionError}</StatusMessage>}

      {canSendToLab && (
        <FormSection
          title="Hand over to the laboratory"
          description="Mark this order as sent once the specimen or request has left the clinic. It then shows as “At laboratory” until a result is uploaded."
        >
          <Button
            variant="secondary"
            className="self-start"
            disabled={isSending}
            onClick={sendToLaboratory}
          >
            <FlaskConical aria-hidden="true" className="h-4 w-4" />
            {isSending ? "Updating…" : "Mark as sent to laboratory"}
          </Button>
        </FormSection>
      )}

      {canUpload && (
        <FormSection
          title={labResult.reportFilePath ? "Replace the result" : "Upload the result"}
          description={
            labResult.reportFilePath
              ? "Uploading again replaces the report and every parameter currently on record."
              : "Attach the laboratory's report and transcribe its values."
          }
        >
          <UploadLabResultForm
            patientId={patientId}
            labResultId={labResultId}
            onSuccess={() => load()}
          />
        </FormSection>
      )}

      {canReview && (
        <FormSection
          title="Review this result"
          description="Your interpretation closes the request and becomes part of the patient's record."
        >
          <ReviewLabResultForm
            patientId={patientId}
            labResultId={labResultId}
            onSuccess={() => load()}
          />
        </FormSection>
      )}

      {canCancel && (
        <FormSection
          title="Cancel this request"
          description="Use this if the test is no longer needed. A cancelled request can't be reopened."
        >
          <div className="flex flex-col gap-4">
            <Field
              label="Reason for cancelling"
              htmlFor="cancellationReason"
              error={cancelError}
              required
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
              disabled={isCancelling || !cancelReason.trim()}
              onClick={cancelRequest}
            >
              {isCancelling ? "Cancelling…" : "Cancel request"}
            </Button>
          </div>
        </FormSection>
      )}
    </div>
  );
}
