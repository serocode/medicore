import {
  CLINIC_HOURS_SUMMARY,
  availableSlotTimes,
  formatSlotLabel,
  isClinicWorkingDay,
} from "@/features/appointments/lib/clinic-hours";
import { CLINIC_TIME_ZONE_LABEL, clinicInputToIso, clinicToday } from "@/shared/lib/timezone";
import { Button } from "@/shared/ui/Button";
import { Field, Select, TextInput, Textarea } from "@/shared/ui/Field";
import { Modal } from "@/shared/ui/Modal";
import { StatusMessage } from "@/shared/ui/StatusMessage";
import { type FormEvent, useState } from "react";

type AppointmentActionModalProps = {
  /** Extra context for the person taking the action. */
  description?: string;
  /** Shown under the reason field — e.g. how to rebook after cancelling. */
  footnote?: string;
} & (
  | { mode: "confirm"; onClose: () => void; onSubmit: (scheduledAt: string) => Promise<void> }
  | { mode: "cancel"; onClose: () => void; onSubmit: (reason: string) => Promise<void> }
);

export function AppointmentActionModal(props: AppointmentActionModalProps) {
  const { mode, onClose, onSubmit, description, footnote } = props;
  const [value, setValue] = useState("");
  // Confirming needs a day and a slot, the same pair the patient chose from —
  // an administrator must not be able to commit the clinic to a time it is
  // shut. Cancelling reuses `value` for the reason text.
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const slots = availableSlotTimes(scheduledDate);
  const isWeekend = Boolean(scheduledDate) && !isClinicWorkingDay(scheduledDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);
    try {
      // "confirm" carries a clinic day and slot; "cancel" carries the reason.
      const payload =
        mode === "confirm" ? clinicInputToIso(`${scheduledDate}T${scheduledTime}`) : value;
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't go through. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      title={mode === "confirm" ? "Schedule appointment" : "Cancel appointment"}
      description={description}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {mode === "confirm" ? (
          <div className="grid gap-4">
            <Field
              label="Date"
              htmlFor="scheduledDate"
              hint={`Open ${CLINIC_HOURS_SUMMARY}.`}
              required
            >
              <TextInput
                id="scheduledDate"
                type="date"
                min={clinicToday()}
                required
                autoFocus
                value={scheduledDate}
                onChange={(event) => {
                  setScheduledDate(event.target.value);
                  setScheduledTime("");
                }}
              />
            </Field>
            <Field label="Time" htmlFor="scheduledTime" hint={CLINIC_TIME_ZONE_LABEL} required>
              <Select
                id="scheduledTime"
                required
                value={scheduledTime}
                onChange={(event) => setScheduledTime(event.target.value)}
              >
                <option value="">
                  {!scheduledDate
                    ? "Choose a date first"
                    : isWeekend
                      ? "Clinic closed — pick a weekday"
                      : slots.length === 0
                        ? "No slots left today"
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
        ) : (
          <Field
            label="Reason for cancelling"
            htmlFor="cancellationReason"
            hint={footnote}
            required
          >
            <Textarea
              id="cancellationReason"
              required
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </Field>
        )}
        {error && <StatusMessage tone="error">{error}</StatusMessage>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Keep as is
          </Button>
          <Button
            type="submit"
            variant={mode === "cancel" ? "danger" : "primary"}
            disabled={
              isSubmitting ||
              (mode === "confirm" ? !scheduledDate || !scheduledTime : !value.trim())
            }
          >
            {isSubmitting
              ? mode === "confirm"
                ? "Scheduling…"
                : "Cancelling…"
              : mode === "confirm"
                ? "Schedule appointment"
                : "Cancel appointment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
