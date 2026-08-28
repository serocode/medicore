import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Stethoscope } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/Button";
import { Field, RequiredLegend, Select, TextInput, Textarea } from "../components/Field";
import { PageHeader } from "../components/PageHeader";
import { StatusMessage } from "../components/StatusMessage";
import { apiFetch, applyApiErrorToForm } from "../lib/api-client";
import type { Appointment } from "../lib/types";
import { useDoctors } from "../lib/use-doctors";

const bookAppointmentSchema = z.object({
  doctorId: z.string().min(1, "Choose the physician you'd like to see"),
  reason: z.string().min(1, "Tell the clinic what the visit is about"),
  notes: z.string().optional(),
  preferredSchedule: z.string().min(1, "Choose a date and time"),
});

type BookAppointmentValues = z.infer<typeof bookAppointmentSchema>;

/** `datetime-local` needs a `YYYY-MM-DDTHH:mm` string, in local time. */
function nowForDateTimeInput(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

export function BookAppointmentPage() {
  const navigate = useNavigate();
  const doctors = useDoctors();
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    setError,
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
      applyApiErrorToForm(error, setError);
      setSubmitError(
        error instanceof Error ? error.message : "We couldn't submit your request. Please retry.",
      );
    }
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "My appointments", to: "/dashboard" },
          { label: "Book an appointment" },
        ]}
        title="Book an appointment"
        description="Tell us who you'd like to see and when. The clinic confirms the slot and emails you back."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <RequiredLegend />

        <Field label="Physician" htmlFor="doctorId" error={errors.doctorId?.message} required>
          <Select id="doctorId" icon={Stethoscope} defaultValue="" {...register("doctorId")}>
            <option value="" disabled>
              {doctors.isLoading ? "Loading physicians…" : "Select a physician"}
            </option>
            {doctors.data?.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} — {doctor.specialization}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Preferred date and time"
          htmlFor="preferredSchedule"
          error={errors.preferredSchedule?.message}
          hint="This is a request, not a booked slot — the clinic confirms the exact time."
          required
        >
          <TextInput
            id="preferredSchedule"
            type="datetime-local"
            icon={CalendarClock}
            min={nowForDateTimeInput()}
            {...register("preferredSchedule")}
          />
        </Field>

        <Field
          label="Reason for the visit"
          htmlFor="reason"
          error={errors.reason?.message}
          required
        >
          <Textarea
            id="reason"
            placeholder="e.g. Persistent cough for two weeks"
            {...register("reason")}
          />
        </Field>

        <Field
          label="Anything else the clinic should know"
          htmlFor="notes"
          hint="Optional — accessibility needs, preferred times, a recent change in medication."
        >
          <Textarea id="notes" {...register("notes")} />
        </Field>

        {doctors.error && <StatusMessage tone="error">{doctors.error}</StatusMessage>}
        {submitError && <StatusMessage tone="error">{submitError}</StatusMessage>}

        <Button type="submit" size="lg" className="self-start" disabled={isSubmitting}>
          {isSubmitting ? "Sending request…" : "Request appointment"}
        </Button>
      </form>
    </>
  );
}
