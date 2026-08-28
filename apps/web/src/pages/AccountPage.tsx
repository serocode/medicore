import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { Card, CardBody, CardHeader } from "../components/Card";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { NameFields } from "../components/NameFields";
import { PageHeader } from "../components/PageHeader";
import { ProfilePhotoField } from "../components/ProfilePhotoField";
import { StatusMessage } from "../components/StatusMessage";
import { UnsavedChangesGuard } from "../components/UnsavedChangesGuard";
import {
  ConsentFields,
  EmergencyContactFields,
  IdentificationFields,
  MedicalInformationFields,
  PersonalDetailsFields,
  patientDetailsSchema,
} from "../components/patient-fields";
import { API_URL, apiFetch, apiFetchForm, applyApiErrorToForm } from "../lib/api-client";
import { MAX_LINE_TEXT } from "../lib/constants";
import type { AccountProfile } from "../lib/types";
import { useAccount } from "../lib/use-account";
import { useDoctors } from "../lib/use-doctors";
import { usePatientProfile } from "../lib/use-patient-profile";

const accountSchema = z
  .object({
    firstName: z.string().min(1, "Required").max(MAX_LINE_TEXT, "That's too long"),
    middleName: z.string().max(MAX_LINE_TEXT, "That's too long").optional(),
    lastName: z.string().min(1, "Required").max(MAX_LINE_TEXT, "That's too long"),
    suffix: z.string().optional(),
  })
  .extend(patientDetailsSchema.shape);

type AccountValues = z.infer<typeof accountSchema>;

/**
 * The identity card at the top. Registration is a sequence you complete once;
 * this page is a place you come back to, so it opens by showing who the
 * account *is* rather than by asking a question.
 */
function ProfileHeader({
  account,
  onAccountChange,
}: {
  account: AccountProfile;
  onAccountChange: (account: AccountProfile) => void;
}) {
  return (
    <Card>
      <CardBody className="flex flex-col gap-6">
        <div className="flex min-w-0 items-center gap-4">
          {account.imagePath ? (
            <img
              src={`${API_URL}/api/uploads/${account.imagePath}`}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full border border-line object-cover"
            />
          ) : (
            <Avatar name={account.name || account.email} size={64} />
          )}
          <div className="min-w-0">
            <h2 className="truncate text-headline-md text-ink">{account.name || "Your account"}</h2>
            <p className="flex items-center gap-1.5 text-sm text-ink-muted">
              <Mail aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="truncate">{account.email}</span>
            </p>
          </div>
        </div>

        <div className="border-t border-line pt-6">
          <h3 className="font-display font-semibold text-ink">Profile photo</h3>
          <p className="mb-4 mt-1 text-sm text-ink-muted">
            Shown to you across Medicore. Saved as soon as you choose it.
          </p>
          <ProfilePhotoField account={account} onChange={onAccountChange} />
        </div>
      </CardBody>
    </Card>
  );
}

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

      <ProfileHeader account={account} onAccountChange={setAccount} />

      {saved && <StatusMessage tone="success">Your changes have been saved.</StatusMessage>}
      {submitError && <StatusMessage tone="error">{submitError}</StatusMessage>}

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
            description="The ID on file. To replace the scanned document itself, contact the clinic."
          />
          <CardBody className="flex flex-col gap-4">
            <IdentificationFields register={register as never} errors={errors} />
            {patient.identificationDocumentPath && (
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <ShieldCheck aria-hidden="true" className="h-4 w-4 text-primary" />A scanned copy of
                your ID is on file.
              </p>
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
