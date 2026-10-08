"use client";

import { useActionState } from "react";
import {
  savePaymentGatewayConfig,
  type PaymentGatewayConfigFormState,
} from "@/app/console/(panel)/settings/payment/actions";
import { ConsoleSecretInput } from "@/components/console/console-secret-input";
import { ProviderWebhookUrlField } from "@/components/console/providers/provider-webhook-url-field";
import type { PaymentGatewayConfigSchema } from "@/lib/payments/payment-gateway-schemas";

type PaymentGatewayConfigFormProps = {
  gatewayId: string;
  gatewaySlug: string;
  schema: PaymentGatewayConfigSchema;
  sandboxMode: boolean;
  initialConfig: Record<string, unknown>;
  rawConfig: Record<string, unknown>;
  webhookUrl?: string | null;
};

const initialState: PaymentGatewayConfigFormState = {};

export function PaymentGatewayConfigForm({
  gatewayId,
  gatewaySlug,
  schema,
  sandboxMode,
  initialConfig,
  rawConfig,
  webhookUrl,
}: PaymentGatewayConfigFormProps) {
  const [state, formAction, pending] = useActionState(savePaymentGatewayConfig, initialState);

  return (
    <form action={formAction} className="console-provider-form-stack">
      <input type="hidden" name="gatewayId" value={gatewayId} />

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
                    : rawString || storedString;

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
                      <label htmlFor={`${gatewayId}-${field.key}`} className="console-field__label">
                        {field.label}
                        {field.required ? " *" : ""}
                      </label>
                      {field.secret || field.type === "password" ? (
                        <ConsoleSecretInput
                          id={`${gatewayId}-${field.key}`}
                          name={field.key}
                          defaultValue={defaultValue as string}
                          required={field.required && !(field.secret && storedValue === "__SET__")}
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <input
                          id={`${gatewayId}-${field.key}`}
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
              label="URL Callback"
              hint="Daftarkan URL ini di DOKU Back Office sebagai Notification URL."
            />
          ) : null}
        </div>
      </div>

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
            {schema.sandboxHint ?? `Mode sandbox untuk ${gatewaySlug}.`}
          </p>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__body console-provider-card__body--actions">
          <button type="submit" disabled={pending} className="console-btn-primary console-form__submit">
            {pending ? "Menyimpan..." : "Simpan Konfigurasi"}
          </button>
        </div>
      </div>
    </form>
  );
}
