import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { DoctorProfile, NurseProfile, StaffProfile } from "../lib/types";
import { Button } from "./Button";
import { Field, TextInput, Textarea } from "./Field";
import { FormSection } from "./FormSection";

const doctorSchema = z.object({
  name: z.string().min(1, "Required"),
  specialization: z.string().min(1, "Required"),
  title: z.string().optional(),
  department: z.string().optional(),
  licenseNumber: z.string().optional(),
  contactPhone: z.string().optional(),
  bio: z.string().optional(),
  yearsOfExperience: z.string().optional(),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

const nurseSchema = z.object({
  name: z.string().min(1, "Required"),
  title: z.string().optional(),
  department: z.string().optional(),
  licenseNumber: z.string().optional(),
  contactPhone: z.string().optional(),
  bio: z.string().optional(),
});

type NurseFormValues = z.infer<typeof nurseSchema>;

interface StaffProfileFormProps {
  profile: StaffProfile;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}

function DoctorProfileForm({
  doctor,
  onSubmit,
}: {
  doctor: DoctorProfile;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: doctor.name,
      specialization: doctor.specialization,
      title: doctor.title ?? "",
      department: doctor.department ?? "",
      licenseNumber: doctor.licenseNumber ?? "",
      contactPhone: doctor.contactPhone ?? "",
      bio: doctor.bio ?? "",
      yearsOfExperience: doctor.yearsOfExperience?.toString() ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values))} className="flex flex-col gap-8">
      <FormSection title="Professional Profile">
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <TextInput id="name" {...register("name")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Specialization"
            htmlFor="specialization"
            error={errors.specialization?.message}
          >
            <TextInput id="specialization" {...register("specialization")} />
          </Field>
          <Field label="Title" htmlFor="title">
            <TextInput id="title" placeholder="e.g. Attending Physician" {...register("title")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Department" htmlFor="department">
            <TextInput id="department" {...register("department")} />
          </Field>
          <Field label="Years of experience" htmlFor="yearsOfExperience">
            <TextInput id="yearsOfExperience" type="number" {...register("yearsOfExperience")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="License / registration number" htmlFor="licenseNumber">
            <TextInput id="licenseNumber" {...register("licenseNumber")} />
          </Field>
          <Field label="Contact phone" htmlFor="contactPhone">
            <TextInput id="contactPhone" {...register("contactPhone")} />
          </Field>
        </div>
        <Field label="Professional biography" htmlFor="bio">
          <Textarea id="bio" {...register("bio")} />
        </Field>
      </FormSection>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

function NurseProfileForm({
  nurse,
  onSubmit,
}: {
  nurse: NurseProfile;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NurseFormValues>({
    resolver: zodResolver(nurseSchema),
    defaultValues: {
      name: nurse.name,
      title: nurse.title ?? "",
      department: nurse.department ?? "",
      licenseNumber: nurse.licenseNumber ?? "",
      contactPhone: nurse.contactPhone ?? "",
      bio: nurse.bio ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values))} className="flex flex-col gap-8">
      <FormSection title="Professional Profile">
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <TextInput id="name" {...register("name")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="title">
            <TextInput id="title" placeholder="e.g. Registered Nurse" {...register("title")} />
          </Field>
          <Field label="Department" htmlFor="department">
            <TextInput id="department" {...register("department")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="License / registration number" htmlFor="licenseNumber">
            <TextInput id="licenseNumber" {...register("licenseNumber")} />
          </Field>
          <Field label="Contact phone" htmlFor="contactPhone">
            <TextInput id="contactPhone" {...register("contactPhone")} />
          </Field>
        </div>
        <Field label="Biography" htmlFor="bio">
          <Textarea id="bio" {...register("bio")} />
        </Field>
      </FormSection>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

export function StaffProfileForm({ profile, onSubmit }: StaffProfileFormProps) {
  if (profile.role === "doctor") {
    return <DoctorProfileForm doctor={profile.doctor} onSubmit={onSubmit} />;
  }
  return <NurseProfileForm nurse={profile.nurse} onSubmit={onSubmit} />;
}
