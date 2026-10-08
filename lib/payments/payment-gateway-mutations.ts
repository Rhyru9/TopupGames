import {
  getPaymentGatewayConfigSchema,
  type PaymentGatewayConfigField,
  type PaymentGatewayConfigSchema,
} from "@/lib/payments/payment-gateway-schemas";

export type PaymentGatewayConfigFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function asConfigRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function parseFieldValue(formData: FormData, field: PaymentGatewayConfigField): unknown {
  if (field.type === "checkbox") {
    return formData.get(field.key) === "on";
  }
  return String(formData.get(field.key) ?? "").trim();
}

export function parsePaymentGatewayConfigForm(
  formData: FormData,
  schema: PaymentGatewayConfigSchema,
  existingConfig: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...existingConfig };

  for (const field of schema.fields) {
    const value = parseFieldValue(formData, field);

    if (field.type === "checkbox") {
      merged[field.key] = value;
      continue;
    }

    if (field.secret && value === "") {
      continue;
    }

    if (value !== "") {
      merged[field.key] = value;
    }
  }

  return merged;
}

export function validatePaymentGatewayConfig(
  schema: PaymentGatewayConfigSchema,
  config: Record<string, unknown>,
): PaymentGatewayConfigFormState | null {
  const fieldErrors: Record<string, string> = {};

  for (const field of schema.fields) {
    if (!field.required) continue;
    if (field.type === "checkbox") continue;

    const value = config[field.key];
    if (typeof value !== "string" || value.trim().length === 0) {
      fieldErrors[field.key] = `${field.label} wajib diisi.`;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return null;
}

export function parsePaymentGatewaySettingsForm(formData: FormData) {
  return {
    sandboxMode: formData.get("sandboxMode") === "on",
  };
}

export function mergePaymentGatewayConfig(
  existing: unknown,
  parsedConfig: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...asConfigRecord(existing),
    ...parsedConfig,
  };
}

export function getPaymentGatewayConfigSchemaOrThrow(slug: string) {
  const schema = getPaymentGatewayConfigSchema(slug);
  if (!schema) {
    throw new Error(`Skema konfigurasi payment gateway '${slug}' tidak ditemukan.`);
  }
  return schema;
}
