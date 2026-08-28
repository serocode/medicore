import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FormSection } from "../components/FormSection";
import { PageHeader } from "../components/PageHeader";
import { PatientProfileForm } from "../components/PatientProfileForm";
import { StatusMessage } from "../components/StatusMessage";
import { apiFetch, apiFetchForm } from "../lib/api-client";
import { usePatientProfile } from "../lib/use-patient-profile";

export function AccountPage() {
  const navigate = useNavigate();
  const { data: patient, isLoading, error, refetch } = usePatientProfile();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleDelete() {
    await apiFetch("/api/patients/me", { method: "DELETE" });
    navigate("/");
  }

  if (isLoading) {
    return <output className="text-sm text-ink-muted">Loading your details…</output>;
  }

  if (error || !patient) {
    return <StatusMessage tone="error">{error ?? "We couldn't find your profile."}</StatusMessage>;
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "My appointments", to: "/dashboard" }, { label: "Account" }]}
        title="Your account"
        description="Review and update the details your care team holds for you."
      />

      {saved && <StatusMessage tone="success">Your changes have been saved.</StatusMessage>}

      <PatientProfileForm
        mode="edit"
        defaultValues={{
          birthDate: patient.birthDate,
          gender: patient.gender,
          address: patient.address,
          occupation: patient.occupation,
          emergencyContactName: patient.emergencyContactName,
          emergencyContactPhone: patient.emergencyContactPhone,
          primaryPhysicianId: patient.primaryPhysicianId,
          insuranceProvider: patient.insuranceProvider ?? "",
          insurancePolicyNumber: patient.insurancePolicyNumber ?? "",
          allergies: patient.allergies ?? "",
          currentMedications: patient.currentMedications ?? "",
          familyMedicalHistory: patient.familyMedicalHistory ?? "",
          pastMedicalHistory: patient.pastMedicalHistory ?? "",
          identificationType: patient.identificationType,
          identificationNumber: patient.identificationNumber,
          consentTreatment: patient.consentTreatment,
          consentDisclosure: patient.consentDisclosure,
          consentPrivacy: patient.consentPrivacy,
        }}
        onSubmit={async (formData) => {
          setSaved(false);
          await apiFetchForm("/api/patients/me", formData, { method: "PATCH" });
          refetch();
          setSaved(true);
        }}
      />

      <div className="mt-4">
        <FormSection
          title="Delete account"
          description="Cancels any pending or scheduled appointments and removes your profile from active use. Your appointment history is kept for our records."
        >
          <Button
            variant="danger"
            className="self-start"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete my account
          </Button>
        </FormSection>
      </div>

      {isDeleteModalOpen && (
        <ConfirmDialog
          title="Delete your account?"
          description="This cancels any pending or scheduled appointments. You'd need to register again to book new ones, and this can't be undone from here."
          confirmLabel="Delete account"
          pendingLabel="Deleting…"
          onConfirm={handleDelete}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}
    </>
  );
}
