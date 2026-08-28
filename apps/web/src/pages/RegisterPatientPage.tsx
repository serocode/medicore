import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { PatientProfileForm } from "../components/PatientProfileForm";
import { apiFetchForm } from "../lib/api-client";

export function RegisterPatientPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Complete your registration"
        description="Your care team needs these details before your first visit. It takes a few minutes, and you can change anything later from your account."
      />

      <PatientProfileForm
        mode="create"
        onSubmit={async (formData) => {
          await apiFetchForm("/api/patients/register", formData);
          navigate("/book");
        }}
      />
    </>
  );
}
