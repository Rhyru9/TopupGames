import type { ProductProviderCatalogFilters } from "@/lib/providers/catalog/catalog-types";

export type ProductProviderCatalogInput = {
  productId: string;
  providerId: string;
  isEnabled: boolean;
  filters: ProductProviderCatalogFilters;
};

/** @deprecated Use ProductProviderCatalogInput */
export type GameProviderCatalogInput = ProductProviderCatalogInput;

export type ProductTypeInput = {
  productId: string;
  name: string;
  slug: string;
  iconUrl?: string;
  /** Hanya untuk seed/script — create otomatis dari urutan tambah. */
  sortOrder?: number;
};

export const gameCatalogSections = [
  { slug: "info", label: "Info Produk", description: "Data dasar & input pembeli" },
  { slug: "mapping", label: "Mapping Provider", description: "Filter brand/server per provider" },
  { slug: "types", label: "Jenis Produk", description: "Section filter storefront" },
  { slug: "sync", label: "Sync SKU", description: "Preview & import SKU" },
] as const;

export type GameCatalogSection = (typeof gameCatalogSections)[number]["slug"];

export function isGameCatalogSection(value: string | undefined): value is GameCatalogSection {
  return gameCatalogSections.some((section) => section.slug === value);
}
