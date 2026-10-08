import { normalizeCatalogText } from "@/lib/providers/catalog/catalog-text";
import {
  parseDigiflazzFilters,
  parseIakFilters,
  parseMelostoreFilters,
} from "@/lib/providers/catalog/match-catalog-item";

export type ProviderFilterState = {
  digiflazzBrand: string;
  digiflazzType: string;
  melostoreBrandName: string;
  melostoreServerCode: string;
  iakProductType: string;
  iakOperator: string;
};

/** Brand/operator resmi yang mengikat SKU ke produk (bukan nama produk toko). */
export function getCanonicalSyncBrandFromState(
  providerSlug: string,
  filters: ProviderFilterState,
): string {
  if (providerSlug === "digiflazz") return filters.digiflazzBrand.trim();
  if (providerSlug === "melostore") return filters.melostoreBrandName.trim();
  if (providerSlug === "iak") return filters.iakOperator.trim();
  return "";
}

export function getCanonicalSyncBrandFromSaved(
  providerSlug: string,
  savedFilters: unknown,
): string {
  if (providerSlug === "digiflazz") {
    return parseDigiflazzFilters(savedFilters).brand?.trim() ?? "";
  }
  if (providerSlug === "melostore") {
    return parseMelostoreFilters(savedFilters).brandName?.trim() ?? "";
  }
  if (providerSlug === "iak") {
    return parseIakFilters(savedFilters).operator?.trim() ?? "";
  }
  return "";
}

export function syncBrandsMatch(a: string, b: string): boolean {
  return normalizeCatalogText(a) === normalizeCatalogText(b);
}

export function providerLocksBrand(providerSlug: string): boolean {
  return providerSlug === "digiflazz" || providerSlug === "melostore";
}

export function toIakOperatorSlug(code: string | null | undefined): string {
  const trimmed = String(code ?? "").trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.replace(/-/g, "_");
}

export function defaultProviderFilters(): ProviderFilterState {
  return {
    digiflazzBrand: "",
    digiflazzType: "",
    melostoreBrandName: "",
    melostoreServerCode: "",
    iakProductType: "game",
    iakOperator: "",
  };
}

export function buildProviderFilterDefaults(input: {
  providerSlug: string;
  savedFilters: unknown;
  nicknameCheckCode?: string | null;
}): ProviderFilterState {
  const base = defaultProviderFilters();

  if (input.providerSlug === "digiflazz") {
    const digi = parseDigiflazzFilters(input.savedFilters);
    return {
      ...base,
      digiflazzBrand: digi.brand ?? "",
      digiflazzType: digi.type ?? "",
    };
  }

  if (input.providerSlug === "melostore") {
    const melo = parseMelostoreFilters(input.savedFilters);
    return {
      ...base,
      melostoreBrandName: melo.brandName ?? "",
      melostoreServerCode: melo.serverCode ?? "",
    };
  }

  if (input.providerSlug === "iak") {
    const iak = parseIakFilters(input.savedFilters);
    return {
      ...base,
      iakProductType: iak.productType ?? "game",
      iakOperator: iak.operator ?? toIakOperatorSlug(input.nicknameCheckCode),
    };
  }

  return base;
}

export function describeActiveSyncFilters(
  providerSlug: string,
  filters: ProviderFilterState,
): string[] {
  const lines: string[] = [];

  if (providerSlug === "digiflazz") {
    if (filters.digiflazzBrand.trim()) lines.push(`Brand: ${filters.digiflazzBrand.trim()}`);
    if (filters.digiflazzType.trim()) lines.push(`Type: ${filters.digiflazzType.trim()}`);
  } else if (providerSlug === "melostore") {
    if (filters.melostoreBrandName.trim()) lines.push(`Brand: ${filters.melostoreBrandName.trim()}`);
    if (filters.melostoreServerCode.trim()) {
      lines.push(`Server: ${filters.melostoreServerCode.trim()}`);
    }
  } else if (providerSlug === "iak") {
    if (filters.iakProductType.trim()) lines.push(`Tipe: ${filters.iakProductType.trim()}`);
    if (filters.iakOperator.trim()) lines.push(`Operator: ${filters.iakOperator.trim()}`);
  }

  return lines;
}

export function syncFilterHintForProvider(providerSlug: string): string {
  switch (providerSlug) {
    case "digiflazz":
      return "Salin brand persis dari panel Digiflazz (ejaan & huruf besar/kecil harus sama).";
    case "melostore":
      return "Contoh brand Melostore: Mobile Legends (ID) — salin persis dari panel H2H.";
    case "iak":
      return "Contoh operator IAK: mobile_legend (underscore, lowercase).";
    default:
      return "";
  }
}
