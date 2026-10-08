"use client";

import { useActionState } from "react";
import {
  saveWebsiteStorage,
  type SiteSettingsFormState,
} from "@/app/console/(panel)/settings/website/actions";
import { ConsoleSecretInput } from "@/components/console/console-secret-input";
import type { SiteStorageSettings } from "@/lib/site-settings/site-settings-schemas";

type WebsiteStorageFormProps = {
  initialValues: SiteStorageSettings;
};

const initialState: SiteSettingsFormState = {};

export function WebsiteStorageForm({ initialValues }: WebsiteStorageFormProps) {
  const [state, formAction, pending] = useActionState(saveWebsiteStorage, initialState);

  return (
    <form action={formAction} className="console-form console-provider-form-stack">
      {state.error ? (
        <div className="console-alert console-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Backend Upload</p>
        </div>
        <div className="console-provider-card__body">
          <p className="console-field__hint console-field--full">
            Driver aktif hanya memengaruhi upload baru. Gambar lama tetap bisa dibaca dari lokasi
            asalnya. Saat gambar diganti, file lama dihapus otomatis.
          </p>

          <div className="console-form__grid">
            <div className="console-field console-field--full">
              <span className="console-field__label">Driver Penyimpanan</span>
              <div className="console-radio-group">
                <label className="console-field__label console-field__label--inline">
                  <input
                    type="radio"
                    name="driver"
                    value="local"
                    defaultChecked={initialValues.driver === "local"}
                    className="console-radio"
                  />
                  Local Server
                </label>
                <label className="console-field__label console-field__label--inline">
                  <input
                    type="radio"
                    name="driver"
                    value="cloudflare_r2"
                    defaultChecked={initialValues.driver === "cloudflare_r2"}
                    className="console-radio"
                  />
                  Cloudflare R2
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Local Server</p>
        </div>
        <div className="console-provider-card__body">
          <div className="console-form__grid">
            <div className="console-field console-field--full">
              <label htmlFor="localUploadDir" className="console-field__label">
                Folder Upload
              </label>
              <input
                id="localUploadDir"
                name="localUploadDir"
                defaultValue={initialValues.local.uploadDir}
                className="console-input w-full"
                placeholder="storage/uploads atau /var/data/r9host-topup/uploads"
              />
              <p className="console-field__hint">Kosongkan untuk fallback env UPLOAD_DIR.</p>
            </div>

            <div className="console-field console-field--full">
              <label htmlFor="localPublicUrlPrefix" className="console-field__label">
                Prefix URL Publik
              </label>
              <input
                id="localPublicUrlPrefix"
                name="localPublicUrlPrefix"
                defaultValue={initialValues.local.publicUrlPrefix}
                className="console-input w-full"
                placeholder="/uploads"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Cloudflare R2</p>
        </div>
        <div className="console-provider-card__body">
          <div className="console-form__grid">
            <div className="console-field">
              <label htmlFor="r2AccountId" className="console-field__label">
                Account ID *
              </label>
              <input
                id="r2AccountId"
                name="r2AccountId"
                defaultValue={initialValues.cloudflareR2.accountId}
                className="console-input w-full"
              />
              {state.fieldErrors?.r2AccountId ? (
                <p className="console-field__error">{state.fieldErrors.r2AccountId}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="r2Bucket" className="console-field__label">
                Bucket *
              </label>
              <input
                id="r2Bucket"
                name="r2Bucket"
                defaultValue={initialValues.cloudflareR2.bucket}
                className="console-input w-full"
              />
              {state.fieldErrors?.r2Bucket ? (
                <p className="console-field__error">{state.fieldErrors.r2Bucket}</p>
              ) : null}
            </div>

            <div className="console-field console-field--full">
              <label htmlFor="r2PublicBaseUrl" className="console-field__label">
                Public URL *
              </label>
              <input
                id="r2PublicBaseUrl"
                name="r2PublicBaseUrl"
                type="url"
                defaultValue={initialValues.cloudflareR2.publicBaseUrl}
                className="console-input w-full"
                placeholder="https://cdn.domain-anda.com"
              />
              {state.fieldErrors?.r2PublicBaseUrl ? (
                <p className="console-field__error">{state.fieldErrors.r2PublicBaseUrl}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="r2AccessKeyId" className="console-field__label">
                Access Key ID *
              </label>
              <input
                id="r2AccessKeyId"
                name="r2AccessKeyId"
                defaultValue={initialValues.cloudflareR2.accessKeyId}
                className="console-input w-full"
              />
              {state.fieldErrors?.r2AccessKeyId ? (
                <p className="console-field__error">{state.fieldErrors.r2AccessKeyId}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="r2SecretAccessKey" className="console-field__label">
                Secret Access Key *
              </label>
              <ConsoleSecretInput
                id="r2SecretAccessKey"
                name="r2SecretAccessKey"
                defaultValue={initialValues.cloudflareR2.secretAccessKey}
              />
              {state.fieldErrors?.r2SecretAccessKey ? (
                <p className="console-field__error">{state.fieldErrors.r2SecretAccessKey}</p>
              ) : null}
            </div>

            <div className="console-field console-field--full">
              <label htmlFor="r2Endpoint" className="console-field__label">
                Endpoint (opsional)
              </label>
              <input
                id="r2Endpoint"
                name="r2Endpoint"
                type="url"
                defaultValue={initialValues.cloudflareR2.endpoint}
                className="console-input w-full"
                placeholder="https://{accountId}.r2.cloudflarestorage.com"
              />
              {state.fieldErrors?.r2Endpoint ? (
                <p className="console-field__error">{state.fieldErrors.r2Endpoint}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__body console-provider-card__body--actions">
          <button type="submit" disabled={pending} className="console-btn-primary">
            {pending ? "Menyimpan..." : "Simpan Penyimpanan"}
          </button>
        </div>
      </div>
    </form>
  );
}
