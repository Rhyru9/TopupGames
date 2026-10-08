import { getCanonicalSyncBrandFromSaved } from "@/lib/providers/catalog/sync-filter-defaults";

export function getProviderCatalogBrandLabel(
  providerSlug: string,
  filters: unknown,
): string | null {
  const brand = getCanonicalSyncBrandFromSaved(providerSlug, filters);
  return brand || null;
}

export function skuProviderBrandMapKey(productId: string, providerId: string) {
  return `${productId}:${providerId}`;
}
