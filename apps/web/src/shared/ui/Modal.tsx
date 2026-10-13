import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  /** `md` suits a confirmation; `lg` suits a form with side-by-side fields. */
  size?: "md" | "lg";
  children: ReactNode;
}

const SIZE_CLASSES = { md: "max-w-md", lg: "max-w-xl" } as const;

export function Modal({ title, description, onClose, size = "md", children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Callers pass `onClose` inline, so it is a new function on every render.
  // Keyed on it, the effect below closed and reopened the dialog on each
  // keystroke in a field — and showModal() hands focus to the close button
  // every time it opens. Reading it through a ref keeps the effect mount-only.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Native <dialog> fires a real "close" event from a programmatic close()
  // too — including the one React 18 StrictMode's dev-only double-invoked
  // effect cleanup triggers right after mount. Listening for "cancel"
  // (Escape only, never fired by close()) instead of wiring onClose as a
  // JSX prop avoids that class of spurious-close bug.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = () => onCloseRef.current();
    dialog.showModal();
    // React's `autoFocus` fires while the dialog is still closed (a no-op),
    // and showModal() then focuses the close button. A form dialog should
    // open on its first field instead.
    dialog.querySelector<HTMLElement>("input, select, textarea")?.focus();
    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.close();
    };
  }, []);

  return (
    // Backdrop-click-to-close; Escape is handled separately via the native
    // "cancel" listener above, so no keyboard handler is needed for this.
    // biome-ignore lint/a11y/useKeyWithClickEvents: native <dialog> backdrop click.
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      // `w-[calc(100%-2rem)]` keeps a 16px gutter on small screens instead of
      // letting the dialog run edge to edge.
      className={`m-auto w-[calc(100%-2rem)] rounded-card bg-white p-6 text-ink shadow-ambient-lg backdrop:bg-inverse/50 ${SIZE_CLASSES[size]}`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-headline-sm text-ink">{title}</h2>
          {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-m-1 shrink-0 rounded-control p-1 text-ink-subtle transition-colors hover:bg-surface-container hover:text-ink"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
