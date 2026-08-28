import { type FormEvent, useState } from "react";
import { Button } from "./Button";
import { Field, TextInput, Textarea } from "./Field";
import { Modal } from "./Modal";
import { StatusMessage } from "./StatusMessage";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);
    try {
      const payload = mode === "confirm" ? new Date(value).toISOString() : value;
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
          <Field label="Scheduled for" htmlFor="scheduledAt" required>
            <TextInput
              id="scheduledAt"
              type="datetime-local"
              required
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </Field>
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
            disabled={isSubmitting || !value.trim()}
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
