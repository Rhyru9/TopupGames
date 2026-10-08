import {
  asRecord,
  type CatalogItem,
  type DigiflazzCatalogFilters,
  type IakCatalogFilters,
  type MelostoreCatalogFilters,
} from "@/lib/providers/catalog/catalog-types";
import { normalizeCatalogText } from "@/lib/providers/catalog/catalog-text";

export function parseDigiflazzFilters(filters: unknown): DigiflazzCatalogFilters {
  const record = asRecord(filters);
  return {
    brand: String(record.brand ?? "").trim() || undefined,
    type: String(record.type ?? "").trim() || undefined,
    category: String(record.category ?? "").trim() || undefined,
  };
}

export function parseMelostoreFilters(filters: unknown): MelostoreCatalogFilters {
  const record = asRecord(filters);
  const brandName = String(record.brandName ?? record.brand ?? "").trim() || undefined;

  const brandIdRaw = record.brandId;
  const brandId =
    typeof brandIdRaw === "number"
      ? brandIdRaw
      : typeof brandIdRaw === "string" && brandIdRaw.trim()
        ? Number(brandIdRaw)
        : undefined;

  return {
    brandName,
    brandId: Number.isFinite(brandId) ? brandId : undefined,
    serverCode: String(record.serverCode ?? "").trim() || undefined,
    categoryName: String(record.categoryName ?? "").trim() || undefined,
  };
}

export function parseIakFilters(filters: unknown): IakCatalogFilters {
  const record = asRecord(filters);
  return {
    productType: String(record.productType ?? record.type ?? "").trim() || undefined,
    operator: String(record.operator ?? "").trim() || undefined,
  };
}

function catalogTextMatches(
  itemValue: string | null | undefined,
  filterValue: string | undefined,
): boolean {
  if (!filterValue) return true;
  return normalizeCatalogText(itemValue) === normalizeCatalogText(filterValue);
}

export function catalogBrandMatches(
  itemBrand: string | null | undefined,
  filterBrand: string | undefined,
): boolean {
  return catalogTextMatches(itemBrand, filterBrand);
}

export function filterDigiflazzCatalogItem(
  item: CatalogItem,
  filters: DigiflazzCatalogFilters,
): boolean {
  if (!catalogTextMatches(item.brand, filters.brand)) return false;
  if (!catalogTextMatches(item.providerTypeKey, filters.type)) return false;
  if (!catalogTextMatches(item.category, filters.category)) return false;
  return true;
}
