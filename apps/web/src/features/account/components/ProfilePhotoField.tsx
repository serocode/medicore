import { API_URL, apiFetch, apiFetchForm } from "@/shared/lib/api-client";
import type { AccountProfile } from "@/shared/lib/types";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { StatusMessage } from "@/shared/ui/StatusMessage";
import { Camera, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

/** Matches what the account photo route accepts. */
const ACCEPTED = "image/jpeg,image/png";
const MAX_BYTES = 5 * 1024 * 1024;

interface ProfilePhotoFieldProps {
  account: AccountProfile;
  onChange: (account: AccountProfile) => void;
}

/**
 * Upload, replace, or remove the account photo.
 *
 * Uploads immediately rather than waiting for the surrounding form to be
 * saved: a picture is a single self-contained change, and holding it hostage
 * to the rest of the form would make "did that work?" unanswerable. A local
 * preview shows straight away so the change is visible before the round trip
 * finishes.
 */
export function ProfilePhotoField({ account, onChange }: ProfilePhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remoteUrl = account.imagePath ? `${API_URL}/api/uploads/${account.imagePath}` : null;
  const shownUrl = preview ?? remoteUrl;

  async function upload(file: File | null) {
    if (!file) return;
    setError(null);

    if (!ACCEPTED.split(",").includes(file.type)) {
      setError("Choose a JPEG or PNG image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`);
      return;
    }

    // Show it immediately; revoke the object URL once the server copy is live.
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setIsBusy(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const result = await apiFetchForm<{ account: AccountProfile }>(
        "/api/account/me/photo",
        formData,
      );
      onChange(result.account);
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "We couldn't upload that image.");
    } finally {
      URL.revokeObjectURL(localUrl);
      setPreview(null);
      setIsBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setError(null);
    setIsBusy(true);
    try {
      const result = await apiFetch<{ account: AccountProfile }>("/api/account/me/photo", {
        method: "DELETE",
      });
      onChange(result.account);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't remove that image.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative">
          {shownUrl ? (
            <img
              src={shownUrl}
              alt=""
              className="h-20 w-20 rounded-full border border-line object-cover"
            />
          ) : (
            // The generated initials avatar is the graceful default — never a
            // broken image or an empty circle.
            <Avatar name={account.name || account.email} size={80} />
          )}
          {isBusy && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70 text-caption font-semibold text-ink">
              Saving…
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={isBusy}
              onClick={() => inputRef.current?.click()}
            >
              <Camera aria-hidden="true" className="h-4 w-4" />
              {account.imagePath ? "Change photo" : "Upload photo"}
            </Button>
            {account.imagePath && (
              <Button variant="ghost" size="sm" disabled={isBusy} onClick={remove}>
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-caption text-ink-subtle">JPEG or PNG, up to 5 MB.</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        aria-label="Profile photo"
        onChange={(event) => upload(event.target.files?.[0] ?? null)}
      />

      {error && <StatusMessage tone="error">{error}</StatusMessage>}
    </div>
  );
}
