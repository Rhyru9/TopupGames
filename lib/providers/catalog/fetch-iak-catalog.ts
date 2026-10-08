import {
  asRecord,
  parseAmount,
  type CatalogFetchResult,
  type CatalogItem,
  type IakCatalogFilters,
} from "@/lib/providers/catalog/catalog-types";
import { readCatalogCache, writeCatalogCache } from "@/lib/providers/catalog/catalog-cache";
import { formatProviderHttpError } from "@/lib/providers/catalog/catalog-errors";
import { md5 } from "@/lib/providers/catalog/provider-md5";
import { resolveIakPricelistUrl } from "@/lib/providers/provider-api-urls";

function buildCacheKey(input: {
  username: string;
  sandboxMode: boolean;
  filters?: IakCatalogFilters;
}): string {
  const type = input.filters?.productType?.trim() ?? "";
  const operator = input.filters?.operator?.trim() ?? "";
  return `iak:v2:${input.username.slice(-6)}:${input.sandboxMode ? "sandbox" : "live"}:${type}:${operator}`;
}

export async function fetchIakCatalog(input: {
  providerId: string;
  config: Record<string, unknown>;
  apiUrl: string;
  sandboxMode: boolean;
  filters?: IakCatalogFilters;
}): Promise<CatalogFetchResult> {
  const username = String(input.config.username ?? "").trim();
  const apiKey = String(input.config.apiKey ?? "").trim();
  if (!username || !apiKey) {
    throw new Error("Username dan API Key IAK wajib diisi.");
  }

  const appliedFilters: IakCatalogFilters & { mode?: string; priceField?: string } = {
    productType: input.filters?.productType?.trim() || undefined,
    operator: input.filters?.operator?.trim() || undefined,
  };

  const cacheKey = buildCacheKey({
    username,
    sandboxMode: input.sandboxMode,
    filters: appliedFilters,
  });
  const cached = readCatalogCache(cacheKey);
  if (cached) {
    return {
      items: cached,
      meta: {
        pagesFetched: 0,
        appliedFilters: {
          ...appliedFilters,
          mode: input.sandboxMode ? "sandbox" : "production",
          priceField: "product_price",
        },
      },
    };
  }

  const baseUrl = resolveIakPricelistUrl(input.apiUrl, input.sandboxMode);
  const type = appliedFilters.productType;
  const operator = appliedFilters.operator;
  const path =
    type && operator
      ? `${baseUrl}/${encodeURIComponent(type)}/${encodeURIComponent(operator)}`
      : type
        ? `${baseUrl}/${encodeURIComponent(type)}`
        : baseUrl;

  const response = await fetch(path, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      sign: md5(`${username}${apiKey}pl`),
      status: "active",
    }),
    cache: "no-store",
  });

  const payload = asRecord(await response.json().catch(() => ({})));
  if (!response.ok) {
    throw new Error(formatProviderHttpError("IAK", response.status, payload));
  }

  const data = asRecord(payload.data);
  const rc = String(data.rc ?? payload.rc ?? "").trim();
  if (rc && rc !== "00") {
    throw new Error(String(data.message ?? payload.message ?? `IAK rc ${rc}`));
  }

  const rows = Array.isArray(data.pricelist) ? data.pricelist : [];
  const items: CatalogItem[] = [];

  for (const row of rows) {
    const item = asRecord(row);
    const sku = String(item.product_code ?? "").trim();
    const costPrice = parseAmount(item.product_price);
    if (!sku || costPrice === null) continue;

    const typeKey = String(item.product_type ?? "Umum").trim() || "Umum";
    const name =
      String(item.product_nominal ?? "").trim() ||
      String(item.product_details ?? "").trim() ||
      sku;
    const brand = String(item.product_description ?? "").trim() || undefined;
    const category = String(item.product_category ?? "").trim() || undefined;
    const status = String(item.status ?? "").trim().toLowerCase();

    items.push({
      providerSlug: "iak",
      providerId: input.providerId,
      sku,
      name,
      costPrice,
      providerTypeKey: typeKey,
      brand,
      category,
      isAvailable: !status || status === "active",
      raw: item,
    });
  }

  if (items.length > 0) {
    writeCatalogCache(cacheKey, items);
  }

  return {
    items,
    meta: {
      pagesFetched: 1,
      appliedFilters: {
        ...appliedFilters,
        mode: input.sandboxMode ? "sandbox" : "production",
        priceField: "product_price",
      },
    },
  };
}
