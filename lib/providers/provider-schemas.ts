import { providerDefaultApiUrls } from "@/lib/providers/provider-api-urls";

export type ProviderConfigFieldType = "text" | "password" | "url" | "checkbox";

export type ProviderConfigField = {
  key: string;
  label: string;
  type: ProviderConfigFieldType;
  required?: boolean;
  secret?: boolean;
  fullWidth?: boolean;
  hint?: string;
  placeholder?: string;
};

export type ProviderConfigSchema = {
  slug: string;
  credentialSummary: string[];
  sandboxHint?: string;
  /** Path webhook bawaan — URL penuh ditampilkan otomatis di form (bukan disimpan di DB). */
  webhookPath?: string;
  fields: ProviderConfigField[];
};

export const providerConfigSchemas: Record<string, ProviderConfigSchema> = {
  digiflazz: {
    slug: "digiflazz",
    webhookPath: "/api/providers/digiflazz/webhook",
    sandboxHint: "Kirim flag testing: true pada body request transaksi.",
    credentialSummary: [
      "URL API transaksi Digiflazz",
      "Username buyer Digiflazz",
      "API Key (production / testing)",
      "Webhook secret (X-Hub-Signature HMAC SHA1)",
    ],
    fields: [
      {
        key: "apiUrl",
        label: "URL API",
        type: "url",
        required: true,
        fullWidth: true,
        placeholder: providerDefaultApiUrls.digiflazz.production,
        hint: "Base endpoint H2H. Mode sandbox memakai URL yang sama + flag testing.",
      },
      {
        key: "username",
        label: "Username",
        type: "text",
        required: true,
        placeholder: "username_buyer",
        hint: "Akun buyer di dashboard Digiflazz.",
      },
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        secret: true,
        hint: "Dipakai untuk sign md5(username + apiKey + ref_id).",
      },
      {
        key: "webhookSecret",
        label: "Webhook Secret",
        type: "password",
        secret: true,
        hint: "Validasi header X-Hub-Signature dari callback Digiflazz.",
      },
    ],
  },
  melostore: {
    slug: "melostore",
    webhookPath: "/api/providers/melostore/webhook",
    credentialSummary: [
      "Base URL: https://api.melostore.id/api/v1/h2h",
      "API Key (header X-API-Key) — prefix melo_api_… dari dashboard partner",
      "Secret Key (header X-Secret-Key) — prefix melo_sec_… dari dashboard partner",
      "Webhook Secret — verifikasi header X-H2H-Signature (HMAC-SHA256 raw body)",
      "Salin Webhook URL dari form bawah ke dashboard partner (Developer / Kredensial)",
      "Production wajib IP whitelist; sandbox tidak perlu",
      "Endpoint utama: GET /profile, GET /pricelists, POST /transaction, POST /check-nickname",
    ],
    sandboxHint:
      "Base URL sama untuk sandbox & production. Mode sandbox dari dashboard partner (default akun baru) atau field sandbox_mode per request. Sandbox tidak memotong saldo H2H nyata dan tanpa IP whitelist.",
    fields: [
      {
        key: "apiUrl",
        label: "URL API",
        type: "url",
        required: true,
        fullWidth: true,
        placeholder: providerDefaultApiUrls.melostore.production,
        hint: "Base endpoint H2H. Docs: h2h.melostore.id/id/docs",
      },
      {
        key: "apiKey",
        label: "API Key (X-API-Key)",
        type: "password",
        required: true,
        secret: true,
        placeholder: "melo_api_…",
        hint: "Kunci lengkap dari dashboard — dikirim sebagai header X-API-Key setiap request.",
      },
      {
        key: "secretKey",
        label: "Secret Key (X-Secret-Key)",
        type: "password",
        required: true,
        secret: true,
        placeholder: "melo_sec_…",
        hint: "Kunci lengkap dari dashboard — dikirim sebagai header X-Secret-Key setiap request.",
      },
      {
        key: "webhookSecret",
        label: "Webhook Secret",
        type: "password",
        required: true,
        secret: true,
        hint: "Ditampilkan sekali saat generate/rotate kredensial di dashboard. Dipakai verifikasi X-H2H-Signature (HMAC-SHA256 payload JSON mentah).",
      },
    ],
  },
  apigames: {
    slug: "apigames",
    credentialSummary: [
      "URL API API Games",
      "Merchant ID",
      "Secret Key — sign transaksi v2: md5(merchant_id:secret_key:ref_id)",
    ],
    fields: [
      {
        key: "apiUrl",
        label: "URL API",
        type: "url",
        required: true,
        fullWidth: true,
        placeholder: providerDefaultApiUrls.apigames.production,
        hint: "Base endpoint API Games (cek username, transaksi, dll.).",
      },
      {
        key: "merchantId",
        label: "Merchant ID",
        type: "text",
        required: true,
        placeholder: "M123456",
        hint: "Dari Pengaturan → Secret Key di member.apigames.id.",
      },
      {
        key: "secretKey",
        label: "Secret Key",
        type: "password",
        required: true,
        secret: true,
      },
    ],
  },
  iak: {
    slug: "iak",
    webhookPath: "/api/providers/iak/callback",
    sandboxHint:
      "Sandbox: Development API key + URL https://prepaid.iak.dev/api/top-up. Production: Production API key + https://prepaid.iak.id/api/top-up + whitelist IP server di portal IAK.",
    credentialSummary: [
      "Username = nomor HP / username terdaftar di portal IAK",
      "API Key dari Pengaturan API → Access key (Development untuk sandbox, Production untuk live)",
      "Callback URL — salin dari form bawah, daftarkan di menu Callback di portal IAK",
      "Sign request & callback: md5(username + api_key + ref_id); cek saldo: md5(username + api_key + 'bl')",
      "Production: whitelist IP server Anda; sandbox tidak wajib whitelist",
      "Base URL: prepaid.iak.id (live) / prepaid.iak.dev (sandbox) — bukan api.iak.id",
      "Endpoint: POST /api/top-up, POST /api/pricelist, POST /api/check-balance, POST /api/check-status",
      "Docs: https://api.iak.id/developer/integration/quick-start",
    ],
    fields: [
      {
        key: "apiUrl",
        label: "URL API (top-up)",
        type: "url",
        required: true,
        fullWidth: true,
        placeholder: providerDefaultApiUrls.iak.production,
        hint: "Production: https://prepaid.iak.id/api/top-up · Sandbox: https://prepaid.iak.dev/api/top-up. Jangan pakai api.iak.id (itu situs docs).",
      },
      {
        key: "username",
        label: "Username",
        type: "text",
        required: true,
        placeholder: "08xxxxxxxxxx",
        hint: "Nomor HP / username akun IAK (sama seperti di portal developer).",
      },
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        secret: true,
        hint: "Dari Access key di portal. Sandbox → Development API key. Production → buat & pakai Production API key.",
      },
    ],
  },
  manual: {
    slug: "manual",
    credentialSummary: ["Tidak ada kredensial API — order diproses manual admin."],
    fields: [],
  },
};

export function getProviderFieldDefaultValue(slug: string, fieldKey: string): string {
  if (fieldKey === "apiUrl") {
    return providerDefaultApiUrls[slug]?.production ?? "";
  }
  return "";
}

export function getProviderConfigSchema(slug: string): ProviderConfigSchema | null {
  return providerConfigSchemas[slug] ?? null;
}

export function isProviderConfigured(
  slug: string,
  config: Record<string, unknown> | null | undefined,
): boolean {
  const schema = getProviderConfigSchema(slug);
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

export function maskProviderConfig(
  config: Record<string, unknown> | null | undefined,
  schema: ProviderConfigSchema,
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
