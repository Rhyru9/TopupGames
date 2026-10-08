"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import {
  updateMemberProfile,
  type MemberAuthFormState,
} from "@/app/member/actions";
import { getUploadFormatHint } from "@/lib/storage/upload-kinds";

const initialState: MemberAuthFormState = {};

type MemberProfileFormProps = {
  name: string;
  email: string;
  image: string | null;
  whatsapp: string | null;
};

export function MemberProfileForm({
  name,
  email,
  image,
  whatsapp,
}: MemberProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateMemberProfile, initialState);
  const [preview, setPreview] = useState(image ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const initial = name.trim().charAt(0).toUpperCase() || "M";

  function onPickFile(file: File | null) {
    if (!file) return;
    setUploadError(null);
    startUpload(() => {
      void (async () => {
        const body = new FormData();
        body.set("file", file);
        const res = await fetch("/api/member/upload", { method: "POST", body });
        const data = (await res.json()) as { path?: string; error?: string };
        if (!res.ok || !data.path) {
          setUploadError(data.error || "Upload gagal.");
          return;
        }
        setPreview(data.path);
      })();
    });
  }

  return (
    <form action={formAction} className="member-auth__form r9host-account-form r9host-account-form--profil">
      <input type="hidden" name="image" value={preview} />

      <aside className="r9host-account-form__photo" aria-label="Foto profil">
        <p className="r9host-account-form__photo-title">Foto profil</p>
        <div className="r9host-account-form__avatar r9host-account-form__avatar--stack">
          <div className="r9host-account-form__avatar-preview">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" />
            ) : (
              <span aria-hidden>{initial}</span>
            )}
          </div>
          <div className="r9host-account-form__avatar-actions">
            <button
              type="button"
              className="r9host-account-form__upload-btn"
              disabled={pending || uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? "Mengunggah…" : "Ganti foto"}
            </button>
            {preview ? (
              <button
                type="button"
                className="r9host-account-form__remove-btn"
                disabled={pending || uploading}
                onClick={() => setPreview("")}
              >
                Hapus foto
              </button>
            ) : null}
            <p className="member-auth__hint">{getUploadFormatHint()}</p>
            {uploadError ? <p className="member-auth__field-error">{uploadError}</p> : null}
            {state.fieldErrors?.image ? (
              <p className="member-auth__field-error">{state.fieldErrors.image}</p>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="r9host-account-form__file"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </aside>

      <div className="r9host-account-form__data">
        <div className="member-auth__field">
          <label className="member-auth__label" htmlFor="name">
            Nama
          </label>
          <input
            id="name"
            name="name"
            defaultValue={name}
            className="member-auth__input"
            required
            minLength={2}
            autoComplete="name"
          />
          {state.fieldErrors?.name ? (
            <p className="member-auth__field-error">{state.fieldErrors.name}</p>
          ) : null}
        </div>

        <div className="member-auth__field">
          <label className="member-auth__label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            className="member-auth__input"
            disabled
            readOnly
          />
          <p className="member-auth__hint">Email tidak bisa diubah dari sini.</p>
        </div>

        <div className="member-auth__field">
          <label className="member-auth__label" htmlFor="whatsapp">
            WhatsApp <span className="member-auth__optional">(opsional)</span>
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            defaultValue={whatsapp ?? ""}
            className="member-auth__input"
            placeholder="08xxxxxxxxxx"
            inputMode="tel"
          />
          {state.fieldErrors?.whatsapp ? (
            <p className="member-auth__field-error">{state.fieldErrors.whatsapp}</p>
          ) : null}
        </div>

        {state.error ? <p className="member-auth__error">{state.error}</p> : null}

        <button type="submit" className="member-auth__submit" disabled={pending || uploading}>
          {pending ? "Menyimpan…" : "Simpan profil"}
        </button>
      </div>
    </form>
  );
}
