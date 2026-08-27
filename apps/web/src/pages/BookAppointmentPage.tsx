import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { Field, Select, TextInput, Textarea } from "../components/Field";
import { apiFetch } from "../lib/api-client";
import type { Appointment } from "../lib/types";
import { useDoctors } from "../lib/use-doctors";

const bookAppointmentSchema = z.object({
  doctorId: z.string().min(1, "Select a physician"),
  reason: z.string().min(1, "Required"),
  notes: z.string().optional(),
  preferredSchedule: z.string().min(1, "Required"),
});

type BookAppointmentValues = z.infer<typeof bookAppointmentSchema>;

export function BookAppointmentPage() {
  const navigate = useNavigate();
  const doctors = useDoctors();
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookAppointmentValues>({ resolver: zodResolver(bookAppointmentSchema) });

  async function onSubmit(values: BookAppointmentValues) {
    setSubmitError(undefined);
    try {
      const result = await apiFetch<{ appointment: Appointment }>("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          doctorId: values.doctorId,
          reason: values.reason,
          notes: values.notes || undefined,
          preferredSchedule: new Date(values.preferredSchedule).toISOString(),
        }),
      });
      const doctor = doctors.data?.find((d) => d.id === values.doctorId) ?? null;
      navigate("/book/success", { state: { appointment: result.appointment, doctor } });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Booking failed");
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-semibold text-slate-900">Request an appointment</h1>
      <p className="mb-6 mt-1 text-slate-600">Tell us who you'd like to see and when.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Physician" htmlFor="doctorId" error={errors.doctorId?.message}>
          <Select id="doctorId" {...register("doctorId")}>
            <option value="">Select a physician</option>
            {doctors.data?.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} — {doctor.specialization}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Expected appointment date"
          htmlFor="preferredSchedule"
          error={errors.preferredSchedule?.message}
        >
          <TextInput
            id="preferredSchedule"
            type="datetime-local"
            {...register("preferredSchedule")}
          />
        </Field>

        <Field label="Reason for appointment" htmlFor="reason" error={errors.reason?.message}>
          <Textarea id="reason" {...register("reason")} />
        </Field>

        <Field label="Notes" htmlFor="notes">
          <Textarea id="notes" {...register("notes")} />
        </Field>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Requesting…" : "Create Appointment"}
        </Button>
      </form>
    </AuthLayout>
  );
}
