import {
  getProviderCatalogBrandLabel,
} from "@/lib/catalog-products/product-provider-brand";
import {
  parseDigiflazzFilters,
  parseIakFilters,
  parseMelostoreFilters,
} from "@/lib/providers/catalog/match-catalog-item";
import type {
  DigiflazzCatalogFilters,
  IakCatalogFilters,
  MelostoreCatalogFilters,
} from "@/lib/providers/catalog/catalog-types";

export const CATALOG_BRAND_PROVIDER_SLUGS = new Set(["melostore", "digiflazz", "iak"]);

export function providerUsesCatalogBrand(providerSlug: string): boolean {
  return CATALOG_BRAND_PROVIDER_SLUGS.has(providerSlug);
}

export function catalogBrandFieldLabel(providerSlug: string): string {
  if (providerSlug === "iak") return "Operator provider";
  return "Brand provider";
}

export function resolveSkuCatalogBrand(
  providerSlug: string,
  skuBrand: string | null | undefined,
  productProviderFilters?: unknown,
): string | undefined {
  const fromSku = String(skuBrand ?? "").trim();
  if (fromSku) return fromSku;

  if (!productProviderFilters) return undefined;
  return getProviderCatalogBrandLabel(providerSlug, productProviderFilters) ?? undefined;
}

export function buildFetchFiltersFromSkuBrand(
  providerSlug: string,
  skuBrand: string | undefined,
  productProviderFilters?: unknown,
): DigiflazzCatalogFilters | MelostoreCatalogFilters | IakCatalogFilters {
  const saved = productProviderFilters ?? {};

  if (providerSlug === "melostore") {
    const melo = parseMelostoreFilters(saved);
    return {
      ...melo,
      brandName: skuBrand ?? melo.brandName,
    };
  }

  if (providerSlug === "digiflazz") {
    const digi = parseDigiflazzFilters(saved);
    return {
      ...digi,
      brand: skuBrand ?? digi.brand,
    };
  }

  if (providerSlug === "iak") {
    const iak = parseIakFilters(saved);
    return {
      ...iak,
      operator: skuBrand ?? iak.operator,
    };
  }

  return {};
}

export function fetchGroupKey(providerId: string, brandKey: string) {
  return `${providerId}::${brandKey.trim().toLowerCase() || "__empty__"}`;
}
