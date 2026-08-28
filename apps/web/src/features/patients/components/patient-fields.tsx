import type { Doctor } from "@/features/appointments/hooks/use-doctors";
import { IDENTIFICATION_TYPES, MAX_CLINICAL_TEXT, MAX_LINE_TEXT } from "@/shared/lib/constants";
import { clinicToday } from "@/shared/lib/timezone";
import {
  CheckboxField,
  Field,
  RadioGroupField,
  Select,
  TextInput,
  Textarea,
} from "@/shared/ui/Field";
import { FileText, MapPin, Phone, ShieldCheck } from "lucide-react";
import type { FieldErrors, UseFormRegister, UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";

/**
 * The patient intake fields, as reusable groups.
 *
 * Registration and the account page ask for the same information but present
 * it completely differently — a guided sequence when onboarding, editable
 * sections when managing. Sharing the groups rather than the whole form is
 * what lets the two pages diverge in shape without diverging in what they
 * capture or how they validate it.
 */

// Mirrors apps/api/src/routes/patients.ts.
const looksLikePhone = (value: string) =>
  /^[+()\d][\d\s().+-]*(?:(?:ext|x|#)\.?\s*\d+)?$/i.test(value.trim()) &&
  (value.match(/\d/g)?.length ?? 0) >= 7;

const line = z.string().min(1, "Required").max(MAX_LINE_TEXT, "That's too long");
const notes = z.string().max(MAX_CLINICAL_TEXT, "That's too long").optional();

export const patientDetailsSchema = z.object({
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

export type PatientDetailsValues = z.infer<typeof patientDetailsSchema>;

// Loosely typed so both parent forms — whose overall schemas differ — can pass
// their own register. Same composition escape hatch VitalsForm already uses.
interface GroupProps {
  register: UseFormRegister<never>;
  errors: FieldErrors<PatientDetailsValues>;
}

function useTypedRegister(register: UseFormRegister<never>) {
  return register as unknown as UseFormRegister<PatientDetailsValues>;
}

export function PersonalDetailsFields({
  register,
  errors,
  genderRegister,
}: GroupProps & { genderRegister: UseFormRegisterReturn }) {
  const field = useTypedRegister(register);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date of birth" htmlFor="birthDate" error={errors.birthDate?.message} required>
          <TextInput id="birthDate" type="date" max={clinicToday()} {...field("birthDate")} />
        </Field>
        <Field label="Gender" htmlFor="gender" error={errors.gender?.message} required>
          <RadioGroupField
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
            ]}
            registerProps={genderRegister}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Address" htmlFor="address" error={errors.address?.message} required>
          <TextInput
            id="address"
            icon={MapPin}
            autoComplete="street-address"
            {...field("address")}
          />
        </Field>
        <Field label="Occupation" htmlFor="occupation" error={errors.occupation?.message} required>
          <TextInput id="occupation" {...field("occupation")} />
        </Field>
      </div>
    </div>
  );
}

export function EmergencyContactFields({ register, errors }: GroupProps) {
  const field = useTypedRegister(register);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Emergency contact name"
        htmlFor="emergencyContactName"
        error={errors.emergencyContactName?.message}
        required
      >
        <TextInput id="emergencyContactName" {...field("emergencyContactName")} />
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
          inputMode="tel"
          autoComplete="tel"
          {...field("emergencyContactPhone")}
        />
      </Field>
    </div>
  );
}

export function MedicalInformationFields({
  register,
  errors,
  doctors,
}: GroupProps & { doctors: { data: Doctor[] | null; isLoading: boolean } }) {
  const field = useTypedRegister(register);
  return (
    <div className="flex flex-col gap-4">
      <Field
        label="Primary physician"
        htmlFor="primaryPhysicianId"
        error={errors.primaryPhysicianId?.message}
        required
      >
        <Select id="primaryPhysicianId" {...field("primaryPhysicianId")}>
          <option value="">
            {doctors.isLoading ? "Loading physicians…" : "Select a physician"}
          </option>
          {doctors.data?.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name} — {doctor.specialization}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Insurance provider" htmlFor="insuranceProvider" hint="Optional">
          <TextInput id="insuranceProvider" {...field("insuranceProvider")} />
        </Field>
        <Field label="Insurance policy number" htmlFor="insurancePolicyNumber" hint="Optional">
          <TextInput id="insurancePolicyNumber" {...field("insurancePolicyNumber")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Allergies" htmlFor="allergies" hint="Leave blank if you have none">
          <Textarea id="allergies" {...field("allergies")} />
        </Field>
        <Field label="Current medications" htmlFor="currentMedications" hint="Optional">
          <Textarea id="currentMedications" {...field("currentMedications")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Family medical history" htmlFor="familyMedicalHistory" hint="Optional">
          <Textarea id="familyMedicalHistory" {...field("familyMedicalHistory")} />
        </Field>
        <Field label="Past medical history" htmlFor="pastMedicalHistory" hint="Optional">
          <Textarea id="pastMedicalHistory" {...field("pastMedicalHistory")} />
        </Field>
      </div>
    </div>
  );
}

export function IdentificationFields({ register, errors }: GroupProps) {
  const field = useTypedRegister(register);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Identification type"
        htmlFor="identificationType"
        error={errors.identificationType?.message}
        required
      >
        <Select id="identificationType" icon={ShieldCheck} {...field("identificationType")}>
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
        <TextInput id="identificationNumber" icon={FileText} {...field("identificationNumber")} />
      </Field>
    </div>
  );
}

export function ConsentFields({ register, errors }: GroupProps) {
  const field = useTypedRegister(register);
  const items = [
    { name: "consentTreatment" as const, label: "I consent to treatment." },
    {
      name: "consentDisclosure" as const,
      label: "I consent to disclosure of my health information to my care team.",
    },
    { name: "consentPrivacy" as const, label: "I acknowledge the privacy policy." },
  ];
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.name}>
          <CheckboxField id={item.name} label={item.label} {...field(item.name)} />
          {errors[item.name] && (
            <p role="alert" className="mt-1 text-sm text-danger">
              {errors[item.name]?.message}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
