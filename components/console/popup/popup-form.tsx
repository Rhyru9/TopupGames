"use client";

import { useActionState, useState } from "react";
import { savePopup, type PopupFormState } from "@/app/console/(panel)/popup/actions";
import {
  ConsoleFormUploadProvider,
  useConsoleFormUploadSubmit,
} from "@/components/console/console-form-upload";
import { ConsoleImageUpload } from "@/components/console/console-image-upload";
import type { SitePopupModeValue } from "@/lib/content/popup-form";

export type PopupFormValues = {
  title: string;
  mode: SitePopupModeValue;
  body: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  dismissMinutes: number;
  sortOrder: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

type PopupFormProps = {
  mode: "create" | "edit";
  popupId?: string;
  initialValues?: Partial<PopupFormValues>;
};

const initialState: PopupFormState = {};

export function PopupForm(props: PopupFormProps) {
  return (
    <ConsoleFormUploadProvider>
      <PopupFormContent {...props} />
    </ConsoleFormUploadProvider>
  );
}

function PopupFormContent({ mode, popupId, initialValues }: PopupFormProps) {
  const [state, formAction, pending] = useActionState(savePopup, initialState);
  const { onSubmit, isUploading, uploadError } = useConsoleFormUploadSubmit(formAction);
  const isSaving = pending || isUploading;

  const values: PopupFormValues = {
    title: "",
    mode: "IMAGE",
    body: "",
    imageUrl: "",
    ctaLabel: "",
    ctaHref: "",
    dismissMinutes: 5,
    sortOrder: 0,
    startsAt: "",
    endsAt: "",
    isActive: true,
    ...initialValues,
  };

  const [contentMode, setContentMode] = useState<SitePopupModeValue>(values.mode);

  return (
    <form action={formAction} onSubmit={onSubmit} className="console-form">
      {mode === "edit" && popupId ? <input type="hidden" name="popupId" value={popupId} /> : null}

      {state.error ? (
        <div className="console-alert console-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}

      {uploadError ? (
        <div className="console-alert console-alert--error" role="alert">
          {uploadError}
        </div>
      ) : null}

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Konten Popup</p>
        </div>
        <div className="console-provider-card__body">
          <div className="console-form__grid">
            <div className="console-field console-field--full">
              <label htmlFor="title" className="console-field__label">
                Judul *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                defaultValue={values.title}
                required
                maxLength={200}
                className="console-input w-full"
                placeholder="Promo top up minggu ini"
              />
              <p className="console-field__hint">Label admin; juga judul yang tampil di mode teks.</p>
              {state.fieldErrors?.title ? (
                <p className="console-field__error">{state.fieldErrors.title}</p>
              ) : null}
            </div>

            <div className="console-field console-field--full">
              <span className="console-field__label">Mode konten *</span>
              <div className="console-radio-group">
                <label className="console-field__label console-field__label--inline">
                  <input
                    type="radio"
                    name="mode"
                    value="IMAGE"
                    checked={contentMode === "IMAGE"}
                    onChange={() => setContentMode("IMAGE")}
                    className="console-checkbox"
                  />
                  Gambar
                </label>
                <label className="console-field__label console-field__label--inline">
                  <input
                    type="radio"
                    name="mode"
                    value="TEXT"
                    checked={contentMode === "TEXT"}
                    onChange={() => setContentMode("TEXT")}
                    className="console-checkbox"
                  />
                  Teks
                </label>
              </div>
            </div>

            {contentMode === "IMAGE" ? (
              <div className="console-field console-field--full">
                <ConsoleImageUpload
                  name="imageUrl"
                  kind="popup-image"
                  label="Gambar popup *"
                  required
                  initialValue={values.imageUrl}
                  hint="Rekomendasi rasio mendekati 4:5 atau 1:1 untuk mobile. Klik gambar bisa ke link CTA."
                  error={state.fieldErrors?.imageUrl}
                />
              </div>
            ) : (
              <div className="console-field console-field--full">
                <label htmlFor="body" className="console-field__label">
                  Isi teks *
                </label>
                <textarea
                  id="body"
                  name="body"
                  rows={5}
                  defaultValue={values.body}
                  required={contentMode === "TEXT"}
                  className="console-input console-textarea w-full"
                  placeholder="Tulis pengumuman singkat untuk pelanggan…"
                />
                {state.fieldErrors?.body ? (
                  <p className="console-field__error">{state.fieldErrors.body}</p>
                ) : null}
              </div>
            )}

            {contentMode === "IMAGE" ? <input type="hidden" name="body" value="" /> : null}
            {contentMode === "TEXT" ? <input type="hidden" name="imageUrl" value="" /> : null}
          </div>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">CTA &amp; perilaku</p>
        </div>
        <div className="console-provider-card__body">
          <div className="console-form__grid">
            <div className="console-field">
              <label htmlFor="ctaLabel" className="console-field__label">
                Label tombol CTA
              </label>
              <input
                id="ctaLabel"
                name="ctaLabel"
                type="text"
                defaultValue={values.ctaLabel}
                maxLength={80}
                className="console-input w-full"
                placeholder="Lihat promo"
              />
              <p className="console-field__hint">Mode teks: tampil sebagai tombol. Mode gambar: opsional.</p>
              {state.fieldErrors?.ctaLabel ? (
                <p className="console-field__error">{state.fieldErrors.ctaLabel}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="ctaHref" className="console-field__label">
                Link tujuan
              </label>
              <input
                id="ctaHref"
                name="ctaHref"
                type="text"
                defaultValue={values.ctaHref}
                className="console-input w-full"
                placeholder="/produk, /flash-sale, atau https://..."
              />
              {state.fieldErrors?.ctaHref ? (
                <p className="console-field__error">{state.fieldErrors.ctaHref}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="dismissMinutes" className="console-field__label">
                Dismiss (menit) *
              </label>
              <input
                id="dismissMinutes"
                name="dismissMinutes"
                type="number"
                min={1}
                max={43200}
                defaultValue={values.dismissMinutes}
                required
                className="console-input w-full"
              />
              <p className="console-field__hint">Setelah tutup, popup tidak muncul lagi selama X menit.</p>
              {state.fieldErrors?.dismissMinutes ? (
                <p className="console-field__error">{state.fieldErrors.dismissMinutes}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="sortOrder" className="console-field__label">
                Urutan
              </label>
              <input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={values.sortOrder}
                className="console-input w-full"
              />
              <p className="console-field__hint">Hanya 1 popup aktif teratas yang ditampilkan di storefront.</p>
              {state.fieldErrors?.sortOrder ? (
                <p className="console-field__error">{state.fieldErrors.sortOrder}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="startsAt" className="console-field__label">
                Mulai tampil
              </label>
              <input
                id="startsAt"
                name="startsAt"
                type="datetime-local"
                defaultValue={values.startsAt}
                className="console-input w-full"
              />
            </div>

            <div className="console-field">
              <label htmlFor="endsAt" className="console-field__label">
                Selesai tampil
              </label>
              <input
                id="endsAt"
                name="endsAt"
                type="datetime-local"
                defaultValue={values.endsAt}
                className="console-input w-full"
              />
              {state.fieldErrors?.endsAt ? (
                <p className="console-field__error">{state.fieldErrors.endsAt}</p>
              ) : null}
            </div>

            <div className="console-field console-field--full">
              <label className="console-field__label console-field__label--inline">
                <input
                  type="checkbox"
                  name="isActive"
                  value="on"
                  defaultChecked={values.isActive}
                  className="console-checkbox"
                />
                Aktif — tampil di beranda, katalog, dan detail produk
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="console-form__actions">
        <button type="submit" disabled={isSaving} className="console-btn-primary">
          {isSaving ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Buat Popup"}
        </button>
      </div>
    </form>
  );
}
