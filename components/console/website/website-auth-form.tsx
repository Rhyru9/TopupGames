"use client";

import { useActionState, useState } from "react";
import {
  saveWebsiteAuth,
  type SiteSettingsFormState,
} from "@/app/console/(panel)/settings/website/actions";
import type { SiteAuthSettings } from "@/lib/site-settings/site-settings-schemas";

type WebsiteAuthFormProps = {
  initialValues: SiteAuthSettings;
  callbackUrlHint: string;
};

const initialState: SiteSettingsFormState = {};

export function WebsiteAuthForm({ initialValues, callbackUrlHint }: WebsiteAuthFormProps) {
  const [state, formAction, pending] = useActionState(saveWebsiteAuth, initialState);
  const [copied, setCopied] = useState(false);

  async function copyCallbackUrl() {
    try {
      await navigator.clipboard.writeText(callbackUrlHint);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore clipboard errors */
    }
  }

  return (
    <form action={formAction} className="console-form console-provider-form-stack">
      {state.error ? (
        <div className="console-alert console-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Login Google</p>
        </div>
        <div className="console-provider-card__body">
          <div className="console-form__grid">
            <div className="console-field console-field--full">
              <label className="console-field__label console-field__label--inline">
                <input
                  type="checkbox"
                  name="googleEnabled"
                  defaultChecked={initialValues.googleEnabled}
                  className="console-checkbox"
                />
                Aktifkan login dengan Google
              </label>
            </div>

            <div className="console-field console-field--full">
              <label htmlFor="googleClientId" className="console-field__label">
                Google Client ID
              </label>
              <input
                id="googleClientId"
                name="googleClientId"
                defaultValue={initialValues.googleClientId}
                className="console-input w-full"
                placeholder="xxxxx.apps.googleusercontent.com"
                autoComplete="off"
              />
              {state.fieldErrors?.googleClientId ? (
                <p className="console-field__error">{state.fieldErrors.googleClientId}</p>
              ) : null}
            </div>

            <div className="console-field console-field--full">
              <label htmlFor="googleClientSecret" className="console-field__label">
                Google Client Secret
              </label>
              <input
                id="googleClientSecret"
                name="googleClientSecret"
                type="password"
                defaultValue={initialValues.googleClientSecret}
                className="console-input w-full"
                placeholder="GOCSPX-..."
                autoComplete="new-password"
              />
              <p className="console-field__hint">
                Biarkan bertanda •••••••• untuk mempertahankan secret yang sudah tersimpan.
              </p>
              {state.fieldErrors?.googleClientSecret ? (
                <p className="console-field__error">{state.fieldErrors.googleClientSecret}</p>
              ) : null}
            </div>

            <div className="console-field console-field--full">
              <p className="console-field__label">Authorized redirect URI</p>
              <p className="console-field__hint">
                Salin URL ini ke Google Cloud Console → Credentials → OAuth Client →{" "}
                <strong>Authorized redirect URIs</strong>. Harus sama persis (termasuk https & path).
                Error <code>redirect_uri_mismatch</code> artinya URI di Google belum cocok.
              </p>
              <div className="console-copy-field">
                <input
                  type="text"
                  readOnly
                  value={callbackUrlHint}
                  className="console-input console-copy-field__input w-full"
                  aria-label="Callback URL Google"
                />
                <button
                  type="button"
                  className="console-btn-secondary console-copy-field__btn"
                  onClick={() => void copyCallbackUrl()}
                >
                  {copied ? "Tersalin" : "Salin"}
                </button>
              </div>
              <p className="console-field__hint">
                Path wajib: <code>/api/member-auth/callback/google</code> — bukan{" "}
                <code>/api/auth/callback/google</code>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="console-form__actions">
        <button type="submit" className="console-btn-primary" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}
