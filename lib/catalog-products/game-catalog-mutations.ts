import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import type {
  ProductProviderCatalogInput,
  ProductTypeInput,
} from "@/lib/catalog-products/game-catalog-schemas";

export type GameCatalogActionState = {
  error?: string;
  success?: string;
  productSyncPreview?: import("@/lib/providers/catalog/product-sync-preview").ProductSyncPreview;
  existingSkuKeys?: string[];
  syncResult?: import("@/lib/providers/catalog/catalog-types").SyncProductSkusResult;
};

export async function upsertProductProviderCatalog(input: ProductProviderCatalogInput) {
  return prisma.productProvider.upsert({
    where: {
      productId_providerId: {
        productId: input.productId,
        providerId: input.providerId,
      },
    },
    create: {
      productId: input.productId,
      providerId: input.providerId,
      isEnabled: input.isEnabled,
      filters: input.filters as Prisma.InputJsonValue,
    },
    update: {
      isEnabled: input.isEnabled,
      filters: input.filters as Prisma.InputJsonValue,
    },
  });
}

/** @deprecated Use upsertProductProviderCatalog */
export const upsertGameProviderCatalog = upsertProductProviderCatalog;

export async function createProductType(input: ProductTypeInput) {
  const slug = slugify(input.slug || input.name);
  const sortOrder =
    input.sortOrder ??
    ((await prisma.productType.aggregate({
      where: { productId: input.productId },
      _max: { sortOrder: true },
    }))._max.sortOrder ?? -1) + 1;

  return prisma.productType.create({
    data: {
      productId: input.productId,
      name: input.name.trim(),
      slug,
      sortOrder,
      iconUrl: input.iconUrl?.trim() || null,
    },
  });
}

export async function updateProductType(
  productTypeId: string,
  input: Pick<ProductTypeInput, "name" | "slug" | "iconUrl">,
) {
  const slug = slugify(input.slug || input.name);
  return prisma.productType.update({
    where: { id: productTypeId },
    data: {
      name: input.name.trim(),
      slug,
      iconUrl: input.iconUrl?.trim() || null,
    },
  });
}

export async function deleteProductType(productTypeId: string) {
  await prisma.productSku.updateMany({
    where: { productTypeId },
    data: { productTypeId: null },
  });
  await prisma.productType.delete({ where: { id: productTypeId } });
}
