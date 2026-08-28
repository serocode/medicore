import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { StatusMessage } from "@/shared/ui/StatusMessage";
import { useState } from "react";

interface ConfirmDialogProps {
  title: string;
  description: string;
  /** The button label. Name the action — "Disable account", not "OK". */
  confirmLabel: string;
  pendingLabel: string;
  tone?: "primary" | "danger";
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

/**
 * Confirmation for an action that is hard to walk back. Owns its own pending
 * and error state so every call site gets the same feedback behaviour.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  pendingLabel,
  tone = "danger",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  async function handleConfirm() {
    setError(undefined);
    setIsPending(true);
    try {
      await onConfirm();
    } catch (err) {
      // Stays open on failure — closing would hide the reason it failed.
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsPending(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-ink-muted">{description}</p>
      {error && (
        <StatusMessage tone="error" className="mt-4">
          {error}
        </StatusMessage>
      )}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={isPending}>
          Keep as is
        </Button>
        <Button variant={tone} onClick={handleConfirm} disabled={isPending}>
          {isPending ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
