"use client";

import { useActionState } from "react";
import {
  saveWebsitePwa,
  type SiteSettingsFormState,
} from "@/app/console/(panel)/settings/website/actions";
import {
  ConsoleFormUploadProvider,
  useConsoleFormUploadSubmit,
} from "@/components/console/console-form-upload";
import { ConsoleImageUpload } from "@/components/console/console-image-upload";
import type { SitePwaSettings } from "@/lib/site-settings/site-settings-schemas";

type WebsitePwaFormProps = {
  initialValues: SitePwaSettings;
};

const initialState: SiteSettingsFormState = {};

export function WebsitePwaForm(props: WebsitePwaFormProps) {
  return (
    <ConsoleFormUploadProvider>
      <WebsitePwaFormContent {...props} />
    </ConsoleFormUploadProvider>
  );
}

function WebsitePwaFormContent({ initialValues }: WebsitePwaFormProps) {
  const [state, formAction, pending] = useActionState(saveWebsitePwa, initialState);
  const { onSubmit, isUploading, uploadError } = useConsoleFormUploadSubmit(formAction);
  const isSaving = pending || isUploading;

  return (
    <form action={formAction} onSubmit={onSubmit} className="console-form console-provider-form-stack">
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
          <p className="console-provider-card__title">Progressive Web App</p>
        </div>
        <div className="console-provider-card__body">
          <div className="console-form__grid">
            <div className="console-field console-field--full">
              <label className="console-field__label console-field__label--inline">
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={initialValues.enabled}
                  className="console-checkbox"
                />
                Aktifkan PWA — daftar service worker & tampilkan tombol install
              </label>
            </div>

            <div className="console-field">
              <label htmlFor="pwaName" className="console-field__label">
                Nama aplikasi
              </label>
              <input
                id="pwaName"
                name="name"
                defaultValue={initialValues.name}
                className="console-input w-full"
                placeholder="R9host"
              />
              <p className="console-field__hint">Kosongkan untuk memakai nama website.</p>
              {state.fieldErrors?.name ? (
                <p className="console-field__error">{state.fieldErrors.name}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="pwaShortName" className="console-field__label">
                Short name
              </label>
              <input
                id="pwaShortName"
                name="shortName"
                defaultValue={initialValues.shortName}
                maxLength={12}
                className="console-input w-full"
                placeholder="R9host"
              />
              <p className="console-field__hint">Maks. 12 karakter — muncul di home screen.</p>
              {state.fieldErrors?.shortName ? (
                <p className="console-field__error">{state.fieldErrors.shortName}</p>
              ) : null}
            </div>

            <div className="console-field console-field--full">
              <label htmlFor="pwaDescription" className="console-field__label">
                Deskripsi
              </label>
              <textarea
                id="pwaDescription"
                name="description"
                defaultValue={initialValues.description}
                rows={3}
                className="console-input w-full"
              />
              <p className="console-field__hint">Kosongkan untuk memakai deskripsi SEO.</p>
              {state.fieldErrors?.description ? (
                <p className="console-field__error">{state.fieldErrors.description}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="themeColor" className="console-field__label">
                Theme color
              </label>
              <input
                id="themeColor"
                name="themeColor"
                type="color"
                defaultValue={initialValues.themeColor}
                className="h-10 w-20 cursor-pointer rounded border border-[var(--console-border,#2a2a2a)] bg-transparent p-1"
              />
              <p className="console-field__hint">Warna bilah status / chrome browser.</p>
              {state.fieldErrors?.themeColor ? (
                <p className="console-field__error">{state.fieldErrors.themeColor}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="backgroundColor" className="console-field__label">
                Background color
              </label>
              <input
                id="backgroundColor"
                name="backgroundColor"
                type="color"
                defaultValue={initialValues.backgroundColor}
                className="h-10 w-20 cursor-pointer rounded border border-[var(--console-border,#2a2a2a)] bg-transparent p-1"
              />
              <p className="console-field__hint">Warna splash saat aplikasi dibuka.</p>
              {state.fieldErrors?.backgroundColor ? (
                <p className="console-field__error">{state.fieldErrors.backgroundColor}</p>
              ) : null}
            </div>

            <ConsoleImageUpload
              name="iconUrl"
              kind="site-pwa-icon"
              label="Icon PWA (512×512)"
              initialValue={initialValues.iconUrl}
              hint="PNG/JPG/WebP kotak · maks. 8 MB. Fallback: favicon atau logo header."
              error={state.fieldErrors?.iconUrl}
            />
          </div>
        </div>
      </div>

      <div className="console-form__actions">
        <button type="submit" disabled={isSaving} className="console-btn-primary console-form__submit">
          {isSaving ? "Menyimpan..." : "Simpan PWA"}
        </button>
      </div>
    </form>
  );
}
