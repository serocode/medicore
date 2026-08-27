import { UploadCloud } from "lucide-react";
import { type DragEvent, useRef, useState } from "react";

interface FileUploaderProps {
  onChange: (file: File | null) => void;
  accept?: string;
  error?: string;
}

export function FileUploader({ onChange, accept, error }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file: File | null) {
    setFileName(file?.name ?? null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file?.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    });
    onChange(file);
  }

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
        className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center transition-colors ${
          isDragging ? "border-slate-500 bg-slate-100" : "border-slate-300 bg-white"
        }`}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Preview" className="h-24 w-24 rounded object-cover" />
        ) : (
          <UploadCloud className="h-8 w-8 text-slate-400" />
        )}
        <p className="text-sm text-slate-600">{fileName ?? "Click to upload or drag and drop"}</p>
        {!fileName && <p className="text-xs text-slate-400">JPEG, PNG, or PDF</p>}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
      />
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
