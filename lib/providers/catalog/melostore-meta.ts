import { asRecord } from "@/lib/providers/catalog/catalog-types";
import { normalizeCatalogText } from "@/lib/providers/catalog/catalog-text";

export function readItemBrandName(item: Record<string, unknown>) {
  return String(
    item.brand_name ?? item.brandName ?? item.brand_label ?? item.brand ?? "",
  ).trim();
}

export function readNextCursor(meta: Record<string, unknown>): string | null {
  if (typeof meta.next_cursor === "string" && meta.next_cursor) return meta.next_cursor;
  if (typeof meta.nextCursor === "string" && meta.nextCursor) return meta.nextCursor;

  const pagination = asRecord(meta.pagination);
  if (typeof pagination.next_cursor === "string" && pagination.next_cursor) {
    return pagination.next_cursor;
  }
  if (typeof pagination.nextCursor === "string" && pagination.nextCursor) {
    return pagination.nextCursor;
  }

  return null;
}

export function ingestMetaBrands(meta: Record<string, unknown>, target: Map<number, string>) {
  const brands = meta.brands;
  if (!brands) return;

  if (Array.isArray(brands)) {
    for (const row of brands) {
      const item = asRecord(row);
      const id = typeof item.id === "number" ? item.id : Number(item.id ?? item.brand_id);
      const name = String(item.name ?? item.title ?? item.brand_name ?? "").trim();
      if (Number.isFinite(id) && name) target.set(id, name);
    }
    return;
  }

  if (typeof brands !== "object") return;

  for (const [key, value] of Object.entries(brands as Record<string, unknown>)) {
    if (value && typeof value === "object") {
      const item = asRecord(value);
      const id = typeof item.id === "number" ? item.id : Number(item.id ?? key);
      const name = String(item.name ?? item.title ?? item.brand_name ?? "").trim();
      if (Number.isFinite(id) && name) target.set(id, name);
      continue;
    }

    const id = Number(key);
    const name = String(value ?? "").trim();
    if (Number.isFinite(id) && name) target.set(id, name);
  }
}

export function resolveBrandIdFromFilter(
  brandNames: Map<number, string>,
  brandNameFilter: string,
  explicitBrandId?: number,
): number | undefined {
  if (explicitBrandId !== undefined) return explicitBrandId;

  const target = normalizeCatalogText(brandNameFilter);
  for (const [id, name] of brandNames) {
    if (normalizeCatalogText(name) === target) return id;
  }

  return undefined;
}

export function itemMatchesBrandFilter(input: {
  brandName: string | undefined;
  brandId: number | undefined;
  brandNameFilter: string | undefined;
  resolvedBrandId: number | undefined;
}): boolean {
  const hasBrandFilter =
    Boolean(input.brandNameFilter) || input.resolvedBrandId !== undefined;
  if (!hasBrandFilter) return true;

  if (
    input.resolvedBrandId !== undefined &&
    input.brandId !== undefined &&
    input.brandId === input.resolvedBrandId
  ) {
    return true;
  }

  if (input.brandNameFilter && input.brandName) {
    return normalizeCatalogText(input.brandName) === input.brandNameFilter;
  }

  return false;
}

export function suggestSimilarBrandNames(
  brandNames: Map<number, string>,
  rawBrandName: string,
): string[] {
  const needle = normalizeCatalogText(rawBrandName);
  const token = needle.replace(/\([^)]*\)/g, "").trim();

  return [...brandNames.values()]
    .filter((name) => {
      const norm = normalizeCatalogText(name);
      return norm.includes(token) || token.includes(norm);
    })
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 8);
}
