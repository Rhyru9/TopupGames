"use client";

import { useActionState } from "react";
import {
  saveWebsiteSeo,
  type SiteSettingsFormState,
} from "@/app/console/(panel)/settings/website/actions";
import {
  ConsoleFormUploadProvider,
  useConsoleFormUploadSubmit,
} from "@/components/console/console-form-upload";
import { ConsoleImageUpload } from "@/components/console/console-image-upload";
import type { SiteSeoSettings } from "@/lib/site-settings/site-settings-schemas";

type WebsiteSeoFormProps = {
  initialValues: SiteSeoSettings;
};

const initialState: SiteSettingsFormState = {};

export function WebsiteSeoForm(props: WebsiteSeoFormProps) {
  return (
    <ConsoleFormUploadProvider>
      <WebsiteSeoFormContent {...props} />
    </ConsoleFormUploadProvider>
  );
}

function WebsiteSeoFormContent({ initialValues }: WebsiteSeoFormProps) {
  const [state, formAction, pending] = useActionState(saveWebsiteSeo, initialState);
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
          <p className="console-provider-card__title">Meta Tag</p>
        </div>
        <div className="console-provider-card__body">
          <div className="console-form__grid">
            <div className="console-field console-field--full">
              <label htmlFor="metaTitle" className="console-field__label">
                Judul Meta *
              </label>
              <input
                id="metaTitle"
                name="metaTitle"
                defaultValue={initialValues.metaTitle}
                required
                className="console-input w-full"
              />
              {state.fieldErrors?.metaTitle ? (
                <p className="console-field__error">{state.fieldErrors.metaTitle}</p>
              ) : null}
            </div>

            <div className="console-field console-field--full">
              <label htmlFor="metaKeywords" className="console-field__label">
                Keywords
              </label>
              <textarea
                id="metaKeywords"
                name="metaKeywords"
                rows={3}
                defaultValue={initialValues.metaKeywords}
                className="console-input console-textarea w-full"
              />
            </div>

            <div className="console-field console-field--full">
              <label htmlFor="metaDescription" className="console-field__label">
                Deskripsi Meta *
              </label>
              <textarea
                id="metaDescription"
                name="metaDescription"
                rows={4}
                defaultValue={initialValues.metaDescription}
                required
                className="console-input console-textarea w-full"
              />
              {state.fieldErrors?.metaDescription ? (
                <p className="console-field__error">{state.fieldErrors.metaDescription}</p>
              ) : null}
            </div>

            <ConsoleImageUpload
              name="ogImageUrl"
              kind="site-og-image"
              label="Gambar Open Graph"
              initialValue={initialValues.ogImageUrl}
              hint="Saran 1200×630 px. Disimpan JPEG agar preview WhatsApp/Facebook jalan. Upload ulang jika sebelumnya WebP."
              error={state.fieldErrors?.ogImageUrl}
            />
          </div>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Google Analytics & Tag Manager</p>
          <p className="console-field__hint" style={{ margin: "0.35rem 0 0" }}>
            Opsional. Script hanya dimuat di toko (bukan console). Jika sudah pakai GTM, biasanya
            cukup isi GTM saja — GA dikonfigurasi dari dalam Tag Manager.
          </p>
        </div>
        <div className="console-provider-card__body">
          <div className="console-form__grid">
            <div className="console-field">
              <label htmlFor="googleAnalyticsId" className="console-field__label">
                Google Analytics (GA4)
              </label>
              <input
                id="googleAnalyticsId"
                name="googleAnalyticsId"
                defaultValue={initialValues.googleAnalyticsId}
                placeholder="G-XXXXXXXXXX"
                className="console-input w-full"
                autoComplete="off"
                spellCheck={false}
              />
              <p className="console-field__hint">
                Measurement ID dari GA4 (Admin → Data streams).
              </p>
              {state.fieldErrors?.googleAnalyticsId ? (
                <p className="console-field__error">{state.fieldErrors.googleAnalyticsId}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="googleTagManagerId" className="console-field__label">
                Google Tag Manager
              </label>
              <input
                id="googleTagManagerId"
                name="googleTagManagerId"
                defaultValue={initialValues.googleTagManagerId}
                placeholder="GTM-XXXXXXX"
                className="console-input w-full"
                autoComplete="off"
                spellCheck={false}
              />
              <p className="console-field__hint">
                Container ID dari Tag Manager (Admin → Container).
              </p>
              {state.fieldErrors?.googleTagManagerId ? (
                <p className="console-field__error">{state.fieldErrors.googleTagManagerId}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Verifikasi Webmaster</p>
          <p className="console-field__hint" style={{ margin: "0.35rem 0 0" }}>
            Isi kode verifikasi dari Search Console / Webmaster Tools. Hanya token meta, bukan
            seluruh tag HTML.
          </p>
        </div>
        <div className="console-provider-card__body">
          <div className="console-form__grid">
            <div className="console-field console-field--full">
              <label htmlFor="googleSiteVerification" className="console-field__label">
                Google Search Console
              </label>
              <input
                id="googleSiteVerification"
                name="googleSiteVerification"
                defaultValue={initialValues.googleSiteVerification}
                placeholder="contoh: AbCdEf123..."
                className="console-input w-full"
                autoComplete="off"
              />
              <p className="console-field__hint">
                Meta <code>google-site-verification</code>
              </p>
              {state.fieldErrors?.googleSiteVerification ? (
                <p className="console-field__error">{state.fieldErrors.googleSiteVerification}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="bingSiteVerification" className="console-field__label">
                Bing Webmaster
              </label>
              <input
                id="bingSiteVerification"
                name="bingSiteVerification"
                defaultValue={initialValues.bingSiteVerification}
                placeholder="Kode msvalidate.01"
                className="console-input w-full"
                autoComplete="off"
              />
              <p className="console-field__hint">
                Meta <code>msvalidate.01</code>
              </p>
              {state.fieldErrors?.bingSiteVerification ? (
                <p className="console-field__error">{state.fieldErrors.bingSiteVerification}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="yandexVerification" className="console-field__label">
                Yandex Webmaster
              </label>
              <input
                id="yandexVerification"
                name="yandexVerification"
                defaultValue={initialValues.yandexVerification}
                placeholder="Kode yandex-verification"
                className="console-input w-full"
                autoComplete="off"
              />
              <p className="console-field__hint">
                Meta <code>yandex-verification</code>
              </p>
              {state.fieldErrors?.yandexVerification ? (
                <p className="console-field__error">{state.fieldErrors.yandexVerification}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="pinterestVerification" className="console-field__label">
                Pinterest
              </label>
              <input
                id="pinterestVerification"
                name="pinterestVerification"
                defaultValue={initialValues.pinterestVerification}
                placeholder="Kode p:domain_verify"
                className="console-input w-full"
                autoComplete="off"
              />
              <p className="console-field__hint">
                Meta <code>p:domain_verify</code>
              </p>
              {state.fieldErrors?.pinterestVerification ? (
                <p className="console-field__error">{state.fieldErrors.pinterestVerification}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="facebookDomainVerification" className="console-field__label">
                Facebook Domain
              </label>
              <input
                id="facebookDomainVerification"
                name="facebookDomainVerification"
                defaultValue={initialValues.facebookDomainVerification}
                placeholder="Kode facebook-domain-verification"
                className="console-input w-full"
                autoComplete="off"
              />
              <p className="console-field__hint">
                Meta <code>facebook-domain-verification</code>
              </p>
              {state.fieldErrors?.facebookDomainVerification ? (
                <p className="console-field__error">{state.fieldErrors.facebookDomainVerification}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__body console-provider-card__body--actions">
          <button type="submit" disabled={isSaving} className="console-btn-primary">
            {isSaving ? "Menyimpan..." : "Simpan SEO"}
          </button>
        </div>
      </div>
    </form>
  );
}
