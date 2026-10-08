"use client";

import { useActionState } from "react";
import { saveBanner, type BannerFormState } from "@/app/console/(panel)/banners/actions";
import {
  ConsoleFormUploadProvider,
  useConsoleFormUploadSubmit,
} from "@/components/console/console-form-upload";
import { ConsoleImageUpload } from "@/components/console/console-image-upload";

export type BannerFormValues = {
  title: string;
  imageUrl: string;
  href: string;
  sortOrder: number;
  isActive: boolean;
};

type BannerFormProps = {
  mode: "create" | "edit";
  bannerId?: string;
  initialValues?: Partial<BannerFormValues>;
};

const initialState: BannerFormState = {};

export function BannerForm(props: BannerFormProps) {
  return (
    <ConsoleFormUploadProvider>
      <BannerFormContent {...props} />
    </ConsoleFormUploadProvider>
  );
}

function BannerFormContent({ mode, bannerId, initialValues }: BannerFormProps) {
  const [state, formAction, pending] = useActionState(saveBanner, initialState);
  const { onSubmit, isUploading, uploadError } = useConsoleFormUploadSubmit(formAction);
  const isSaving = pending || isUploading;

  const values: BannerFormValues = {
    title: "",
    imageUrl: "",
    href: "",
    sortOrder: 0,
    isActive: true,
    ...initialValues,
  };

  return (
    <form action={formAction} onSubmit={onSubmit} className="console-form">
      {mode === "edit" && bannerId ? (
        <input type="hidden" name="bannerId" value={bannerId} />
      ) : null}

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

      <div className="console-form__grid">
        <div className="console-field console-field--full">
          <label htmlFor="title" className="console-field__label">
            Judul / Alt Text *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={values.title}
            required
            maxLength={200}
            className="console-input w-full"
            placeholder="Contoh: Promo Mobile Legends"
          />
          <p className="console-field__hint">Dipakai sebagai teks alternatif gambar di beranda.</p>
          {state.fieldErrors?.title ? (
            <p className="console-field__error">{state.fieldErrors.title}</p>
          ) : null}
        </div>

        <ConsoleImageUpload
          name="imageUrl"
          kind="landing-banner"
          label="Gambar Banner *"
          required
          initialValue={values.imageUrl}
          hint="Lebar penuh slider (disarankan 1400×540 px, rasio ~16:6). PNG, JPG, atau WebP."
          error={state.fieldErrors?.imageUrl}
        />

        <div className="console-field">
          <label htmlFor="href" className="console-field__label">
            Link tujuan
          </label>
          <input
            id="href"
            name="href"
            type="text"
            defaultValue={values.href}
            className="console-input w-full"
            placeholder="#games, /produk/slug, atau https://..."
          />
          <p className="console-field__hint">Kosongkan jika banner tidak bisa diklik.</p>
          {state.fieldErrors?.href ? (
            <p className="console-field__error">{state.fieldErrors.href}</p>
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
          {state.fieldErrors?.sortOrder ? (
            <p className="console-field__error">{state.fieldErrors.sortOrder}</p>
          ) : null}
        </div>

        <div className="console-field console-field--full">
          <label className="console-field__label console-field__label--inline">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={values.isActive}
              className="console-checkbox"
            />
            Aktif — tampil di slider beranda
          </label>
        </div>
      </div>

      <div className="console-form__actions">
        <button type="submit" disabled={isSaving} className="console-btn-primary console-form__submit">
          {isSaving ? "Menyimpan..." : mode === "create" ? "Buat Banner" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
