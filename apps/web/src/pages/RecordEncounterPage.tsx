import { useNavigate, useParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { EncounterForm } from "../components/EncounterForm";
import { useStaffProfile } from "../lib/use-staff-profile";

export function RecordEncounterPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useStaffProfile();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading…
      </main>
    );
  }
  if (!profile || !patientId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Unable to load.
      </main>
    );
  }

  return (
    <AuthLayout wide>
      <h1 className="text-2xl font-semibold text-slate-900">Record Encounter</h1>
      <p className="mb-8 mt-1 text-slate-600">
        {profile.role === "doctor"
          ? "Document this consultation."
          : "Record vitals and nursing observations."}
      </p>
      <EncounterForm
        patientId={patientId}
        role={profile.role}
        onSuccess={() => navigate(`/patients/${patientId}?tab=timeline`)}
      />
    </AuthLayout>
  );
}
