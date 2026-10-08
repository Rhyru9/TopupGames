import { ProductSkuStatus, ProductStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ActiveFlashSaleDeal = {
  itemId: string;
  flashSaleId: string;
  endsAt: Date;
  productId: string;
  productSlug: string;
  productName: string;
  /** Icon Jenis Produk saja (tanpa fallback thumbnail produk). */
  imageUrl: string;
  skuId: string;
  skuName: string;
  oldPrice: number;
  price: number;
  quota: number;
  soldCount: number;
  requiresLogin: boolean;
};

export type ActiveFlashSaleBundle = {
  campaignId: string;
  campaignName: string;
  headline: string;
  headlineAccent: string;
  tagline: string;
  endsAt: Date;
  deals: ActiveFlashSaleDeal[];
};

type CampaignWithItems = Awaited<
  ReturnType<
    typeof prisma.flashSale.findMany<{
      include: {
        items: {
          include: {
            productSku: {
              select: {
                id: true;
                name: true;
                priceGuest: true;
                priceMember: true;
                status: true;
                productType: { select: { iconUrl: true } };
                product: {
                  select: {
                    id: true;
                    slug: true;
                    name: true;
                    status: true;
                    requiresLogin: true;
                  };
                };
              };
            };
          };
        };
      };
    }>
  >
>[number];

function mapCampaignToBundle(
  campaign: CampaignWithItems,
  isMember: boolean,
): ActiveFlashSaleBundle | null {
  const deals: ActiveFlashSaleDeal[] = [];

  for (const item of campaign.items) {
    const sku = item.productSku;
    if (sku.status !== ProductSkuStatus.AVAILABLE) continue;
    if (sku.product.status !== ProductStatus.ACTIVE) continue;
    if (item.quota < 1 || item.soldCount >= item.quota) continue;

    deals.push({
      itemId: item.id,
      flashSaleId: campaign.id,
      endsAt: campaign.endsAt,
      productId: sku.product.id,
      productSlug: sku.product.slug,
      productName: sku.product.name,
      imageUrl: sku.productType?.iconUrl?.trim() ?? "",
      skuId: sku.id,
      skuName: sku.name,
      oldPrice: isMember ? sku.priceMember : sku.priceGuest,
      price: isMember ? item.priceMember : item.priceGuest,
      quota: item.quota,
      soldCount: item.soldCount,
      requiresLogin: sku.product.requiresLogin,
    });
  }

  if (deals.length === 0) return null;

  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    headline: campaign.headline.trim() || "HARGA SPESIAL",
    headlineAccent: campaign.headlineAccent.trim() || "WAKTU TERBATAS!",
    tagline: campaign.tagline.trim() || campaign.name,
    endsAt: campaign.endsAt,
    deals,
  };
}

async function fetchActiveCampaigns(now: Date) {
  return prisma.flashSale.findMany({
    where: {
      isEnabled: true,
      startsAt: { lte: now },
      endsAt: { gt: now },
    },
    orderBy: [{ sortOrder: "asc" }, { endsAt: "asc" }],
    include: {
      items: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          productSku: {
            select: {
              id: true,
              name: true,
              priceGuest: true,
              priceMember: true,
              status: true,
              productType: {
                select: { iconUrl: true },
              },
              product: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  status: true,
                  requiresLogin: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

/** Semua campaign enabled yang sedang berjalan dan punya deal valid. */
export async function getAllActiveFlashSaleBundles(
  now = new Date(),
  options?: { isMember?: boolean },
): Promise<ActiveFlashSaleBundle[]> {
  const isMember = Boolean(options?.isMember);
  const campaigns = await fetchActiveCampaigns(now);

  return campaigns
    .map((campaign) => mapCampaignToBundle(campaign, isMember))
    .filter((bundle): bundle is ActiveFlashSaleBundle => bundle !== null);
}

/** Campaign enabled yang sedang berjalan; primary = sortOrder terkecil, lalu endsAt terdekat. */
export async function getActiveFlashSaleBundle(
  now = new Date(),
  options?: { isMember?: boolean },
): Promise<ActiveFlashSaleBundle | null> {
  const bundles = await getAllActiveFlashSaleBundles(now, options);
  return bundles[0] ?? null;
}
