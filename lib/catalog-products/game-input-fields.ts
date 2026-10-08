export type GameInputFieldType = "text" | "select";

export type GameInputFieldOption = {
  label: string;
  value: string;
};

export type GameInputField = {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  /** Default text — select untuk dropdown server/region. */
  type?: GameInputFieldType;
  options?: GameInputFieldOption[];
};

export type GameInputFieldsConfig = {
  fields: GameInputField[];
  /**
   * Template nomor tujuan provider (Digiflazz `customer_no`, dll).
   * Placeholder: {userId}, {zone}, {server}, atau key custom.
   * Contoh: `{userId}|{server}`
   */
  targetFormat?: string;
};

export type MelostoreTargetPayload = {
  customer_target: string;
  customer_target_zone?: string;
  additional_data?: Record<string, string>;
};

const RESERVED_KEYS = new Set(["userId", "zone", "server"]);
const CUSTOM_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;
const TARGET_FORMAT_TOKEN = /\{([a-zA-Z][a-zA-Z0-9_]*)\}/g;

/** Opsi server/region umum (Asia, America, Europe, TW/HK/MO). */
export const defaultRegionServerOptions: GameInputFieldOption[] = [
  { label: "Asia", value: "Asia" },
  { label: "America", value: "America" },
  { label: "Europe", value: "Europe" },
  { label: "TW / HK / MO", value: "TW_HK_MO" },
];

export const gameInputFieldPresets = {
  userIdOnly: {
    fields: [
      {
        key: "userId",
        label: "User ID",
        type: "text",
        placeholder: "123456789",
        required: true,
      },
    ],
  },
  userIdAndZone: {
    fields: [
      {
        key: "userId",
        label: "User ID",
        type: "text",
        placeholder: "123456789",
        required: true,
      },
      {
        key: "zone",
        label: "Server ID / Zone",
        type: "text",
        placeholder: "12345",
        required: true,
      },
    ],
  },
  /** UID + pilih server/region. Format Digiflazz umum: UID|Server */
  userIdAndServer: {
    targetFormat: "{userId}|{server}",
    fields: [
      {
        key: "userId",
        label: "UID",
        type: "text",
        placeholder: "812345678",
        required: true,
      },
      {
        key: "server",
        label: "Server",
        type: "select",
        required: true,
        options: defaultRegionServerOptions,
      },
    ],
  },
} satisfies Record<string, GameInputFieldsConfig>;

export function defaultGameInputFields(requiresZone = false): GameInputFieldsConfig {
  return requiresZone ? gameInputFieldPresets.userIdAndZone : gameInputFieldPresets.userIdOnly;
}

function parseOptions(raw: unknown): GameInputFieldOption[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;

  const options: GameInputFieldOption[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const label = String((item as GameInputFieldOption).label ?? "").trim();
    const value = String((item as GameInputFieldOption).value ?? "").trim();
    if (!label || !value) continue;
    options.push({ label, value });
  }

  return options.length > 0 ? options : undefined;
}

export function parseInputFieldsJson(raw: unknown): GameInputFieldsConfig | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const record = raw as { fields?: unknown; targetFormat?: unknown };
  const fields = record.fields;
  if (!Array.isArray(fields) || fields.length === 0) return null;

  const parsed: GameInputField[] = [];
  for (const item of fields) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;

    const row = item as GameInputField;
    const key = String(row.key ?? "").trim();
    const label = String(row.label ?? "").trim();
    const placeholder = String(row.placeholder ?? "").trim();
    const required = Boolean(row.required);
    const typeRaw = String(row.type ?? "text").trim().toLowerCase();
    const type: GameInputFieldType = typeRaw === "select" ? "select" : "text";
    const options = parseOptions(row.options);

    if (!key || !label) return null;

    parsed.push({
      key,
      label,
      placeholder: placeholder || undefined,
      required,
      type,
      ...(type === "select" ? { options: options ?? [] } : options ? { options } : {}),
    });
  }

  const targetFormat = String(record.targetFormat ?? "").trim();

  return {
    fields: parsed,
    ...(targetFormat ? { targetFormat } : {}),
  };
}

export function parseInputFieldsFromForm(formData: FormData): GameInputFieldsConfig | null {
  const raw = String(formData.get("inputFieldsJson") ?? "").trim();
  if (!raw) return null;

  try {
    return parseInputFieldsJson(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function resolveGameInputFields(
  inputFields: unknown,
  requiresZone = false,
): GameInputFieldsConfig {
  return parseInputFieldsJson(inputFields) ?? defaultGameInputFields(requiresZone);
}

function isValidFieldKey(key: string): boolean {
  if (RESERVED_KEYS.has(key)) return true;
  return CUSTOM_KEY_PATTERN.test(key);
}

export function validateInputFields(config: GameInputFieldsConfig | null): Record<string, string> | null {
  if (!config?.fields?.length) {
    return { inputFields: "Minimal satu field input wajib diisi." };
  }

  const fieldErrors: Record<string, string> = {};
  const seen = new Set<string>();
  let userIdCount = 0;
  let zoneCount = 0;
  let serverCount = 0;
  const fieldKeys = new Set<string>();

  config.fields.forEach((field, index) => {
    const prefix = `inputFields.${index}`;
    const type = field.type === "select" ? "select" : "text";

    if (!field.key.trim()) {
      fieldErrors[`${prefix}.key`] = "Key wajib diisi.";
    } else if (!isValidFieldKey(field.key)) {
      fieldErrors[`${prefix}.key`] =
        "Key harus userId, zone, server, atau custom (huruf/angka/underscore, diawali huruf).";
    } else if (seen.has(field.key)) {
      fieldErrors[`${prefix}.key`] = "Key tidak boleh duplikat.";
    } else {
      seen.add(field.key);
      fieldKeys.add(field.key);
    }

    if (!field.label.trim()) {
      fieldErrors[`${prefix}.label`] = "Label wajib diisi.";
    }

    if (type === "select") {
      const options = field.options ?? [];
      if (options.length === 0) {
        fieldErrors[`${prefix}.options`] = "Field select wajib punya minimal satu opsi.";
      } else {
        const optionValues = new Set<string>();
        for (const option of options) {
          if (!option.label.trim() || !option.value.trim()) {
            fieldErrors[`${prefix}.options`] = "Setiap opsi wajib punya label dan value.";
          } else if (optionValues.has(option.value)) {
            fieldErrors[`${prefix}.options`] = `Value opsi duplikat: ${option.value}`;
          } else {
            optionValues.add(option.value);
          }
        }
      }
    }

    if (field.key === "userId") userIdCount += 1;
    if (field.key === "zone") zoneCount += 1;
    if (field.key === "server") serverCount += 1;
  });

  if (userIdCount > 1) {
    fieldErrors.inputFields = "Field userId hanya boleh satu.";
  }
  if (zoneCount > 1) {
    fieldErrors.inputFields = "Field zone hanya boleh satu.";
  }
  if (serverCount > 1) {
    fieldErrors.inputFields = "Field server hanya boleh satu.";
  }

  const targetFormat = config.targetFormat?.trim() ?? "";
  if (targetFormat) {
    const tokens = [...targetFormat.matchAll(TARGET_FORMAT_TOKEN)].map((match) => match[1]);
    if (tokens.length === 0) {
      fieldErrors.targetFormat = "Format tujuan harus memakai token seperti {userId}|{server}.";
    } else {
      const missing = tokens.filter((token) => !fieldKeys.has(token));
      if (missing.length > 0) {
        fieldErrors.targetFormat = `Token tidak ada di field: ${missing.map((t) => `{${t}}`).join(", ")}`;
      }
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

export function hasZoneField(config: GameInputFieldsConfig): boolean {
  return config.fields.some((field) => field.key === "zone");
}

export function hasServerField(config: GameInputFieldsConfig): boolean {
  return config.fields.some((field) => field.key === "server");
}

export function serializeInputFields(config: GameInputFieldsConfig): string {
  return JSON.stringify(config);
}

/** Bangun nomor tujuan (Digiflazz customer_no) dari nilai form + targetFormat. */
export function buildCustomerNo(
  values: Record<string, string>,
  config: GameInputFieldsConfig,
): string {
  const format = config.targetFormat?.trim();
  if (format) {
    return format.replace(TARGET_FORMAT_TOKEN, (_, key: string) =>
      String(values[key] ?? "").trim(),
    );
  }

  const userId = String(values.userId ?? "").trim();
  const zone = String(values.zone ?? "").trim();
  const server = String(values.server ?? "").trim();

  if (server) return userId ? `${userId}|${server}` : server;
  if (zone) return `${userId}${zone}`;
  return userId;
}

export function mapToMelostoreTarget(
  values: Record<string, string>,
  config: GameInputFieldsConfig,
): MelostoreTargetPayload {
  const payload: MelostoreTargetPayload = {
    customer_target: "",
  };
  const additional: Record<string, string> = {};

  for (const field of config.fields) {
    const value = String(values[field.key] ?? "").trim();
    if (field.key === "userId") {
      payload.customer_target = value;
      continue;
    }
    if (field.key === "zone") {
      payload.customer_target_zone = value;
      continue;
    }
    if (field.key === "server") {
      additional.server = value;
      if (!payload.customer_target_zone) {
        payload.customer_target_zone = value;
      }
      continue;
    }
    additional[field.key] = value;
  }

  if (Object.keys(additional).length > 0) {
    payload.additional_data = additional;
  }

  return payload;
}

/** Preview format tujuan di admin (contoh). */
export function previewCustomerNo(config: GameInputFieldsConfig): string {
  const sample: Record<string, string> = {};
  for (const field of config.fields) {
    if (field.key === "userId") {
      sample.userId = "812345678";
      continue;
    }
    if (field.key === "zone") {
      sample.zone = "1234";
      continue;
    }
    if (field.key === "server") {
      sample.server = field.options?.[0]?.value ?? "Asia";
      continue;
    }
    sample[field.key] = field.options?.[0]?.value ?? "value";
  }
  return buildCustomerNo(sample, config);
}
