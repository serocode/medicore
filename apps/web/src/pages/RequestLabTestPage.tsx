import { useNavigate, useParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { RequestLabTestForm } from "../components/RequestLabTestForm";

export function RequestLabTestPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  if (!patientId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Unable to load.
      </main>
    );
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold text-slate-900">Request Lab Test</h1>
      <p className="mb-8 mt-1 text-slate-600">
        Order a laboratory or diagnostic test for this patient.
      </p>
      <RequestLabTestForm
        patientId={patientId}
        onSuccess={(labResult) => navigate(`/patients/${patientId}/lab-results/${labResult.id}`)}
      />
    </AuthLayout>
  );
}
