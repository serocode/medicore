import { UploadCloud, X } from "lucide-react";
import { type DragEvent, useRef, useState } from "react";

/**
 * Mirrors the default of MAX_UPLOAD_SIZE_MB in apps/api/src/env.ts. The server
 * stays authoritative — if a deployment raises its limit, the worst this does
 * is refuse a file the server would have taken; if it lowers it, the server
 * rejects with its own clear message.
 */
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const TYPE_LABELS: Record<string, string> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "application/pdf": "PDF",
};

function describeAccepted(accept: string | undefined): string {
  if (!accept) return "";
  return accept
    .split(",")
    .map((type) => TYPE_LABELS[type.trim()] ?? type.trim())
    .join(", ");
}

function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

interface FileUploaderProps {
  onChange: (file: File | null) => void;
  accept?: string;
  error?: string;
}

export function FileUploader({ onChange, accept, error }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rejection, setRejection] = useState<string | null>(null);

  /**
   * The `accept` attribute only filters the OS file picker — a dropped file
   * bypasses it entirely, and nothing checked size at all. Both are validated
   * here so the person finds out immediately rather than after a failed
   * upload. The server re-checks; this is courtesy, not security.
   */
  function reject(reason: string) {
    setRejection(reason);
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    onChange(null);
  }

  function handleFile(candidate: File | null) {
    if (!candidate) {
      reject("");
      setRejection(null);
      return;
    }

    const allowed = accept?.split(",").map((type) => type.trim());
    if (allowed?.length && !allowed.includes(candidate.type)) {
      reject(
        `${candidate.name} isn't a supported file type. Choose a ${describeAccepted(accept)} file.`,
      );
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      reject(
        `${candidate.name} is ${formatBytes(candidate.size)}. The limit is ${formatBytes(MAX_FILE_BYTES)}.`,
      );
      return;
    }

    setRejection(null);
    setFile(candidate);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return candidate.type.startsWith("image/") ? URL.createObjectURL(candidate) : null;
    });
    onChange(candidate);
  }

  function clearFile() {
    handleFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const message = error ?? rejection;

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event: DragEvent<HTMLButtonElement>) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event: DragEvent<HTMLButtonElement>) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files?.[0] ?? null);
        }}
        className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-control border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary-soft/40"
            : message
              ? "border-danger bg-danger-soft/40"
              : // line-strong, per the control-boundary rule in Field.tsx.
                "border-line-strong bg-surface-low"
        }`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview of the file you selected"
            className="h-24 w-24 rounded-control object-cover"
          />
        ) : (
          <UploadCloud aria-hidden="true" className="h-8 w-8 text-ink-subtle" />
        )}
        <p className="text-sm text-ink-muted">
          {file ? file.name : "Click to upload or drag and drop"}
        </p>
        <p className="text-caption text-ink-subtle">
          {file
            ? formatBytes(file.size)
            : `${describeAccepted(accept) || "Any file"} · up to ${formatBytes(MAX_FILE_BYTES)}`}
        </p>
      </button>

      {file && (
        <button
          type="button"
          onClick={clearFile}
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-muted underline underline-offset-4 hover:text-ink"
        >
          <X aria-hidden="true" className="h-3.5 w-3.5" />
          Remove {file.name}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
      />

      {message && (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {message}
        </p>
      )}
    </div>
  );
}
