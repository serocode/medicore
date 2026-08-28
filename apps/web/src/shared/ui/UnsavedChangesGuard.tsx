import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { useEffect } from "react";
import { useBlocker } from "react-router-dom";

interface UnsavedChangesGuardProps {
  /**
   * True only when there is real work to lose. Pair react-hook-form's
   * `isDirty` with `!isSubmitSuccessful` so the redirect after a successful
   * save isn't treated as an escape.
   */
  when: boolean;
}

/**
 * Warns before in-app navigation or a tab close would discard a part-finished
 * form. Deliberately quiet: an untouched form never prompts, and neither does
 * a form that just saved.
 */
export function UnsavedChangesGuard({ when }: UnsavedChangesGuardProps) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!when) return;
    // Browsers ignore custom text here and show their own wording; calling
    // preventDefault is the whole API.
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [when]);

  // If the form stops being dirty while a prompt is up (a save landed), drop
  // the block rather than leaving the user staring at a stale question.
  useEffect(() => {
    if (!when && blocker.state === "blocked") blocker.reset();
  }, [when, blocker]);

  if (blocker.state !== "blocked") return null;

  return (
    <Modal title="Leave without saving?" onClose={() => blocker.reset()}>
      <p className="text-sm text-ink-muted">
        This form has changes that haven't been saved. If you leave now they'll be discarded.
      </p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={() => blocker.reset()}>
          Stay on this page
        </Button>
        <Button variant="danger" onClick={() => blocker.proceed()}>
          Discard changes
        </Button>
      </div>
    </Modal>
  );
}
