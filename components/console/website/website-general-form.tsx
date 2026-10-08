"use client";

import { useActionState } from "react";
import {
  saveWebsiteGeneral,
  type SiteSettingsFormState,
} from "@/app/console/(panel)/settings/website/actions";
import {
  ConsoleFormUploadProvider,
  useConsoleFormUploadSubmit,
} from "@/components/console/console-form-upload";
import { ConsoleImageUpload } from "@/components/console/console-image-upload";
import type { SiteGeneralSettings } from "@/lib/site-settings/site-settings-schemas";

type WebsiteGeneralFormProps = {
  initialValues: SiteGeneralSettings;
};

const initialState: SiteSettingsFormState = {};

export function WebsiteGeneralForm(props: WebsiteGeneralFormProps) {
  return (
    <ConsoleFormUploadProvider>
      <WebsiteGeneralFormContent {...props} />
    </ConsoleFormUploadProvider>
  );
}

function WebsiteGeneralFormContent({ initialValues }: WebsiteGeneralFormProps) {
  const [state, formAction, pending] = useActionState(saveWebsiteGeneral, initialState);
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
          <p className="console-provider-card__title">Identitas</p>
        </div>
        <div className="console-provider-card__body">
          <div className="console-form__grid">
            <div className="console-field console-field--full">
              <label htmlFor="siteName" className="console-field__label">
                Nama Website *
              </label>
              <input
                id="siteName"
                name="siteName"
                defaultValue={initialValues.siteName}
                required
                className="console-input w-full"
              />
              {state.fieldErrors?.siteName ? (
                <p className="console-field__error">{state.fieldErrors.siteName}</p>
              ) : null}
            </div>

            <div className="console-field console-field--full">
              <label htmlFor="siteUrl" className="console-field__label">
                URL Website
              </label>
              <input
                id="siteUrl"
                name="siteUrl"
                type="url"
                defaultValue={initialValues.siteUrl}
                className="console-input w-full"
                placeholder="https://domain-anda.com"
              />
              <p className="console-field__hint">
                URL publik situs (ngrok/domain). Dipakai webhook, OAuth Google, dan callback.
              </p>
              {state.fieldErrors?.siteUrl ? (
                <p className="console-field__error">{state.fieldErrors.siteUrl}</p>
              ) : null}
            </div>

            <ConsoleImageUpload
              name="logoHeaderUrl"
              kind="site-logo"
              label="Logo Header"
              initialValue={initialValues.logoHeaderUrl}
              error={state.fieldErrors?.logoHeaderUrl}
              hint="PNG/JPG/GIF/WebP · maks. 8 MB · format asli dipertahankan (tanpa konversi WebP)"
            />

            <ConsoleImageUpload
              name="logoFooterUrl"
              kind="site-logo"
              label="Logo Footer"
              initialValue={initialValues.logoFooterUrl}
              error={state.fieldErrors?.logoFooterUrl}
              hint="PNG/JPG/GIF/WebP · maks. 8 MB · format asli dipertahankan (tanpa konversi WebP)"
            />

            <ConsoleImageUpload
              name="faviconUrl"
              kind="site-favicon"
              label="Favicon"
              initialValue={initialValues.faviconUrl}
              error={state.fieldErrors?.faviconUrl}
            />
          </div>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Bantuan WhatsApp (Floating)</p>
          <p className="console-field__hint" style={{ margin: "0.35rem 0 0" }}>
            Nomor ini khusus tombol chat bantuan di etalase — terpisah dari link WhatsApp sosial
            media.
          </p>
        </div>
        <div className="console-provider-card__body">
          <div className="console-form__grid">
            <div className="console-field console-field--full">
              <label className="console-field__label console-field__label--inline">
                <input
                  type="checkbox"
                  name="supportWhatsappEnabled"
                  value="on"
                  defaultChecked={initialValues.supportWhatsappEnabled}
                  className="console-checkbox"
                />
                Tampilkan tombol floating WhatsApp
              </label>
            </div>

            <div className="console-field">
              <label htmlFor="supportWhatsappNumber" className="console-field__label">
                Nomor WhatsApp Bantuan
              </label>
              <input
                id="supportWhatsappNumber"
                name="supportWhatsappNumber"
                defaultValue={initialValues.supportWhatsappNumber}
                className="console-input w-full"
                placeholder="62812xxxxxxxx"
                inputMode="tel"
                autoComplete="tel"
              />
              <p className="console-field__hint">
                Format internasional tanpa +. Contoh: <code>62812xxxxxxxx</code> atau{" "}
                <code>0812xxxxxxxx</code>.
              </p>
              {state.fieldErrors?.supportWhatsappNumber ? (
                <p className="console-field__error">{state.fieldErrors.supportWhatsappNumber}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="supportWhatsappLabel" className="console-field__label">
                Label Tombol
              </label>
              <input
                id="supportWhatsappLabel"
                name="supportWhatsappLabel"
                defaultValue={initialValues.supportWhatsappLabel}
                className="console-input w-full"
                placeholder="Chat CS"
                maxLength={32}
              />
              {state.fieldErrors?.supportWhatsappLabel ? (
                <p className="console-field__error">{state.fieldErrors.supportWhatsappLabel}</p>
              ) : null}
            </div>

            <div className="console-field console-field--full">
              <label htmlFor="supportWhatsappMessage" className="console-field__label">
                Teks Pesan Awal
              </label>
              <textarea
                id="supportWhatsappMessage"
                name="supportWhatsappMessage"
                rows={3}
                defaultValue={initialValues.supportWhatsappMessage}
                className="console-input console-textarea w-full"
                placeholder="Halo R9host, saya butuh bantuan..."
                maxLength={500}
              />
              <p className="console-field__hint">
                Pesan ini otomatis terisi saat customer membuka chat WhatsApp.
              </p>
              {state.fieldErrors?.supportWhatsappMessage ? (
                <p className="console-field__error">{state.fieldErrors.supportWhatsappMessage}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Sosial Media</p>
        </div>
        <div className="console-provider-card__body">
          <div className="console-form__grid">
            {(
              [
                ["whatsappUrl", "WhatsApp"],
                ["instagramUrl", "Instagram"],
                ["tiktokUrl", "TikTok"],
                ["youtubeUrl", "YouTube"],
                ["facebookUrl", "Facebook"],
              ] as const
            ).map(([name, label]) => (
              <div key={name} className="console-field">
                <label htmlFor={name} className="console-field__label">
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type="url"
                  defaultValue={initialValues[name]}
                  className="console-input w-full"
                  placeholder="https://"
                />
                {state.fieldErrors?.[name] ? (
                  <p className="console-field__error">{state.fieldErrors[name]}</p>
                ) : null}
              </div>
            ))}

            <div className="console-field">
              <label htmlFor="email" className="console-field__label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={initialValues.email}
                className="console-input w-full"
                placeholder="cs@domain-anda.com"
                autoComplete="email"
              />
              {state.fieldErrors?.email ? (
                <p className="console-field__error">{state.fieldErrors.email}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Aplikasi Mobile</p>
          <p className="console-field__hint" style={{ margin: "0.35rem 0 0" }}>
            Link badge Play Store &amp; App Store di footer etalase.
          </p>
        </div>
        <div className="console-provider-card__body">
          <div className="console-form__grid">
            <div className="console-field">
              <label htmlFor="playStoreUrl" className="console-field__label">
                Google Play Store
              </label>
              <input
                id="playStoreUrl"
                name="playStoreUrl"
                type="url"
                defaultValue={initialValues.playStoreUrl}
                className="console-input w-full"
                placeholder="https://play.google.com/store/apps/details?id=..."
              />
              {state.fieldErrors?.playStoreUrl ? (
                <p className="console-field__error">{state.fieldErrors.playStoreUrl}</p>
              ) : null}
            </div>
            <div className="console-field">
              <label htmlFor="appStoreUrl" className="console-field__label">
                Apple App Store
              </label>
              <input
                id="appStoreUrl"
                name="appStoreUrl"
                type="url"
                defaultValue={initialValues.appStoreUrl}
                className="console-input w-full"
                placeholder="https://apps.apple.com/app/id..."
              />
              {state.fieldErrors?.appStoreUrl ? (
                <p className="console-field__error">{state.fieldErrors.appStoreUrl}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__body console-provider-card__body--actions">
          <button type="submit" disabled={isSaving} className="console-btn-primary">
            {isSaving ? "Menyimpan..." : "Simpan Umum"}
          </button>
        </div>
      </div>
    </form>
  );
}
