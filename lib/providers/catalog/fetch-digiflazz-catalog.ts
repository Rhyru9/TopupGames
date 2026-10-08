import {
  asRecord,
  parseAmount,
  type CatalogFetchResult,
  type CatalogItem,
  type DigiflazzCatalogFilters,
} from "@/lib/providers/catalog/catalog-types";
import {
  DIGIFLAZZ_FULL_CACHE_TTL_MS,
  readCatalogCache,
  writeCatalogCache,
} from "@/lib/providers/catalog/catalog-cache";
import { formatProviderHttpError } from "@/lib/providers/catalog/catalog-errors";
import { filterDigiflazzCatalogItem } from "@/lib/providers/catalog/match-catalog-item";
import { md5 } from "@/lib/providers/catalog/provider-md5";
import { resolveProviderApiUrl } from "@/lib/providers/provider-api-urls";

const RATE_LIMIT_MESSAGE =
  "Rate limit Digiflazz (pricelist max 1× / 5 menit). Tunggu sebentar; sync produk lain akan memakai cache jika masih valid.";

function resolveDigiflazzPriceListUrl(apiUrl: string): string {
  const normalized = apiUrl.replace(/\/+$/, "");
  if (normalized.endsWith("/transaction")) {
    return normalized.replace(/\/transaction$/, "/price-list");
  }
  if (normalized.includes("/v1/")) {
    return normalized.replace(/\/v1\/[^/]+$/, "/v1/price-list");
  }
  return "https://api.digiflazz.com/v1/price-list";
}

function buildFullCacheKey(username: string): string {
  return `digiflazz:${username.slice(-6)}:full`;
}

function parseDigiflazzRows(
  rows: unknown[],
  providerId: string,
): CatalogItem[] {
  const items: CatalogItem[] = [];

  for (const row of rows) {
    const item = asRecord(row);
    const sku = String(item.buyer_sku_code ?? "").trim();
    const costPrice = parseAmount(item.price);
    if (!sku || costPrice === null) continue;

    const brand = String(item.brand ?? "").trim();
    const type = String(item.type ?? "Umum").trim() || "Umum";

    items.push({
      providerSlug: "digiflazz",
      providerId,
      sku,
      name: String(item.product_name ?? sku).trim(),
      costPrice,
      providerTypeKey: type,
      brand,
      category: String(item.category ?? "").trim() || undefined,
      isAvailable: Boolean(item.buyer_product_status),
      raw: item,
    });
  }

  return items;
}

function readDigiflazzPayloadMessage(payload: Record<string, unknown>): string {
  const rc = String(payload.rc ?? "").trim();
  const message = String(payload.message ?? payload.msg ?? "").trim();
  if (message) return message;
  if (rc && rc !== "00") return `Digiflazz rc ${rc}`;
  return "";
}

function isDigiflazzRateLimit(payload: Record<string, unknown>): boolean {
  const rc = String(payload.rc ?? "").trim();
  if (rc === "83") return true;

  const message = readDigiflazzPayloadMessage(payload).toLowerCase();
  return (
    message.includes("rate limit") ||
    message.includes("terlalu sering") ||
    message.includes("limitasi") ||
    (message.includes("limit") && message.includes("pricelist"))
  );
}

function formatBrandNotFoundError(brandRaw: string): string {
  return `Brand "${brandRaw}" tidak ditemukan di pricelist Digiflazz. Salin ejaan brand dari panel Digiflazz (spasi & huruf besar/kecil tidak harus sama persis).`;
}

function applyLocalFilters(
  items: CatalogItem[],
  filters: DigiflazzCatalogFilters,
): CatalogItem[] {
  return items.filter((item) => filterDigiflazzCatalogItem(item, filters));
}

export async function fetchDigiflazzCatalog(input: {
  providerId: string;
  config: Record<string, unknown>;
  apiUrl: string;
  sandboxMode?: boolean;
  filters?: DigiflazzCatalogFilters;
}): Promise<CatalogFetchResult> {
  const username = String(input.config.username ?? "").trim();
  const apiKey = String(input.config.apiKey ?? "").trim();
  if (!username || !apiKey) {
    throw new Error("Username dan API Key Digiflazz wajib diisi.");
  }

  const brandRaw = input.filters?.brand?.trim();
  if (!brandRaw) {
    throw new Error(
      "Brand Digiflazz wajib diisi. Salin dari panel (mis. MOBILE LEGENDS).",
    );
  }

  const appliedFilters: DigiflazzCatalogFilters = {
    brand: brandRaw,
    type: input.filters?.type?.trim() || undefined,
    category: input.filters?.category?.trim() || undefined,
  };

  const cacheKey = buildFullCacheKey(username);
  const cached = readCatalogCache(cacheKey);
  if (cached) {
    const items = applyLocalFilters(cached, appliedFilters);
    if (items.length === 0) {
      throw new Error(formatBrandNotFoundError(brandRaw));
    }
    return {
      items,
      meta: { pagesFetched: 0, appliedFilters, fromCache: true },
    };
  }

  const priceListUrl = resolveDigiflazzPriceListUrl(
    resolveProviderApiUrl("digiflazz", input.config, Boolean(input.sandboxMode)) ||
      input.apiUrl,
  );

  const body = {
    cmd: "prepaid",
    username,
    sign: md5(`${username}${apiKey}pricelist`),
  };

  const response = await fetch(priceListUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = asRecord(await response.json().catch(() => ({})));

  if (!response.ok) {
    if (isDigiflazzRateLimit(payload)) {
      throw new Error(RATE_LIMIT_MESSAGE);
    }
    throw new Error(formatProviderHttpError("Digiflazz", response.status, payload));
  }

  if (isDigiflazzRateLimit(payload)) {
    throw new Error(RATE_LIMIT_MESSAGE);
  }

  const rows = Array.isArray(payload.data) ? payload.data : [];
  const fullItems = parseDigiflazzRows(rows, input.providerId);

  if (fullItems.length === 0) {
    const message = readDigiflazzPayloadMessage(payload);
    throw new Error(
      message ||
        "Pricelist Digiflazz kosong. Cek akun buyer / koneksi API Digiflazz.",
    );
  }

  writeCatalogCache(cacheKey, fullItems, DIGIFLAZZ_FULL_CACHE_TTL_MS);

  const items = applyLocalFilters(fullItems, appliedFilters);
  if (items.length === 0) {
    throw new Error(formatBrandNotFoundError(brandRaw));
  }

  return {
    items,
    meta: { pagesFetched: 1, appliedFilters },
  };
}
