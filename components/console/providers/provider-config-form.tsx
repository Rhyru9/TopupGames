"use client";

import { useActionState } from "react";
import {
  saveProviderConfig,
  type ProviderConfigFormState,
} from "@/app/console/(panel)/settings/providers/actions";
import { ConsoleSecretInput } from "@/components/console/console-secret-input";
import { ProviderWebhookUrlField } from "@/components/console/providers/provider-webhook-url-field";
import { ProviderOutboundIpPanel } from "@/components/console/providers/provider-outbound-ip-panel";
import { getProviderFieldDefaultValue, type ProviderConfigSchema } from "@/lib/providers/provider-schemas";
import { getProviderIpWhitelistGuide } from "@/lib/providers/provider-ip-whitelist";
import {
  getProviderWebhookHint,
  getProviderWebhookLabel,
} from "@/lib/providers/provider-webhook-meta";

type ProviderConfigFormProps = {
  providerId: string;
  providerSlug: string;
  schema: ProviderConfigSchema;
  sandboxMode: boolean;
  initialConfig: Record<string, unknown>;
  rawConfig: Record<string, unknown>;
  webhookUrl?: string | null;
};

const initialState: ProviderConfigFormState = {};

export function ProviderConfigForm({
  providerId,
  providerSlug,
  schema,
  sandboxMode,
  initialConfig,
  rawConfig,
  webhookUrl,
}: ProviderConfigFormProps) {
  const [state, formAction, pending] = useActionState(saveProviderConfig, initialState);
  const ipWhitelistGuide = getProviderIpWhitelistGuide(providerSlug);

  return (
    <form action={formAction} className="console-provider-form-stack">
      <input type="hidden" name="providerId" value={providerId} />

      {state.error ? (
        <div className="console-alert console-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}

      {schema.credentialSummary.length > 0 ? (
        <div className="console-provider-card">
          <div className="console-provider-card__head">
            <p className="console-provider-card__title">Panduan Kredensial</p>
          </div>
          <div className="console-provider-card__body">
            <ul className="console-provider-creds">
              {schema.credentialSummary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {ipWhitelistGuide ? (
        <ProviderOutboundIpPanel
          providerSlug={providerSlug}
          sandboxMode={sandboxMode}
          guide={ipWhitelistGuide}
        />
      ) : null}

      {schema.fields.length > 0 ? (
        <div className="console-provider-card">
          <div className="console-provider-card__head">
            <p className="console-provider-card__title">Kredensial API</p>
          </div>
          <div className="console-provider-card__body">
            <div className="console-form__grid">
              {schema.fields.map((field) => {
                const storedValue = initialConfig[field.key];
                const rawValue = rawConfig[field.key];
                const rawString = typeof rawValue === "string" ? rawValue : "";
                const storedString = typeof storedValue === "string" ? storedValue : "";
                const defaultValue =
                  field.type === "checkbox"
                    ? Boolean(storedValue)
                    : field.secret
                      ? rawString
                      : rawString || storedString || getProviderFieldDefaultValue(providerSlug, field.key);

                return (
                  <div
                    key={field.key}
                    className={`console-field ${field.type === "checkbox" || field.fullWidth ? "console-field--full" : ""}`}
                  >
                    {field.type === "checkbox" ? (
                      <label className="console-field__label console-field__label--inline">
                        <input
                          type="checkbox"
                          name={field.key}
                          defaultChecked={defaultValue as boolean}
                          className="console-checkbox"
                        />
                        {field.label}
                      </label>
                    ) : (
                      <>
                        <label htmlFor={`${providerId}-${field.key}`} className="console-field__label">
                          {field.label}
                          {field.required ? " *" : ""}
                        </label>
                        {field.secret || field.type === "password" ? (
                          <ConsoleSecretInput
                            id={`${providerId}-${field.key}`}
                            name={field.key}
                            defaultValue={defaultValue as string}
                            required={field.required && !(field.secret && storedValue === "__SET__")}
                            placeholder={field.placeholder}
                          />
                        ) : (
                          <input
                            id={`${providerId}-${field.key}`}
                            name={field.key}
                            type={field.type === "url" ? "url" : "text"}
                            defaultValue={defaultValue as string}
                            required={field.required}
                            className="console-input w-full"
                            placeholder={field.placeholder}
                            autoComplete="off"
                          />
                        )}
                      </>
                    )}
                    {field.hint ? <p className="console-field__hint">{field.hint}</p> : null}
                    {state.fieldErrors?.[field.key] ? (
                      <p className="console-field__error">{state.fieldErrors[field.key]}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {webhookUrl ? (
              <ProviderWebhookUrlField
                url={webhookUrl}
                label={getProviderWebhookLabel(providerSlug)}
                hint={getProviderWebhookHint(providerSlug)}
              />
            ) : null}
          </div>
        </div>
      ) : (
        <div className="console-provider-card">
          <div className="console-provider-card__head">
            <p className="console-provider-card__title">Kredensial API</p>
          </div>
          <div className="console-provider-card__body">
            <div className="console-alert" role="status">
              Provider manual tidak memerlukan kredensial API. Aktifkan atau nonaktifkan provider dari toggle di card Informasi Provider.
            </div>
          </div>
        </div>
      )}

      {providerSlug !== "manual" ? (
        <div className="console-provider-card">
          <div className="console-provider-card__head">
            <p className="console-provider-card__title">Mode Pengujian</p>
          </div>
          <div className="console-provider-card__body">
            <label className="console-field__label console-field__label--inline">
              <input
                type="checkbox"
                name="sandboxMode"
                defaultChecked={sandboxMode}
                className="console-checkbox"
              />
              Mode sandbox / testing
            </label>
            <p className="console-field__hint">
              {schema.sandboxHint ??
                "Digiflazz: kirim flag testing. IAK: ganti URL ke prepaid.iak.dev."}
            </p>
          </div>
        </div>
      ) : null}

      {schema.fields.length > 0 ? (
        <div className="console-provider-card">
          <div className="console-provider-card__body console-provider-card__body--actions">
            <button type="submit" disabled={pending} className="console-btn-primary console-form__submit">
              {pending ? "Menyimpan..." : "Simpan Konfigurasi"}
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
