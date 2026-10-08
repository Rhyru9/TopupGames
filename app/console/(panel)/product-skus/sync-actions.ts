"use server";

import { revalidatePath } from "next/cache";
import type { GameCatalogActionState } from "@/lib/catalog-products/game-catalog-mutations";
import { getProductTypeOptionsForProduct } from "@/lib/catalog-products/game-catalog-data";
import type { SelectedSyncItem } from "@/lib/providers/catalog/catalog-types";
import {
  getSavedProviderFilters,
  previewProductSync,
  type ProductSyncProviderInput,
} from "@/lib/providers/catalog/product-sync-preview";
import {
  getExistingCatalogSkuKeys,
  syncSelectedCatalogItems,
} from "@/lib/providers/catalog/sync-product-skus";
import {
  getCanonicalSyncBrandFromSaved,
  providerLocksBrand,
  syncBrandsMatch,
} from "@/lib/providers/catalog/sync-filter-defaults";
import { prisma } from "@/lib/prisma";

function revalidateProductSyncPaths(productId: string) {
  revalidatePath("/console/product-skus");
  revalidatePath("/console/product-skus/sync");
  revalidatePath("/console/jenis-produk");
  revalidatePath(`/console/produk/${productId}/edit`);
  revalidatePath("/console");
}

function parseIntField(value: FormDataEntryValue | null, fallback = 0): number {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function parseProviderFilters(formData: FormData, providerIds: string[]): ProductSyncProviderInput[] {
  const providers: ProductSyncProviderInput[] = [];

  for (const providerId of providerIds) {
    const slug = String(formData.get(`providerSlug_${providerId}`) ?? "").trim();
    if (!slug) continue;

    if (slug === "digiflazz") {
      providers.push({
        providerId,
        providerSlug: slug,
        filters: {
          brand: String(formData.get(`digiflazzBrand_${providerId}`) ?? "").trim() || undefined,
          type: String(formData.get(`digiflazzType_${providerId}`) ?? "").trim() || undefined,
        },
      });
      continue;
    }

    if (slug === "melostore") {
      providers.push({
        providerId,
        providerSlug: slug,
        filters: {
          brandName:
            String(formData.get(`melostoreBrandName_${providerId}`) ?? "").trim() || undefined,
          serverCode:
            String(formData.get(`melostoreServerCode_${providerId}`) ?? "").trim() || undefined,
        },
      });
      continue;
    }

    if (slug === "iak") {
      providers.push({
        providerId,
        providerSlug: slug,
        filters: {
          productType:
            String(formData.get(`iakProductType_${providerId}`) ?? "").trim() || undefined,
          operator: String(formData.get(`iakOperator_${providerId}`) ?? "").trim() || undefined,
        },
      });
    }
  }

  return providers;
}

function requestedBrandFromInput(input: ProductSyncProviderInput): string {
  const filters = input.filters as Record<string, unknown>;
  if (input.providerSlug === "digiflazz") return String(filters.brand ?? "").trim();
  if (input.providerSlug === "melostore") return String(filters.brandName ?? "").trim();
  if (input.providerSlug === "iak") return String(filters.operator ?? "").trim();
  return "";
}

async function assertBrandMatchesProduct(input: {
  productId: string;
  providers: ProductSyncProviderInput[];
  allowBrandChange: boolean;
}): Promise<string | null> {
  if (input.allowBrandChange) return null;

  const savedRows = await getSavedProviderFilters(input.productId);

  for (const provider of input.providers) {
    if (!providerLocksBrand(provider.providerSlug)) continue;

    const saved = savedRows.find((row) => row.providerId === provider.providerId);
    const official = getCanonicalSyncBrandFromSaved(
      provider.providerSlug,
      saved?.filters ?? {},
    );
    const requested = requestedBrandFromInput(provider);
    if (!official || !requested) continue;
    if (syncBrandsMatch(official, requested)) continue;

    return `Brand "${requested}" berbeda dari brand resmi produk ini ("${official}"). Klik "Ubah brand" lalu konfirmasi, atau kembalikan brand resmi.`;
  }

  return null;
}

function parseSelectedItems(formData: FormData): SelectedSyncItem[] {
  const raw = String(formData.get("selectedItems") ?? "").trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const record = entry as Record<string, unknown>;
        const providerId = String(record.providerId ?? "").trim();
        const sku = String(record.sku ?? "").trim();
        const providerTypeKey = String(record.providerTypeKey ?? "").trim() || "Umum";
        const name = String(record.name ?? "").trim();
        const costPrice = parseIntField(record.costPrice as FormDataEntryValue | null);
        const isAvailable = record.isAvailable !== false;
        const catalogBrand = String(record.catalogBrand ?? "").trim() || undefined;
        if (!providerId || !sku || !name) return null;
        const item: SelectedSyncItem = {
          providerId,
          sku,
          providerTypeKey,
          name,
          costPrice,
          isAvailable,
          ...(catalogBrand ? { catalogBrand } : {}),
        };
        return item;
      })
      .filter((entry): entry is SelectedSyncItem => entry !== null);
  } catch {
    return [];
  }
}

export async function getProductSyncDefaultsAction(productId: string) {
  const [product, saved, productTypes] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, nicknameCheckCode: true },
    }),
    getSavedProviderFilters(productId),
    getProductTypeOptionsForProduct(productId),
  ]);

  if (!product) return null;

  return {
    product,
    savedFilters: saved,
    productTypes,
  };
}

export async function loadProductSyncPreviewAction(
  _prev: GameCatalogActionState,
  formData: FormData,
): Promise<GameCatalogActionState> {
  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) return { error: "Pilih produk terlebih dahulu." };

  const providerIds = formData.getAll("providerIds").map((value) => String(value));
  if (providerIds.length === 0) return { error: "Pilih provider terlebih dahulu." };
  if (providerIds.length > 1) return { error: "Sync satu provider per sesi." };

  const providerInputs = parseProviderFilters(formData, providerIds);
  if (providerInputs.length === 0) return { error: "Filter provider tidak valid." };

  const allowBrandChange = String(formData.get("allowBrandChange") ?? "").trim() === "1";
  const brandError = await assertBrandMatchesProduct({
    productId,
    providers: providerInputs,
    allowBrandChange,
  });
  if (brandError) return { error: brandError };

  const [preview, existingSkuKeys] = await Promise.all([
    previewProductSync({
      productId,
      providers: providerInputs,
      persistFilters: true,
    }),
    getExistingCatalogSkuKeys(productId),
  ]);

  if (!preview) return { error: "Produk tidak ditemukan." };

  return {
    productSyncPreview: preview,
    existingSkuKeys,
    success: "Daftar SKU berhasil dimuat.",
  };
}

export async function syncSelectedCatalogProductsAction(
  _prev: GameCatalogActionState,
  formData: FormData,
): Promise<GameCatalogActionState> {
  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) return { error: "Produk tidak valid." };

  const productTypeId = String(formData.get("productTypeId") ?? "").trim();
  if (!productTypeId) return { error: "Pilih jenis produk terlebih dahulu." };

  const items = parseSelectedItems(formData);
  const marginGuest = parseIntField(formData.get("marginGuest"));
  const marginMember = parseIntField(formData.get("marginMember"));
  const cashbackPoin = Math.max(0, parseIntField(formData.get("cashbackPoin")));

  const syncResult = await syncSelectedCatalogItems({
    productId,
    productTypeId,
    items,
    marginGuest,
    marginMember,
    cashbackPoin,
  });

  revalidateProductSyncPaths(productId);

  const existingSkuKeys = await getExistingCatalogSkuKeys(productId);
  const summary = `Sync selesai: ${syncResult.created} baru, ${syncResult.updated} diperbarui, ${syncResult.skipped} dilewati.`;

  return {
    syncResult,
    existingSkuKeys,
    success: summary,
    error: syncResult.errors.length > 0 ? syncResult.errors.slice(0, 3).join(" · ") : undefined,
  };
}
