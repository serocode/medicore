import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, MapPin, Phone, ShieldCheck, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { applyApiErrorToForm } from "../lib/api-client";
import { authClient, useSession } from "../lib/auth-client";
import { IDENTIFICATION_TYPES } from "../lib/constants";
import { useDoctors } from "../lib/use-doctors";
import { Button } from "./Button";
import { CheckboxField, Field, RadioGroupField, Select, TextInput, Textarea } from "./Field";
import { FileUploader } from "./FileUploader";
import { FormSection } from "./FormSection";

const patientFormSchema = z.object({
  fullName: z.string().min(1, "Required"),
  birthDate: z.string().min(1, "Required"),
  gender: z.enum(["male", "female", "other"], { message: "Required" }),
  address: z.string().min(1, "Required"),
  occupation: z.string().min(1, "Required"),
  emergencyContactName: z.string().min(1, "Required"),
  emergencyContactPhone: z.string().min(1, "Required"),
  primaryPhysicianId: z.string().min(1, "Select a physician"),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  familyMedicalHistory: z.string().optional(),
  pastMedicalHistory: z.string().optional(),
  identificationType: z.string().min(1, "Required"),
  identificationNumber: z.string().min(1, "Required"),
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
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    values: defaultValues
      ? {
          fullName: "",
          birthDate: "",
          gender: "other",
          address: "",
          occupation: "",
          emergencyContactName: "",
          emergencyContactPhone: "",
          primaryPhysicianId: "",
          identificationType: "",
          identificationNumber: "",
          consentTreatment: false,
          consentDisclosure: false,
          consentPrivacy: false,
          ...defaultValues,
        }
      : undefined,
    defaultValues: {
      fullName: "",
      gender: "other",
      consentTreatment: false,
      consentDisclosure: false,
      consentPrivacy: false,
    },
  });

  // The user's name lives on their Better Auth account, not the Patient
  // record, so it isn't part of `defaultValues` — fill it in once the
  // session resolves (may not be ready on the very first render).
  const nameFilledFromSession = useRef(false);
  useEffect(() => {
    if (session?.user.name && !nameFilledFromSession.current) {
      setValue("fullName", session.user.name);
      nameFilledFromSession.current = true;
    }
  }, [session, setValue]);

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
            ? "Registration failed"
            : "Update failed",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-8">
      <FormSection title="Personal Information">
        <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
          <TextInput id="fullName" icon={UserIcon} {...register("fullName")} />
        </Field>
        <Field label="Email" htmlFor="email">
          <TextInput id="email" type="email" value={session?.user.email ?? ""} disabled />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date of birth" htmlFor="birthDate" error={errors.birthDate?.message}>
            <TextInput
              id="birthDate"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              {...register("birthDate")}
            />
          </Field>
          <Field label="Gender" htmlFor="gender" error={errors.gender?.message}>
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
          <Field label="Address" htmlFor="address" error={errors.address?.message}>
            <TextInput id="address" icon={MapPin} {...register("address")} />
          </Field>
          <Field label="Occupation" htmlFor="occupation" error={errors.occupation?.message}>
            <TextInput id="occupation" {...register("occupation")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Emergency contact name"
            htmlFor="emergencyContactName"
            error={errors.emergencyContactName?.message}
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
          >
            <TextInput
              id="emergencyContactPhone"
              icon={Phone}
              {...register("emergencyContactPhone")}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Medical Information">
        <Field
          label="Primary physician"
          htmlFor="primaryPhysicianId"
          error={errors.primaryPhysicianId?.message}
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

      <FormSection title="Identification & Verification">
        <Field
          label="Identification type"
          htmlFor="identificationType"
          error={errors.identificationType?.message}
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
        >
          <TextInput
            id="identificationNumber"
            icon={FileText}
            {...register("identificationNumber")}
          />
        </Field>
        <Field
          label={
            mode === "edit"
              ? "Scanned copy of identification document (leave blank to keep your current file)"
              : "Scanned copy of identification document"
          }
          htmlFor="identificationDocument"
          error={fileError}
        >
          <FileUploader accept="image/jpeg,image/png,application/pdf" onChange={setFile} />
        </Field>
      </FormSection>

      <FormSection title="Consent and Privacy">
        <CheckboxField
          id="consentTreatment"
          label="I consent to treatment."
          {...register("consentTreatment")}
        />
        {errors.consentTreatment && (
          <p className="text-sm text-red-600">{errors.consentTreatment.message}</p>
        )}
        <CheckboxField
          id="consentDisclosure"
          label="I consent to disclosure of my health information."
          {...register("consentDisclosure")}
        />
        {errors.consentDisclosure && (
          <p className="text-sm text-red-600">{errors.consentDisclosure.message}</p>
        )}
        <CheckboxField
          id="consentPrivacy"
          label="I acknowledge the privacy policy."
          {...register("consentPrivacy")}
        />
        {errors.consentPrivacy && (
          <p className="text-sm text-red-600">{errors.consentPrivacy.message}</p>
        )}
      </FormSection>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : mode === "create" ? "Get Started" : "Save changes"}
      </Button>
    </form>
  );
}
