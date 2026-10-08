import { ProductSkuStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  catalogItemKey,
  type SelectedSyncItem,
  type SyncProductSkusResult,
  type SyncSelectedCatalogInput,
} from "@/lib/providers/catalog/catalog-types";

export async function getExistingCatalogSkuKeys(productId: string): Promise<string[]> {
  const productSkus = await prisma.productSku.findMany({
    where: { productId },
    select: { providerId: true, providerSku: true },
  });
  return productSkus.map((sku) => catalogItemKey(sku.providerId, sku.providerSku));
}

function resolveCatalogBrandForItem(item: SelectedSyncItem): string | null {
  const brand = String(item.catalogBrand ?? "").trim();
  return brand || null;
}

async function upsertSelectedItem(input: {
  productId: string;
  item: SelectedSyncItem;
  productTypeId: string;
  marginGuest: number;
  marginMember: number;
  cashbackPoin: number;
}): Promise<"created" | "updated"> {
  const catalogBrand = resolveCatalogBrandForItem(input.item);

  const existing = await prisma.productSku.findUnique({
    where: {
      productId_providerId_providerSku: {
        productId: input.productId,
        providerId: input.item.providerId,
        providerSku: input.item.sku,
      },
    },
  });

  if (existing) {
    const updateData: {
      costPrice: number;
      priceGuest: number;
      priceMember: number;
      providerTypeKey: string;
      providerProductName: string;
      productTypeId: string;
      name?: string;
      status: ProductSkuStatus;
      providerCatalogBrand?: string | null;
    } = {
      costPrice: input.item.costPrice,
      priceGuest: input.item.costPrice + existing.marginGuest,
      priceMember: input.item.costPrice + existing.marginMember,
      providerTypeKey: input.item.providerTypeKey,
      providerProductName: input.item.name,
      productTypeId: input.productTypeId,
      status: input.item.isAvailable ? ProductSkuStatus.AVAILABLE : ProductSkuStatus.UNAVAILABLE,
    };

    if (!existing.keepCustomName) {
      updateData.name = input.item.name;
    }

    if (catalogBrand && !existing.providerCatalogBrand?.trim()) {
      updateData.providerCatalogBrand = catalogBrand;
    }

    await prisma.productSku.update({
      where: { id: existing.id },
      data: updateData,
    });
    return "updated";
  }

  await prisma.productSku.create({
    data: {
      productId: input.productId,
      productTypeId: input.productTypeId,
      name: input.item.name,
      providerId: input.item.providerId,
      providerSku: input.item.sku,
      providerTypeKey: input.item.providerTypeKey,
      providerProductName: input.item.name,
      keepCustomName: false,
      costPrice: input.item.costPrice,
      marginGuest: input.marginGuest,
      marginMember: input.marginMember,
      cashbackPoin: input.cashbackPoin,
      priceGuest: input.item.costPrice + input.marginGuest,
      priceMember: input.item.costPrice + input.marginMember,
      status: input.item.isAvailable ? ProductSkuStatus.AVAILABLE : ProductSkuStatus.UNAVAILABLE,
      providerCatalogBrand: catalogBrand,
    },
  });
  return "created";
}

export async function syncSelectedCatalogItems(
  input: SyncSelectedCatalogInput,
): Promise<SyncProductSkusResult> {
  const result: SyncProductSkusResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  if (input.items.length === 0) {
    return { ...result, errors: ["Pilih minimal satu SKU."] };
  }

  const productTypeId = input.productTypeId.trim();
  if (!productTypeId) {
    return { ...result, errors: ["Pilih jenis produk terlebih dahulu."] };
  }

  const productType = await prisma.productType.findFirst({
    where: { id: productTypeId, productId: input.productId },
    select: { id: true },
  });
  if (!productType) {
    return { ...result, errors: ["Jenis produk tidak valid untuk produk ini."] };
  }

  for (const item of input.items) {
    try {
      const outcome = await upsertSelectedItem({
        productId: input.productId,
        item,
        productTypeId,
        marginGuest: input.marginGuest,
        marginMember: input.marginMember,
        cashbackPoin: input.cashbackPoin,
      });

      if (outcome === "created") result.created += 1;
      else result.updated += 1;
    } catch (error) {
      result.skipped += 1;
      result.errors.push(
        `${item.sku}: ${error instanceof Error ? error.message : "Gagal menyimpan SKU."}`,
      );
    }
  }

  return result;
}
