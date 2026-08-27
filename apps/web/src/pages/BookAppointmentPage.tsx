import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/Button";
import { Field, inputClassName } from "../components/Field";
import { apiFetch } from "../lib/api-client";
import { useDoctors } from "../lib/use-doctors";

const bookAppointmentSchema = z.object({
  doctorId: z.string().min(1, "Select a physician"),
  reason: z.string().min(1, "Required"),
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
      await apiFetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          doctorId: values.doctorId,
          reason: values.reason,
          preferredSchedule: new Date(values.preferredSchedule).toISOString(),
        }),
      });
      navigate("/dashboard");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Booking failed");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 bg-slate-50 p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Book an appointment</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6"
      >
        <Field label="Physician" htmlFor="doctorId" error={errors.doctorId?.message}>
          <select id="doctorId" className={inputClassName} {...register("doctorId")}>
            <option value="">Select a physician</option>
            {doctors.data?.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} — {doctor.specialization}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Reason for visit" htmlFor="reason" error={errors.reason?.message}>
          <textarea id="reason" className={inputClassName} {...register("reason")} />
        </Field>

        <Field
          label="Preferred date & time"
          htmlFor="preferredSchedule"
          error={errors.preferredSchedule?.message}
        >
          <input
            id="preferredSchedule"
            type="datetime-local"
            className={inputClassName}
            {...register("preferredSchedule")}
          />
        </Field>

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Booking…" : "Book appointment"}
        </Button>
      </form>
    </main>
  );
}
