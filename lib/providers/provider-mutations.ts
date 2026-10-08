import {
  getProviderConfigSchema,
  type ProviderConfigField,
  type ProviderConfigSchema,
} from "@/lib/providers/provider-schemas";

export type ProviderConfigFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function asConfigRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function parseFieldValue(formData: FormData, field: ProviderConfigField): unknown {
  if (field.type === "checkbox") {
    return formData.get(field.key) === "on";
  }

  return String(formData.get(field.key) ?? "").trim();
}

export function parseProviderConfigForm(
  formData: FormData,
  schema: ProviderConfigSchema,
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

export function validateProviderConfig(
  schema: ProviderConfigSchema,
  config: Record<string, unknown>,
): ProviderConfigFormState | null {
  const fieldErrors: Record<string, string> = {};

  for (const field of schema.fields) {
    if (!field.required) continue;

    const value = config[field.key];
    if (field.type === "checkbox") continue;

    if (typeof value !== "string" || value.trim().length === 0) {
      fieldErrors[field.key] = `${field.label} wajib diisi.`;
      continue;
    }

    if (field.type === "url") {
      try {
        const parsed = new URL(value.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) {
          fieldErrors[field.key] = `${field.label} harus diawali http:// atau https://.`;
        }
      } catch {
        fieldErrors[field.key] = `${field.label} harus URL valid.`;
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return null;
}

export function parseProviderSettingsForm(formData: FormData) {
  return {
    sandboxMode: formData.get("sandboxMode") === "on",
  };
}

export function mergeProviderConfig(
  existing: unknown,
  parsedConfig: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...asConfigRecord(existing),
    ...parsedConfig,
  };
}

export function getProviderConfigSchemaOrThrow(slug: string) {
  const schema = getProviderConfigSchema(slug);
  if (!schema) {
    throw new Error(`Skema konfigurasi provider '${slug}' tidak ditemukan.`);
  }
  return schema;
}
