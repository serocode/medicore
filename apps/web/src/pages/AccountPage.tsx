import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { FormSection } from "../components/FormSection";
import { Modal } from "../components/Modal";
import { PatientProfileForm } from "../components/PatientProfileForm";
import { apiFetch, apiFetchForm } from "../lib/api-client";
import { usePatientProfile } from "../lib/use-patient-profile";

export function AccountPage() {
  const navigate = useNavigate();
  const { data: patient, isLoading, error, refetch } = usePatientProfile();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(undefined);
    try {
      await apiFetch("/api/patients/me", { method: "DELETE" });
      navigate("/");
    } catch (err) {
      setIsDeleting(false);
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account");
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading…
      </main>
    );
  }

  if (error || !patient) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        {error ?? "Profile not found."}
      </main>
    );
  }

  return (
    <AuthLayout wide>
      <h1 className="text-2xl font-semibold text-slate-900">Your account</h1>
      <p className="mb-8 mt-1 text-slate-600">Review and update your details.</p>

      {saved && (
        <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Your changes have been saved.
        </p>
      )}

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

      <div className="mt-8">
        <FormSection
          title="Delete account"
          description="Cancels any pending or scheduled appointments and removes your profile from active use. Your appointment history is kept for our records."
        >
          <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
            Delete my account
          </Button>
        </FormSection>
      </div>

      {isDeleteModalOpen && (
        <Modal title="Delete your account?" onClose={() => setIsDeleteModalOpen(false)}>
          <p className="mb-4 text-sm text-slate-600">
            This cancels any pending or scheduled appointments. You'll need to register again to
            book new ones. This can't be undone from here.
          </p>
          {deleteError && <p className="mb-4 text-sm text-red-600">{deleteError}</p>}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting…" : "Delete account"}
            </Button>
          </div>
        </Modal>
      )}
    </AuthLayout>
  );
}
