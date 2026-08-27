import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { PatientProfileForm } from "../components/PatientProfileForm";
import { apiFetchForm } from "../lib/api-client";

export function RegisterPatientPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout wide>
      <h1 className="text-2xl font-semibold text-slate-900">Welcome</h1>
      <p className="mb-8 mt-1 text-slate-600">Let us know more about yourself.</p>

      <PatientProfileForm
        mode="create"
        onSubmit={async (formData) => {
          await apiFetchForm("/api/patients/register", formData);
          navigate("/book");
        }}
      />
    </AuthLayout>
  );
}
