import { ProductStatus } from "@/app/generated/prisma/client";
import {
  resolveGameInputFields,
  type GameInputFieldsConfig,
} from "@/lib/catalog-products/game-input-fields";
import { prisma } from "@/lib/prisma";

export type ProductOrderSku = {
  id: string;
  name: string;
  status: "AVAILABLE" | "UNAVAILABLE";
  productTypeId: string | null;
  productTypeName: string | null;
  productTypeIconUrl: string | null;
  price: number;
  originalPrice: number | null;
  flashPercentOff: number | null;
  note: string | null;
};

export type ProductOrderType = {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
};

export type ProductOrderPageData = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  thumbnailUrl: string;
  bannerUrl: string;
  categoryName: string;
  guideHtml: string | null;
  fieldHintHtml: string | null;
  nicknameCheckCode: string | null;
  requiresLogin: boolean;
  inputFields: GameInputFieldsConfig;
  types: ProductOrderType[];
  skus: ProductOrderSku[];
};

export async function getProductOrderPage(
  slug: string,
  options?: { isMember?: boolean; now?: Date },
): Promise<ProductOrderPageData | null> {
  const isMember = Boolean(options?.isMember);
  const now = options?.now ?? new Date();

  const product = await prisma.product.findFirst({
    where: { slug, status: ProductStatus.ACTIVE },
    include: {
      category: { select: { name: true } },
      types: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true, iconUrl: true },
      },
      skus: {
        orderBy: [
          { status: "asc" },
          { ...(isMember ? { priceMember: "asc" as const } : { priceGuest: "asc" as const }) },
          { name: "asc" },
        ],
        select: {
          id: true,
          name: true,
          status: true,
          productTypeId: true,
          priceGuest: true,
          priceMember: true,
          note: true,
          productType: {
            select: { id: true, name: true, iconUrl: true },
          },
        },
      },
    },
  });

  if (!product) return null;

  const skuIds = product.skus.map((sku) => sku.id);
  const flashBySkuId = new Map<string, { price: number; endsAt: Date }>();

  if (skuIds.length > 0) {
    const flashItems = await prisma.flashSaleItem.findMany({
      where: {
        productSkuId: { in: skuIds },
        quota: { gt: 0 },
        flashSale: {
          isEnabled: true,
          startsAt: { lte: now },
          endsAt: { gt: now },
        },
      },
      select: {
        productSkuId: true,
        priceGuest: true,
        priceMember: true,
        soldCount: true,
        quota: true,
        flashSale: { select: { endsAt: true, sortOrder: true } },
      },
      orderBy: [{ flashSale: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    });

    for (const item of flashItems) {
      if (item.soldCount >= item.quota) continue;
      if (flashBySkuId.has(item.productSkuId)) continue;
      flashBySkuId.set(item.productSkuId, {
        price: isMember ? item.priceMember : item.priceGuest,
        endsAt: item.flashSale.endsAt,
      });
    }
  }

  const skus: ProductOrderSku[] = product.skus.map((sku) => {
    const flash = flashBySkuId.get(sku.id);
    const originalPrice = isMember ? sku.priceMember : sku.priceGuest;
    const price = flash && flash.price < originalPrice ? flash.price : originalPrice;
    const hasFlash = flash != null && flash.price < originalPrice;
    const flashPercentOff = hasFlash
      ? Math.max(1, Math.round(((originalPrice - price) / originalPrice) * 100))
      : null;

    return {
      id: sku.id,
      name: sku.name,
      status: sku.status,
      productTypeId: sku.productTypeId,
      productTypeName: sku.productType?.name ?? null,
      productTypeIconUrl: sku.productType?.iconUrl?.trim() || null,
      price,
      originalPrice: hasFlash ? originalPrice : null,
      flashPercentOff,
      note: sku.note,
    };
  });

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    subtitle: product.subtitle,
    thumbnailUrl: product.thumbnailUrl,
    bannerUrl: product.bannerUrl,
    categoryName: product.category.name,
    guideHtml: product.guideHtml,
    fieldHintHtml: product.fieldHintHtml,
    nicknameCheckCode: product.nicknameCheckCode,
    requiresLogin: product.requiresLogin,
    inputFields: resolveGameInputFields(product.inputFields, product.requiresZone),
    types: product.types.map((type) => ({
      id: type.id,
      name: type.name,
      slug: type.slug,
      iconUrl: type.iconUrl?.trim() || null,
    })),
    skus,
  };
}
