import { useNavigate, useParams } from "react-router-dom";
import { EncounterForm } from "../components/EncounterForm";
import { PageHeader } from "../components/PageHeader";
import { StatusMessage } from "../components/StatusMessage";
import { usePatientName } from "../lib/use-patient-name";
import { useStaffProfile } from "../lib/use-staff-profile";

export function RecordEncounterPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useStaffProfile();
  const patientName = usePatientName(patientId);

  if (isLoading) {
    return <output className="text-sm text-ink-muted">Loading…</output>;
  }
  if (!profile || !patientId) {
    return <StatusMessage tone="error">We couldn't open this encounter form.</StatusMessage>;
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", to: "/staff/dashboard" },
          { label: patientName ?? "Patient record", to: `/patients/${patientId}` },
          { label: profile.role === "doctor" ? "New encounter" : "Record vitals" },
        ]}
        title={profile.role === "doctor" ? "Record encounter" : "Record vitals and observations"}
        description={
          profile.role === "doctor"
            ? "Document this consultation. It joins the patient's timeline as soon as you save."
            : "Capture vitals and nursing observations for this visit."
        }
      />
      <EncounterForm
        patientId={patientId}
        role={profile.role}
        onSuccess={() => navigate(`/patients/${patientId}?tab=timeline`)}
      />
    </>
  );
}
