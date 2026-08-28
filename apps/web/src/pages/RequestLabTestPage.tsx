import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { RequestLabTestForm } from "../components/RequestLabTestForm";
import { StatusMessage } from "../components/StatusMessage";
import { usePatientName } from "../lib/use-patient-name";

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
