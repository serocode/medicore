import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/Button";
import { Field, inputClassName } from "../components/Field";
import { apiFetchForm } from "../lib/api-client";
import { useDoctors } from "../lib/use-doctors";

const patientFormSchema = z.object({
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
  consentTreatment: z.boolean().refine((v) => v, { message: "Required" }),
  consentDisclosure: z.boolean().refine((v) => v, { message: "Required" }),
  consentPrivacy: z.boolean().refine((v) => v, { message: "Required" }),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

export function RegisterPatientPage() {
  const navigate = useNavigate();
  const doctors = useDoctors();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      gender: "other",
      consentTreatment: false,
      consentDisclosure: false,
      consentPrivacy: false,
    },
  });

  async function onSubmit(values: PatientFormValues) {
    setSubmitError(undefined);
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setFileError("Please upload a copy of your ID");
      return;
    }
    setFileError(undefined);

    const formData = new FormData();
    for (const [key, value] of Object.entries(values)) {
      formData.append(key, typeof value === "boolean" ? String(value) : (value ?? ""));
    }
    formData.append("identificationDocument", file);

    try {
      await apiFetchForm("/api/patients/register", formData);
      navigate("/book");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Registration failed");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-slate-50 p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Patient registration</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
        <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-medium text-slate-900">Personal information</h2>
          <Field label="Date of birth" htmlFor="birthDate" error={errors.birthDate?.message}>
            <input
              id="birthDate"
              type="date"
              className={inputClassName}
              {...register("birthDate")}
            />
          </Field>
          <Field label="Gender" htmlFor="gender" error={errors.gender?.message}>
            <select id="gender" className={inputClassName} {...register("gender")}>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Address" htmlFor="address" error={errors.address?.message}>
            <input id="address" className={inputClassName} {...register("address")} />
          </Field>
          <Field label="Occupation" htmlFor="occupation" error={errors.occupation?.message}>
            <input id="occupation" className={inputClassName} {...register("occupation")} />
          </Field>
        </section>

        <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-medium text-slate-900">Emergency contact</h2>
          <Field
            label="Contact name"
            htmlFor="emergencyContactName"
            error={errors.emergencyContactName?.message}
          >
            <input
              id="emergencyContactName"
              className={inputClassName}
              {...register("emergencyContactName")}
            />
          </Field>
          <Field
            label="Contact phone"
            htmlFor="emergencyContactPhone"
            error={errors.emergencyContactPhone?.message}
          >
            <input
              id="emergencyContactPhone"
              className={inputClassName}
              {...register("emergencyContactPhone")}
            />
          </Field>
        </section>

        <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-medium text-slate-900">Medical information</h2>
          <Field
            label="Primary physician"
            htmlFor="primaryPhysicianId"
            error={errors.primaryPhysicianId?.message}
          >
            <select
              id="primaryPhysicianId"
              className={inputClassName}
              {...register("primaryPhysicianId")}
            >
              <option value="">Select a physician</option>
              {doctors.data?.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} — {doctor.specialization}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Insurance provider" htmlFor="insuranceProvider">
            <input
              id="insuranceProvider"
              className={inputClassName}
              {...register("insuranceProvider")}
            />
          </Field>
          <Field label="Insurance policy number" htmlFor="insurancePolicyNumber">
            <input
              id="insurancePolicyNumber"
              className={inputClassName}
              {...register("insurancePolicyNumber")}
            />
          </Field>
          <Field label="Allergies" htmlFor="allergies">
            <textarea id="allergies" className={inputClassName} {...register("allergies")} />
          </Field>
          <Field label="Current medications" htmlFor="currentMedications">
            <textarea
              id="currentMedications"
              className={inputClassName}
              {...register("currentMedications")}
            />
          </Field>
          <Field label="Family medical history" htmlFor="familyMedicalHistory">
            <textarea
              id="familyMedicalHistory"
              className={inputClassName}
              {...register("familyMedicalHistory")}
            />
          </Field>
          <Field label="Past medical history" htmlFor="pastMedicalHistory">
            <textarea
              id="pastMedicalHistory"
              className={inputClassName}
              {...register("pastMedicalHistory")}
            />
          </Field>
        </section>

        <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-medium text-slate-900">Identification</h2>
          <Field
            label="ID document (JPEG, PNG, or PDF)"
            htmlFor="identificationDocument"
            error={fileError}
          >
            <input
              id="identificationDocument"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              ref={fileInputRef}
              className={inputClassName}
            />
          </Field>
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-medium text-slate-900">Consent</h2>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-1" {...register("consentTreatment")} />I consent to
            treatment.
          </label>
          {errors.consentTreatment && (
            <p className="text-sm text-red-600">{errors.consentTreatment.message}</p>
          )}
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-1" {...register("consentDisclosure")} />I consent
            to disclosure of my health information.
          </label>
          {errors.consentDisclosure && (
            <p className="text-sm text-red-600">{errors.consentDisclosure.message}</p>
          )}
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-1" {...register("consentPrivacy")} />I acknowledge
            the privacy policy.
          </label>
          {errors.consentPrivacy && (
            <p className="text-sm text-red-600">{errors.consentPrivacy.message}</p>
          )}
        </section>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Register"}
        </Button>
      </form>
    </main>
  );
}
