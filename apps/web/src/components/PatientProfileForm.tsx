import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, MapPin, Phone, ShieldCheck, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { applyApiErrorToForm } from "../lib/api-client";
import { authClient, useSession } from "../lib/auth-client";
import { IDENTIFICATION_TYPES, MAX_CLINICAL_TEXT, MAX_LINE_TEXT } from "../lib/constants";
import { useDoctors } from "../lib/use-doctors";
import { Button } from "./Button";
import {
  CheckboxField,
  Field,
  RadioGroupField,
  RequiredLegend,
  Select,
  TextInput,
  Textarea,
} from "./Field";
import { FileUploader } from "./FileUploader";
import { FormSection } from "./FormSection";
import { StatusMessage } from "./StatusMessage";
import { UnsavedChangesGuard } from "./UnsavedChangesGuard";

// Mirrors apps/api/src/routes/patients.ts — deliberately permissive about
// format (international numbering varies too much to pattern-match), strict
// only about it being contactable at all.
const looksLikePhone = (value: string) =>
  /^[+()\d][\d\s().+-]*(?:(?:ext|x|#)\.?\s*\d+)?$/i.test(value.trim()) &&
  (value.match(/\d/g)?.length ?? 0) >= 7;

const line = z.string().min(1, "Required").max(MAX_LINE_TEXT, "That's too long");
const notes = z.string().max(MAX_CLINICAL_TEXT, "That's too long").optional();

const patientFormSchema = z.object({
  fullName: line,
  birthDate: z.string().min(1, "Required"),
  gender: z.enum(["male", "female", "other"], { message: "Required" }),
  address: line,
  occupation: line,
  emergencyContactName: line,
  emergencyContactPhone: z
    .string()
    .min(1, "Required")
    .max(40, "That's too long")
    .refine(looksLikePhone, "Enter a contactable phone number, including at least 7 digits"),
  primaryPhysicianId: z.string().min(1, "Select a physician"),
  insuranceProvider: notes,
  insurancePolicyNumber: notes,
  allergies: notes,
  currentMedications: notes,
  familyMedicalHistory: notes,
  pastMedicalHistory: notes,
  identificationType: line,
  identificationNumber: line,
  consentTreatment: z.boolean().refine((v) => v, { message: "Required" }),
  consentDisclosure: z.boolean().refine((v) => v, { message: "Required" }),
  consentPrivacy: z.boolean().refine((v) => v, { message: "Required" }),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

interface PatientProfileFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<PatientFormValues>;
  onSubmit: (formData: FormData) => Promise<void>;
}

export function PatientProfileForm({ mode, defaultValues, onSubmit }: PatientProfileFormProps) {
  const doctors = useDoctors();
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty, isSubmitSuccessful },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    // One complete baseline covering every registered field, used via `values`
    // in both modes. Two things depend on it being complete and correct:
    //
    //  - `isDirty` is derived by comparing the live form against this, so a
    //    field missing from it reads as dirty before anyone types.
    //  - The user's name lives on their Better Auth account, not the Patient
    //    row. It used to be written in by a setValue effect after mount, which
    //    made it permanently differ from the baseline — the whole form was
    //    dirty from the moment the session resolved, and the unsaved-changes
    //    guard challenged people who had touched nothing. Seeding it here
    //    instead makes it part of the baseline.
    //
    // `values` re-syncs when the session or the loaded profile arrives; React
    // Hook Form deep-compares before resetting, so rebuilding this object on
    // every render costs nothing and never discards what someone has typed.
    values: {
      fullName: session?.user.name ?? "",
      birthDate: "",
      gender: "other",
      address: "",
      occupation: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      primaryPhysicianId: "",
      insuranceProvider: "",
      insurancePolicyNumber: "",
      allergies: "",
      currentMedications: "",
      familyMedicalHistory: "",
      pastMedicalHistory: "",
      identificationType: "",
      identificationNumber: "",
      consentTreatment: false,
      consentDisclosure: false,
      consentPrivacy: false,
      ...defaultValues,
    },
  });

  // In edit mode, register()'s uncontrolled <select> can end up with its
  // value set before the doctor <option>s (loaded async) exist in the DOM —
  // the browser has nothing to match, so it falls back to the placeholder
  // and never re-syncs once the options do arrive. Re-apply the saved value
  // once the doctor list has actually loaded.
  const physicianFilledFromDoctors = useRef(false);
  useEffect(() => {
    if (
      defaultValues?.primaryPhysicianId &&
      doctors.data &&
      doctors.data.length > 0 &&
      !physicianFilledFromDoctors.current
    ) {
      setValue("primaryPhysicianId", defaultValues.primaryPhysicianId);
      physicianFilledFromDoctors.current = true;
    }
  }, [defaultValues?.primaryPhysicianId, doctors.data, setValue]);

  async function submit(values: PatientFormValues) {
    setSubmitError(undefined);
    if (mode === "create" && !file) {
      setFileError("Please upload a copy of your ID");
      return;
    }
    setFileError(undefined);

    try {
      const formData = new FormData();
      for (const [key, value] of Object.entries(values)) {
        if (key === "fullName") continue;
        formData.append(key, typeof value === "boolean" ? String(value) : (value ?? ""));
      }
      if (file) {
        formData.append("identificationDocument", file);
      }

      // Save the profile record first — it's the mutation that can fail
      // validation. Only update the account display name once that's
      // committed, so a rejected submission never leaves the name changed
      // with nothing else saved to match it.
      await onSubmit(formData);
      await authClient.updateUser({ name: values.fullName });
    } catch (error) {
      applyApiErrorToForm(error, setError);
      setSubmitError(
        error instanceof Error
          ? error.message
          : mode === "create"
            ? "We couldn't complete your registration."
            : "We couldn't save your changes.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-8">
      <UnsavedChangesGuard when={isDirty && !isSubmitSuccessful} />

      <RequiredLegend />

      <FormSection title="Personal information">
        <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message} required>
          <TextInput id="fullName" icon={UserIcon} {...register("fullName")} />
        </Field>
        <Field
          label="Email"
          htmlFor="email"
          hint="This is the address you sign in with and can't be changed here."
        >
          <TextInput id="email" type="email" value={session?.user.email ?? ""} disabled />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Date of birth"
            htmlFor="birthDate"
            error={errors.birthDate?.message}
            required
          >
            <TextInput
              id="birthDate"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              {...register("birthDate")}
            />
          </Field>
          <Field label="Gender" htmlFor="gender" error={errors.gender?.message} required>
            <RadioGroupField
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ]}
              registerProps={register("gender")}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Address" htmlFor="address" error={errors.address?.message} required>
            <TextInput id="address" icon={MapPin} {...register("address")} />
          </Field>
          <Field
            label="Occupation"
            htmlFor="occupation"
            error={errors.occupation?.message}
            required
          >
            <TextInput id="occupation" {...register("occupation")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Emergency contact name"
            htmlFor="emergencyContactName"
            error={errors.emergencyContactName?.message}
            required
          >
            <TextInput
              id="emergencyContactName"
              icon={UserIcon}
              {...register("emergencyContactName")}
            />
          </Field>
          <Field
            label="Emergency contact phone"
            htmlFor="emergencyContactPhone"
            error={errors.emergencyContactPhone?.message}
            required
          >
            <TextInput
              id="emergencyContactPhone"
              icon={Phone}
              {...register("emergencyContactPhone")}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Medical information">
        <Field
          label="Primary physician"
          htmlFor="primaryPhysicianId"
          error={errors.primaryPhysicianId?.message}
          required
        >
          <Select id="primaryPhysicianId" {...register("primaryPhysicianId")}>
            <option value="">Select a physician</option>
            {doctors.data?.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} — {doctor.specialization}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Insurance provider" htmlFor="insuranceProvider">
            <TextInput id="insuranceProvider" {...register("insuranceProvider")} />
          </Field>
          <Field label="Insurance policy number" htmlFor="insurancePolicyNumber">
            <TextInput id="insurancePolicyNumber" {...register("insurancePolicyNumber")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Allergies" htmlFor="allergies">
            <Textarea id="allergies" {...register("allergies")} />
          </Field>
          <Field label="Current medications" htmlFor="currentMedications">
            <Textarea id="currentMedications" {...register("currentMedications")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Family medical history" htmlFor="familyMedicalHistory">
            <Textarea id="familyMedicalHistory" {...register("familyMedicalHistory")} />
          </Field>
          <Field label="Past medical history" htmlFor="pastMedicalHistory">
            <Textarea id="pastMedicalHistory" {...register("pastMedicalHistory")} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Identification and verification">
        <Field
          label="Identification type"
          htmlFor="identificationType"
          error={errors.identificationType?.message}
          required
        >
          <Select id="identificationType" icon={ShieldCheck} {...register("identificationType")}>
            <option value="">Select ID type</option>
            {IDENTIFICATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Identification number"
          htmlFor="identificationNumber"
          error={errors.identificationNumber?.message}
          required
        >
          <TextInput
            id="identificationNumber"
            icon={FileText}
            {...register("identificationNumber")}
          />
        </Field>
        <Field
          label="Scanned copy of identification document"
          htmlFor="identificationDocument"
          hint={
            mode === "edit"
              ? "Leave this blank to keep the file already on your record."
              : undefined
          }
          error={fileError}
          required={mode === "create"}
        >
          <FileUploader accept="image/jpeg,image/png,application/pdf" onChange={setFile} />
        </Field>
      </FormSection>

      <FormSection title="Consent and privacy">
        <CheckboxField
          id="consentTreatment"
          label="I consent to treatment."
          {...register("consentTreatment")}
        />
        {errors.consentTreatment && (
          <p role="alert" className="text-sm text-danger">
            {errors.consentTreatment.message}
          </p>
        )}
        <CheckboxField
          id="consentDisclosure"
          label="I consent to disclosure of my health information."
          {...register("consentDisclosure")}
        />
        {errors.consentDisclosure && (
          <p role="alert" className="text-sm text-danger">
            {errors.consentDisclosure.message}
          </p>
        )}
        <CheckboxField
          id="consentPrivacy"
          label="I acknowledge the privacy policy."
          {...register("consentPrivacy")}
        />
        {errors.consentPrivacy && (
          <p role="alert" className="text-sm text-danger">
            {errors.consentPrivacy.message}
          </p>
        )}
      </FormSection>

      {submitError && <StatusMessage tone="error">{submitError}</StatusMessage>}

      <Button type="submit" size="lg" className="self-start" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : mode === "create" ? "Complete registration" : "Save changes"}
      </Button>
    </form>
  );
}
