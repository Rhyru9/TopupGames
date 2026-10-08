export type CatalogProviderSlug = "digiflazz" | "melostore" | "iak";

export type DigiflazzCatalogFilters = {
  brand?: string;
  type?: string;
  category?: string;
};

export type MelostoreCatalogFilters = {
  brandName?: string;
  /** @deprecated Disimpan lama; isi brandName sesuai panel Melostore */
  brandId?: number;
  serverCode?: string;
  categoryName?: string;
};

export type IakCatalogFilters = {
  /** Tipe produk IAK, mis. game, pulsa, data — kosong = semua */
  productType?: string;
  /** Operator IAK, mis. mobile_legend — kosong = semua dalam tipe */
  operator?: string;
};

export type ProductProviderCatalogFilters =
  | DigiflazzCatalogFilters
  | MelostoreCatalogFilters
  | IakCatalogFilters;

/** @deprecated Use ProductProviderCatalogFilters */
export type GameProviderCatalogFilters = ProductProviderCatalogFilters;

export type CatalogFetchMeta = {
  pagesFetched?: number;
  appliedFilters?: Record<string, string | number | undefined>;
  resolvedBrandId?: number;
  fromCache?: boolean;
};

export type CatalogFetchResult = {
  items: CatalogItem[];
  meta: CatalogFetchMeta;
};

export type CatalogItem = {
  providerSlug: CatalogProviderSlug;
  providerId: string;
  sku: string;
  name: string;
  costPrice: number;
  providerTypeKey: string;
  brand?: string;
  category?: string;
  serverCode?: string;
  isAvailable: boolean;
  raw?: Record<string, unknown>;
};

export type SyncSelectedCatalogInput = {
  productId: string;
  productTypeId: string;
  marginGuest: number;
  marginMember: number;
  cashbackPoin: number;
  items: SelectedSyncItem[];
};

export type SelectedSyncItem = {
  providerId: string;
  sku: string;
  providerTypeKey: string;
  name: string;
  costPrice: number;
  isAvailable: boolean;
  catalogBrand?: string;
};

export type SyncProductSkusResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

/** @deprecated Use SyncProductSkusResult */
export type SyncGameProductsResult = SyncProductSkusResult;

export function catalogItemKey(providerId: string, sku: string): string {
  return `${providerId}:${sku}`;
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export function parseAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }
  return null;
}
