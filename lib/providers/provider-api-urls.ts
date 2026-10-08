export type ProviderApiUrlDefaults = {
  production: string;
  sandbox?: string;
};

export const providerDefaultApiUrls: Record<string, ProviderApiUrlDefaults> = {
  digiflazz: {
    production: "https://api.digiflazz.com/v1/transaction",
  },
  melostore: {
    production: "https://api.melostore.id/api/v1/h2h",
  },
  apigames: {
    production: "https://v1.apigames.id",
  },
  iak: {
    production: "https://prepaid.iak.id/api/top-up",
    sandbox: "https://prepaid.iak.dev/api/top-up",
  },
};

/** Link dokumentasi API resmi per provider (ditampilkan di Pengaturan Provider). */
export const providerDocsUrls: Record<string, string> = {
  digiflazz: "https://developer.digiflazz.com/api/buyer/topup/",
  melostore: "https://h2h.melostore.id/id/docs",
  apigames: "https://docs.apigames.id",
  iak: "https://api.iak.id/developer/integration/quick-start",
};

export function getProviderDocsUrl(slug: string): string | null {
  return providerDocsUrls[slug] ?? null;
}

export function getProviderDefaultApiUrl(slug: string, sandboxMode = false): string {
  const defaults = providerDefaultApiUrls[slug];
  if (!defaults) return "";
  if (sandboxMode && defaults.sandbox) return defaults.sandbox;
  return defaults.production;
}

/** Base URL dari config DB; fallback ke default bila kosong. */
export function resolveProviderApiUrl(
  slug: string,
  config: Record<string, unknown> | null | undefined,
  sandboxMode = false,
): string {
  // IAK: host ditentukan mode sandbox/production — jangan ikuti URL salah di config.
  if (slug === "iak") {
    return getProviderDefaultApiUrl("iak", sandboxMode);
  }

  const custom = typeof config?.apiUrl === "string" ? config.apiUrl.trim() : "";
  const base = custom || getProviderDefaultApiUrl(slug, sandboxMode);
  return base.replace(/\/+$/, "");
}

function iakPrepaidHost(sandboxMode: boolean): string {
  return sandboxMode ? "https://prepaid.iak.dev" : "https://prepaid.iak.id";
}

/** Endpoint pricelist IAK — selalu host resmi sesuai mode. */
export function resolveIakPricelistUrl(_apiUrl: string, sandboxMode = false): string {
  return `${iakPrepaidHost(sandboxMode)}/api/pricelist`;
}

/** Endpoint cek saldo IAK — POST /api/check-balance. */
export function resolveIakCheckBalanceUrl(_apiUrl: string, sandboxMode = false): string {
  return `${iakPrepaidHost(sandboxMode)}/api/check-balance`;
}
