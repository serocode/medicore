import { ProfilePhotoField } from "@/features/account/components/ProfilePhotoField";
import { useAccount } from "@/features/account/hooks/use-account";
import { useDoctors } from "@/features/appointments/hooks/use-doctors";
import { NameFields } from "@/features/patients/components/NameFields";
import {
  ConsentFields,
  EmergencyContactFields,
  IdentificationFields,
  MedicalInformationFields,
  PersonalDetailsFields,
  patientDetailsSchema,
} from "@/features/patients/components/patient-fields";
import { usePatientProfile } from "@/features/patients/hooks/use-patient-profile";
import { API_URL, apiFetch, apiFetchForm, applyApiErrorToForm } from "@/shared/lib/api-client";
import { MAX_LINE_TEXT } from "@/shared/lib/constants";
import type { AccountProfile } from "@/shared/lib/types";
import { Button, ExternalButtonLink } from "@/shared/ui/Button";
import { Card, CardBody, CardHeader } from "@/shared/ui/Card";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatusMessage } from "@/shared/ui/StatusMessage";
import { UnsavedChangesGuard } from "@/shared/ui/UnsavedChangesGuard";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const accountSchema = z
  .object({
    firstName: z.string().min(1, "Required").max(MAX_LINE_TEXT, "That's too long"),
    middleName: z.string().max(MAX_LINE_TEXT, "That's too long").optional(),
    lastName: z.string().min(1, "Required").max(MAX_LINE_TEXT, "That's too long"),
    suffix: z.string().optional(),
  })
  .extend(patientDetailsSchema.shape);

type AccountValues = z.infer<typeof accountSchema>;

export function AccountPage() {
  const navigate = useNavigate();
  const doctors = useDoctors();
  const {
    data: patient,
    isLoading: isPatientLoading,
    error: patientError,
    refetch,
  } = usePatientProfile();
  const {
    data: account,
    isLoading: isAccountLoading,
    error: accountError,
    setAccount,
  } = useAccount();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty, isSubmitSuccessful },
  } = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    values: {
      firstName: account?.firstName ?? "",
      middleName: account?.middleName ?? "",
      lastName: account?.lastName ?? "",
      suffix: account?.suffix ?? "",
      birthDate: patient?.birthDate ?? "",
      gender: patient?.gender ?? "other",
      address: patient?.address ?? "",
      occupation: patient?.occupation ?? "",
      emergencyContactName: patient?.emergencyContactName ?? "",
      emergencyContactPhone: patient?.emergencyContactPhone ?? "",
      primaryPhysicianId: patient?.primaryPhysicianId ?? "",
      insuranceProvider: patient?.insuranceProvider ?? "",
      insurancePolicyNumber: patient?.insurancePolicyNumber ?? "",
      allergies: patient?.allergies ?? "",
      currentMedications: patient?.currentMedications ?? "",
      familyMedicalHistory: patient?.familyMedicalHistory ?? "",
      pastMedicalHistory: patient?.pastMedicalHistory ?? "",
      identificationType: patient?.identificationType ?? "",
      identificationNumber: patient?.identificationNumber ?? "",
      consentTreatment: patient?.consentTreatment ?? false,
      consentDisclosure: patient?.consentDisclosure ?? false,
      consentPrivacy: patient?.consentPrivacy ?? false,
    },
  });

  async function save(values: AccountValues) {
    setSaved(false);
    setSubmitError(undefined);
    try {
      const updated = await apiFetch<{ account: AccountProfile }>("/api/account/me", {
        method: "PATCH",
        body: JSON.stringify({
          firstName: values.firstName,
          middleName: values.middleName || undefined,
          lastName: values.lastName,
          suffix: values.suffix || undefined,
        }),
      });
      // The response already carries the recomposed display name, so the nav
      // bar updates without a second read.
      setAccount(updated.account);

      const formData = new FormData();
      for (const [key, value] of Object.entries(values)) {
        if (["firstName", "middleName", "lastName", "suffix"].includes(key)) continue;
        formData.append(key, typeof value === "boolean" ? String(value) : (value ?? ""));
      }
      await apiFetchForm("/api/patients/me", formData, { method: "PATCH" });

      refetch();
      setSaved(true);
    } catch (error) {
      applyApiErrorToForm(error, setError);
      setSubmitError(error instanceof Error ? error.message : "We couldn't save your changes.");
    }
  }

  if (isPatientLoading || isAccountLoading) {
    return <output className="text-sm text-ink-muted">Loading your account…</output>;
  }
  if (patientError || accountError || !patient || !account) {
    return (
      <StatusMessage tone="error">
        {patientError ?? accountError ?? "We couldn't find your account."}
      </StatusMessage>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "My appointments", to: "/dashboard" }, { label: "Account" }]}
        title="Your account"
        description="Your profile, the details your care team holds, and the consents on file."
      />

      {saved && <StatusMessage tone="success">Your changes have been saved.</StatusMessage>}
      {submitError && <StatusMessage tone="error">{submitError}</StatusMessage>}

      <Card>
        <CardBody>
          <ProfilePhotoField account={account} onChange={setAccount} />
        </CardBody>
      </Card>

      <form onSubmit={handleSubmit(save)} className="flex flex-col gap-6">
        <UnsavedChangesGuard when={isDirty && !isSubmitSuccessful} />

        <Card>
          <CardHeader
            title="Your name"
            description="How your care team and your appointment records refer to you."
          />
          <CardBody>
            <NameFields register={register as never} errors={errors} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Personal details"
            description="Used to identify you, and to reach someone in an emergency."
          />
          <CardBody className="flex flex-col gap-6">
            <PersonalDetailsFields
              register={register as never}
              errors={errors}
              genderRegister={register("gender")}
            />
            <div className="border-t border-line pt-6">
              <EmergencyContactFields register={register as never} errors={errors} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Medical information"
            description="Your physician, and the history your care team reads before a visit."
          />
          <CardBody>
            <MedicalInformationFields
              register={register as never}
              errors={errors}
              doctors={doctors}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Identification"
            description="Optional. To add or replace a scanned copy of your ID, contact the clinic."
          />
          <CardBody className="flex flex-col gap-4">
            <IdentificationFields register={register as never} errors={errors} />
            {patient.identificationDocumentPath && (
              <ExternalButtonLink
                href={`${API_URL}/api/uploads/${patient.identificationDocumentPath}`}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                className="self-start"
              >
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                View scanned ID
                <span className="sr-only"> (opens in a new tab)</span>
              </ExternalButtonLink>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Consent"
            description="All three are required for the clinic to treat you."
          />
          <CardBody>
            <ConsentFields register={register as never} errors={errors} />
          </CardBody>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
          <p className="text-caption text-ink-subtle">
            Your photo saves on its own — this saves everything else.
          </p>
        </div>
      </form>

      {/* Destructive, and deliberately set apart from everything above it. */}
      <Card className="border-danger/30">
        <CardHeader
          title="Delete account"
          description="Cancels any pending or scheduled appointments and removes your profile from active use. Your appointment history is kept for the clinic's records."
        />
        <CardBody>
          <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
            Delete my account
          </Button>
        </CardBody>
      </Card>

      {isDeleteOpen && (
        <ConfirmDialog
          title="Delete your account?"
          description="This cancels any pending or scheduled appointments. You'd need to register again to book new ones, and this can't be undone from here."
          confirmLabel="Delete account"
          pendingLabel="Deleting…"
          onConfirm={async () => {
            await apiFetch("/api/patients/me", { method: "DELETE" });
            navigate("/");
          }}
          onClose={() => setIsDeleteOpen(false)}
        />
      )}
    </>
  );
}
