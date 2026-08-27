import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Native <dialog> fires a real "close" event from a programmatic close()
  // too — including the one React 18 StrictMode's dev-only double-invoked
  // effect cleanup triggers right after mount. Listening for "cancel"
  // (Escape only, never fired by close()) instead of wiring onClose as a
  // JSX prop avoids that class of spurious-close bug.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    dialog.addEventListener("cancel", onClose);
    return () => {
      dialog.removeEventListener("cancel", onClose);
      dialog.close();
    };
  }, [onClose]);

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
      className="m-auto w-full max-w-md rounded-lg bg-white p-6 shadow-lg backdrop:bg-slate-900/50"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
