import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Clock, Stethoscope } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/Button";
import { Field, RequiredLegend, Select, TextInput, Textarea } from "../components/Field";
import { PageHeader } from "../components/PageHeader";
import { StatusMessage } from "../components/StatusMessage";
import { apiFetch, applyApiErrorToForm } from "../lib/api-client";
import {
  CLINIC_HOURS_SUMMARY,
  availableSlotTimes,
  formatSlotLabel,
  isClinicWorkingDay,
} from "../lib/clinic-hours";
import { CLINIC_TIME_ZONE_LABEL, clinicInputToIso, clinicToday } from "../lib/timezone";
import type { Appointment } from "../lib/types";
import { useDoctors } from "../lib/use-doctors";

const bookAppointmentSchema = z.object({
  doctorId: z.string().min(1, "Choose the physician you'd like to see"),
  reason: z.string().min(1, "Tell the clinic what the visit is about"),
  notes: z.string().optional(),
  // Split into a date and a slot: the clinic only opens at fixed times, and a
  // free datetime field invites people to ask for 03:00 on a Sunday and then
  // be refused. Offering only real slots makes the rule obvious up front.
  preferredDate: z
    .string()
    .min(1, "Choose a date")
    .refine(isClinicWorkingDay, "The clinic is closed at weekends — choose a weekday"),
  preferredTime: z.string().min(1, "Choose a time"),
});

type BookAppointmentValues = z.infer<typeof bookAppointmentSchema>;

export function BookAppointmentPage() {
  const navigate = useNavigate();
  const doctors = useDoctors();
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BookAppointmentValues>({
    resolver: zodResolver(bookAppointmentSchema),
    defaultValues: { doctorId: "", reason: "", notes: "", preferredDate: "", preferredTime: "" },
  });

  // The slot list depends on the chosen day: a weekend has none, and today
  // loses the slots that have already gone by in Manila.
  const preferredDate = useWatch({ control, name: "preferredDate" });
  const slots = availableSlotTimes(preferredDate);
  const isWeekend = Boolean(preferredDate) && !isClinicWorkingDay(preferredDate);

  async function onSubmit(values: BookAppointmentValues) {
    setSubmitError(undefined);
    try {
      const result = await apiFetch<{ appointment: Appointment }>("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          doctorId: values.doctorId,
          reason: values.reason,
          notes: values.notes || undefined,
          // The chosen day and slot are clinic time, not the browser's.
          preferredSchedule: clinicInputToIso(`${values.preferredDate}T${values.preferredTime}`),
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

        {/* The date carries the longer hint, so it takes two of the three
            columns; the slot dropdown only ever holds a short time. */}
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field
              label="Preferred date"
              htmlFor="preferredDate"
              error={errors.preferredDate?.message}
              hint={`Open ${CLINIC_HOURS_SUMMARY}.`}
              required
            >
              <TextInput
                id="preferredDate"
                type="date"
                icon={CalendarDays}
                min={clinicToday()}
                {...register("preferredDate")}
              />
            </Field>
          </div>

          <div className="sm:col-span-1">
            <Field
              label="Preferred time"
              htmlFor="preferredTime"
              error={errors.preferredTime?.message}
              hint={`All times are ${CLINIC_TIME_ZONE_LABEL}.`}
              required
            >
              <Select id="preferredTime" icon={Clock} {...register("preferredTime")}>
                <option value="">
                  {!preferredDate
                    ? "Choose a date first"
                    : isWeekend
                      ? "Clinic closed — pick a weekday"
                      : slots.length === 0
                        ? "No slots left today — pick another date"
                        : "Select a time"}
                </option>
                {slots.map((slot) => (
                  <option key={slot} value={slot}>
                    {formatSlotLabel(slot)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        <p className="text-caption text-ink-subtle">
          This is a request, not a booked slot — the clinic confirms the exact time and emails you.
        </p>

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
