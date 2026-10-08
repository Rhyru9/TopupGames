"use client";

import { useEffect, useRef, useState } from "react";
import { useConsoleFormUploadRegister } from "@/components/console/console-form-upload";
import { getUploadFormatHint, type UploadKind } from "@/lib/storage/upload-kinds";

type ConsoleImageUploadProps = {
  name: string;
  kind: UploadKind;
  label: string;
  initialValue?: string;
  required?: boolean;
  hint?: string;
  error?: string;
};

const kindLayout: Record<UploadKind, "square" | "wide"> = {
  "game-thumbnail": "square",
  "game-banner": "wide",
  "landing-banner": "wide",
  "category-icon": "square",
  "product-type-icon": "square",
  "site-logo": "square",
  "site-favicon": "square",
  "site-og-image": "wide",
  "site-pwa-icon": "square",
  "member-avatar": "square",
  "admin-avatar": "square",
  "article-cover": "wide",
  "popup-image": "wide",
  "expense-receipt": "wide",
};

function UploadIcon() {
  return (
    <svg
      className="console-image-upload__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <path d="M21 16l-5.5-5.5a1.5 1.5 0 0 0-2.12 0L3 21" strokeLinecap="round" />
    </svg>
  );
}

function fileLabelFromPath(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function ConsoleImageUpload({
  name,
  kind,
  label,
  initialValue = "",
  required = false,
  hint,
  error,
}: ConsoleImageUploadProps) {
  const formatHint = hint ?? getUploadFormatHint(kind);
  const uploadContext = useConsoleFormUploadRegister();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [savedValue, setSavedValue] = useState(initialValue);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setSavedValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (!pendingFile || !uploadContext) return;

    return uploadContext.registerPending({
      name,
      kind,
      file: pendingFile,
    });
  }, [pendingFile, uploadContext, name, kind]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function setLocalPreview(file: File) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const nextPreview = URL.createObjectURL(file);
    previewUrlRef.current = nextPreview;
    setPreviewUrl(nextPreview);
    setPendingFile(file);
    setLocalError(null);
  }

  function selectFile(file: File) {
    if (!isImageFile(file)) {
      setLocalError("Hanya file gambar yang didukung.");
      return;
    }

    setLocalPreview(file);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) selectFile(file);
  }

  function handleDragEnter(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(true);
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget === event.target) {
      setDragging(false);
    }
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) selectFile(file);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function handleClear(event: React.MouseEvent) {
    event.stopPropagation();

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreviewUrl(null);
    setPendingFile(null);
    setSavedValue("");
    setLocalError(null);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  }

  const layout = kindLayout[kind];
  const displayUrl = previewUrl || savedValue || null;
  const hasImage = Boolean(displayUrl);
  const displayName = pendingFile?.name || (savedValue ? fileLabelFromPath(savedValue) : null);
  const hasPending = Boolean(pendingFile);

  return (
    <div className="console-field console-field--full">
      <span className="console-field__label">{label}</span>

      <input
        type="hidden"
        name={name}
        value={savedValue}
        required={required && !savedValue && !pendingFile}
      />

      <div className="console-image-upload">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="console-image-upload__file"
          onChange={handleFileChange}
          tabIndex={-1}
        />

        <div
          role="button"
          tabIndex={0}
          aria-label={hasImage ? "Ganti gambar" : "Pilih gambar"}
          className={[
            "console-image-upload__zone",
            `console-image-upload__zone--${layout}`,
            hasImage ? "console-image-upload__zone--filled" : "",
            hasPending ? "console-image-upload__zone--pending" : "",
            dragging ? "console-image-upload__zone--drag" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={openPicker}
          onKeyDown={handleKeyDown}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`console-image-upload__thumb console-image-upload__thumb--${layout}`}>
            {displayUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayUrl} alt="" className="console-image-upload__img" />
            ) : (
              <UploadIcon />
            )}
          </div>

          <div className="console-image-upload__body">
            <span
              className={
                displayName
                  ? "console-image-upload__text console-image-upload__text--value"
                  : "console-image-upload__text"
              }
              title={displayName || undefined}
            >
              {displayName || "Klik atau tarik gambar ke sini"}
            </span>
            {hasPending ? (
              <span className="console-image-upload__pending">Belum disimpan — unggah saat klik Simpan</span>
            ) : null}
          </div>

          {hasImage ? (
            <button
              type="button"
              className="console-image-upload__remove"
              aria-label="Hapus gambar"
              onClick={handleClear}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {formatHint ? <p className="console-field__hint">{formatHint}</p> : null}
      {localError ? <p className="console-field__error">{localError}</p> : null}
      {error ? <p className="console-field__error">{error}</p> : null}
    </div>
  );
}
