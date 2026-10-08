import {
  asRecord,
  parseAmount,
  type CatalogFetchResult,
  type CatalogItem,
  type MelostoreCatalogFilters,
} from "@/lib/providers/catalog/catalog-types";
import { readCatalogCache, writeCatalogCache } from "@/lib/providers/catalog/catalog-cache";
import { formatProviderHttpError } from "@/lib/providers/catalog/catalog-errors";
import { parseMelostoreCatalogItemStatus } from "@/lib/providers/catalog/melostore-status";
import { normalizeCatalogText } from "@/lib/providers/catalog/catalog-text";
import {
  ingestMetaBrands,
  itemMatchesBrandFilter,
  readItemBrandName,
  readNextCursor,
  resolveBrandIdFromFilter,
  suggestSimilarBrandNames,
} from "@/lib/providers/catalog/melostore-meta";

/** Melostore: maks 10 fetch pricelist per menit. */
const PAGE_LIMIT = 1000;
const MAX_PAGES_WITH_BRAND = 9;
const MAX_PAGES_WITHOUT_BRAND = 5;

function buildCacheKey(input: {
  apiKey: string;
  filters?: MelostoreCatalogFilters;
}): string {
  const brand = input.filters?.brandName?.trim() ?? "";
  const server = input.filters?.serverCode?.trim() ?? "";
  const category = input.filters?.categoryName?.trim() ?? "";
  const brandId = input.filters?.brandId ?? "";
  return `melostore:${input.apiKey.slice(-8)}:${brand}:${server}:${category}:${brandId}`;
}

export async function fetchMelostoreCatalog(input: {
  providerId: string;
  apiUrl: string;
  apiKey: string;
  secretKey: string;
  filters?: MelostoreCatalogFilters;
  skipCache?: boolean;
}): Promise<CatalogFetchResult> {
  if (!input.apiKey || !input.secretKey) {
    throw new Error("API Key dan Secret Key Melostore wajib diisi.");
  }

  const cacheKey = buildCacheKey(input);
  if (!input.skipCache) {
    const cached = readCatalogCache(cacheKey);
    if (cached) {
      return {
        items: cached,
        meta: {
          pagesFetched: 0,
          fromCache: true,
          appliedFilters: {
            brandName: input.filters?.brandName,
            serverCode: input.filters?.serverCode,
            categoryName: input.filters?.categoryName,
            brandId: input.filters?.brandId,
          },
          resolvedBrandId: input.filters?.brandId,
        },
      };
    }
  }

  const headers = {
    Accept: "application/json",
    "X-API-Key": input.apiKey,
    "X-Secret-Key": input.secretKey,
  };

  const rawBrandName = input.filters?.brandName?.trim() || undefined;
  const brandNameFilter = rawBrandName ? normalizeCatalogText(rawBrandName) : undefined;
  const serverCodeFilter = input.filters?.serverCode?.trim() || undefined;
  const categoryNameFilter = input.filters?.categoryName?.trim() || undefined;
  const hasBrandFilter = Boolean(brandNameFilter) || input.filters?.brandId !== undefined;
  const maxPages = hasBrandFilter ? MAX_PAGES_WITH_BRAND : MAX_PAGES_WITHOUT_BRAND;

  const allItems: CatalogItem[] = [];
  const brandNames = new Map<number, string>();
  let resolvedBrandId = input.filters?.brandId;
  let cursor: string | null = null;
  let pagesFetched = 0;

  for (let page = 0; page < maxPages; page += 1) {
    const url = new URL(`${input.apiUrl.replace(/\/+$/, "")}/pricelists`);
    url.searchParams.set("limit", String(PAGE_LIMIT));
    if (cursor) url.searchParams.set("cursor", cursor);

    const response = await fetch(url, { method: "GET", headers, cache: "no-store" });
    const payload = asRecord(await response.json().catch(() => ({})));

    if (!response.ok) {
      throw new Error(formatProviderHttpError("Melostore", response.status, payload));
    }

    pagesFetched += 1;

    const meta = asRecord(payload.meta);
    ingestMetaBrands(meta, brandNames);

    if (brandNameFilter) {
      resolvedBrandId = resolveBrandIdFromFilter(
        brandNames,
        rawBrandName ?? brandNameFilter,
        resolvedBrandId,
      );
    }

    const batch = Array.isArray(payload.data) ? payload.data : [];
    let matchedInPage = 0;

    for (const row of batch) {
      const item = asRecord(row);
      const sku = String(item.sku_code ?? "").trim();
      const costPrice = parseAmount(item.price);
      if (!sku || costPrice === null) continue;

      const brandId =
        typeof item.brand_id === "number" ? item.brand_id : Number(item.brand_id) || undefined;
      const brandName =
        readItemBrandName(item) ||
        (brandId !== undefined ? brandNames.get(brandId) : undefined) ||
        undefined;
      const serverCode = String(item.server_code ?? "").trim() || undefined;
      const categoryName = String(item.category_name ?? "").trim() || undefined;
      const typeName = String(item.type_name ?? "").trim() || "Umum";

      if (
        !itemMatchesBrandFilter({
          brandName,
          brandId,
          brandNameFilter,
          resolvedBrandId,
        })
      ) {
        continue;
      }

      if (serverCodeFilter && serverCode !== serverCodeFilter) continue;
      if (categoryNameFilter && categoryName !== categoryNameFilter) continue;

      matchedInPage += 1;
      allItems.push({
        providerSlug: "melostore",
        providerId: input.providerId,
        sku,
        name: String(item.name ?? sku).trim(),
        costPrice,
        providerTypeKey: typeName,
        brand: brandName,
        category: categoryName,
        serverCode,
        isAvailable: parseMelostoreCatalogItemStatus(item.status),
        raw: item,
      });
    }

    if (resolvedBrandId !== undefined && allItems.length > 0 && matchedInPage === 0) {
      break;
    }

    const nextCursor = readNextCursor(meta);
    if (!nextCursor) break;
    cursor = nextCursor;
  }

  if (rawBrandName && allItems.length === 0) {
    const similar = suggestSimilarBrandNames(brandNames, rawBrandName);
    const hint =
      similar.length > 0 ? ` Brand tersedia di API: ${similar.join(", ")}.` : "";
    throw new Error(
      `Brand "${rawBrandName}" tidak ditemukan setelah scan katalog Melostore.${hint} Salin persis dari panel H2H.`,
    );
  }

  if (allItems.length > 0 && !input.skipCache) {
    writeCatalogCache(cacheKey, allItems);
  }

  return {
    items: allItems,
    meta: {
      pagesFetched,
      resolvedBrandId,
      appliedFilters: {
        brandName: rawBrandName,
        serverCode: serverCodeFilter,
        categoryName: categoryNameFilter,
        brandId: resolvedBrandId,
      },
    },
  };
}
