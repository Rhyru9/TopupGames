import type { CatalogItem } from "@/lib/providers/catalog/catalog-types";

export const CATALOG_CACHE_TTL_MS = 55_000;

/** Digiflazz full pricelist — slightly above Digiflazz's ~5 min rate limit. */
export const DIGIFLAZZ_FULL_CACHE_TTL_MS = 330_000;

type CatalogCacheEntry = {
  expiresAt: number;
  items: CatalogItem[];
};

const catalogCache = new Map<string, CatalogCacheEntry>();

export function readCatalogCache(cacheKey: string): CatalogItem[] | null {
  const entry = catalogCache.get(cacheKey);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    catalogCache.delete(cacheKey);
    return null;
  }
  return entry.items;
}

export function writeCatalogCache(
  cacheKey: string,
  items: CatalogItem[],
  ttlMs: number = CATALOG_CACHE_TTL_MS,
) {
  if (items.length === 0) return;
  catalogCache.set(cacheKey, {
    expiresAt: Date.now() + ttlMs,
    items,
  });
}
