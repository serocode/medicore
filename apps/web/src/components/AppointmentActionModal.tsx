import { type FormEvent, useState } from "react";
import { Button } from "./Button";
import { Field, TextInput, Textarea } from "./Field";
import { Modal } from "./Modal";

type AppointmentActionModalProps =
  | { mode: "confirm"; onClose: () => void; onSubmit: (scheduledAt: string) => Promise<void> }
  | { mode: "cancel"; onClose: () => void; onSubmit: (reason: string) => Promise<void> };

export function AppointmentActionModal(props: AppointmentActionModalProps) {
  const { mode, onClose, onSubmit } = props;
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    const payload = mode === "confirm" ? new Date(value).toISOString() : value;
    await onSubmit(payload);
    setIsSubmitting(false);
  }

  return (
    <Modal
      title={mode === "confirm" ? "Schedule appointment" : "Cancel appointment"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "confirm" ? (
          <Field label="Scheduled for" htmlFor="scheduledAt">
            <TextInput
              id="scheduledAt"
              type="datetime-local"
              required
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </Field>
        ) : (
          <Field label="Reason for cancellation" htmlFor="cancellationReason">
            <Textarea
              id="cancellationReason"
              required
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </Field>
        )}
        <Button
          type="submit"
          variant={mode === "cancel" ? "danger" : "primary"}
          disabled={isSubmitting || !value.trim()}
        >
          {mode === "confirm" ? "Schedule Appointment" : "Cancel Appointment"}
        </Button>
      </form>
    </Modal>
  );
}
