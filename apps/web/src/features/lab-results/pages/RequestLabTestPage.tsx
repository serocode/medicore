import { RequestLabTestForm } from "@/features/lab-results/components/RequestLabTestForm";
import { usePatientName } from "@/features/patients/hooks/use-patient-name";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatusMessage } from "@/shared/ui/StatusMessage";
import { useNavigate, useParams } from "react-router-dom";

export function RequestLabTestPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const patientName = usePatientName(patientId);

  if (!patientId) {
    return <StatusMessage tone="error">We couldn't open this request form.</StatusMessage>;
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", to: "/staff/dashboard" },
          { label: patientName ?? "Patient record", to: `/patients/${patientId}` },
          { label: "Request lab test" },
        ]}
        title="Request a lab test"
        description="Order a laboratory or diagnostic test. It stays open until a result is uploaded and a doctor signs it off."
      />
      <RequestLabTestForm
        patientId={patientId}
        onSuccess={(labResult) => navigate(`/patients/${patientId}/lab-results/${labResult.id}`)}
      />
    </>
  );
}
