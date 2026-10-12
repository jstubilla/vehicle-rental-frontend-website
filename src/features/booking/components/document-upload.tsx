import { useId, useRef, useState } from "react";
import { Button, CheckIcon, ImageIcon } from "@/components/ui";
import { content } from "@/content";
import { cn } from "@/lib/cn";
import { compressPhoto, type PhotoError } from "@/lib/image";
import type { UploadedDocument } from "@/types";

const t = content.booking.documents;

/**
 * One document photo (e.g. the valid ID): pick a photo, see a preview, replace or remove it.
 * The photo is scaled down in the browser before it is kept, see /src/lib/image.ts.
 */
export function DocumentUpload({
  label,
  hint,
  value,
  onChange,
  error,
}: {
  label: string;
  hint: string;
  value: UploadedDocument | null;
  onChange: (value: UploadedDocument | null) => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [photoError, setPhotoError] = useState<PhotoError | null>(null);
  const shownError = photoError ? t[photoError] : error;
  const describedBy = [`${id}-hint`, shownError && `${id}-error`].filter(Boolean).join(" ");

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setPhotoError(null);
    try {
      onChange({ fileName: file.name, dataUrl: await compressPhoto(file) });
    } catch (reason) {
      setPhotoError(typeof reason === "string" ? (reason as PhotoError) : "unreadable");
    } finally {
      setBusy(false);
      // Lets the same file be picked again after it is removed.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-center",
        shownError ? "border-danger" : value ? "border-border-strong" : "border-dashed border-border-strong",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="grid h-18 w-24 shrink-0 place-items-center overflow-hidden rounded-sm bg-surface-muted">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- a local data URL, nothing to optimise
            <img src={value.dataUrl} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-6 text-muted" aria-hidden="true" />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="font-medium">{label}</p>
          {value ? (
            <p id={`${id}-hint`} className="flex min-w-0 items-center gap-1 text-sm text-muted">
              <CheckIcon className="size-4 shrink-0 text-success" aria-hidden="true" />
              <span className="sr-only">{t.uploaded}: </span>
              <span className="truncate">{value.fileName}</span>
            </p>
          ) : (
            <p id={`${id}-hint`} className="text-sm text-muted">
              {busy ? t.processing : `${hint} ${t.formats}.`}
            </p>
          )}
          {shownError && (
            <p id={`${id}-error`} role="alert" className="text-sm font-medium text-danger">
              {shownError}
            </p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label={label}
        tabIndex={-1}
        className="sr-only"
        onChange={(event) => pick(event.target.files?.[0])}
      />
      <div className="flex shrink-0 gap-2">
        <Button
          variant={value ? "outline" : "secondary"}
          size="sm"
          loading={busy}
          aria-label={`${value ? t.replace : t.choose}: ${label}`}
          aria-describedby={describedBy}
          aria-invalid={shownError ? true : undefined}
          onClick={() => inputRef.current?.click()}
        >
          {value ? t.replace : t.choose}
        </Button>
        {value && (
          <Button variant="ghost" size="sm" aria-label={`${t.remove}: ${label}`} onClick={() => onChange(null)}>
            {t.remove}
          </Button>
        )}
      </div>
    </div>
  );
}
