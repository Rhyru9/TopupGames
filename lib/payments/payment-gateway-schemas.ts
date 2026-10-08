export type PaymentGatewayConfigFieldType = "text" | "password" | "url" | "checkbox";

export type PaymentGatewayConfigField = {
  key: string;
  label: string;
  type: PaymentGatewayConfigFieldType;
  required?: boolean;
  secret?: boolean;
  fullWidth?: boolean;
  hint?: string;
  placeholder?: string;
};

export type PaymentGatewayConfigSchema = {
  slug: string;
  credentialSummary: string[];
  sandboxHint?: string;
  webhookPath?: string;
  fields: PaymentGatewayConfigField[];
};

export const paymentGatewayApiBases: Record<string, { production: string; sandbox: string }> = {
  doku: {
    production: "https://api.doku.com",
    sandbox: "https://api-sandbox.doku.com",
  },
};

export const paymentGatewayConfigSchemas: Record<string, PaymentGatewayConfigSchema> = {
  doku: {
    slug: "doku",
    webhookPath: "/api/doku/notification",
    sandboxHint:
      "Sandbox memakai https://api-sandbox.doku.com. Matikan sandbox untuk production (https://api.doku.com).",
    credentialSummary: [
      "Client ID dari DOKU Back Office → API integration",
      "Secret Key untuk signature HMAC-SHA256 (header Signature)",
      "Daftarkan Notification URL di bawah ke DOKU Back Office",
      "Checkout: pelanggan pilih metode di situs ini, lalu lanjut ke halaman bayar DOKU",
    ],
    fields: [
      {
        key: "clientId",
        label: "Client ID",
        type: "text",
        required: true,
        placeholder: "MCH-0001-...",
        hint: "Client ID merchant DOKU (header Client-Id).",
      },
      {
        key: "secretKey",
        label: "Secret Key",
        type: "password",
        required: true,
        secret: true,
        hint: "HMAC-SHA256 untuk create checkout dan verifikasi notifikasi.",
      },
    ],
  },
};

export function getPaymentGatewayConfigSchema(slug: string): PaymentGatewayConfigSchema | null {
  return paymentGatewayConfigSchemas[slug] ?? null;
}

export function isPaymentGatewayConfigured(
  slug: string,
  config: Record<string, unknown> | null | undefined,
): boolean {
  const schema = getPaymentGatewayConfigSchema(slug);
  if (!schema) return false;
  if (schema.fields.length === 0) return true;

  const values = config ?? {};
  return schema.fields
    .filter((field) => field.required)
    .every((field) => {
      const value = values[field.key];
      if (field.type === "checkbox") return typeof value === "boolean";
      return typeof value === "string" && value.trim().length > 0;
    });
}

export function maskPaymentGatewayConfig(
  config: Record<string, unknown> | null | undefined,
  schema: PaymentGatewayConfigSchema,
): Record<string, unknown> {
  const values = config ?? {};
  const masked: Record<string, unknown> = {};

  for (const field of schema.fields) {
    const value = values[field.key];
    if (field.type === "checkbox") {
      masked[field.key] = Boolean(value);
      continue;
    }

    if (field.secret) {
      masked[field.key] = typeof value === "string" && value.length > 0 ? "__SET__" : "";
      continue;
    }

    masked[field.key] = typeof value === "string" ? value : "";
  }

  return masked;
}

export function resolvePaymentGatewayApiBase(slug: string, sandboxMode: boolean): string {
  const bases = paymentGatewayApiBases[slug];
  if (!bases) return "";
  return sandboxMode ? bases.sandbox : bases.production;
}
