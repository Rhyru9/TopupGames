import type { Metadata } from "next";
import { FlashSalePageClient } from "@/components/flash-sale/flash-sale-page-client";
import { getMemberSession } from "@/lib/member-auth";
import { getAllActiveFlashSaleBundles } from "@/lib/promo/get-active-flash-sales";

export const metadata: Metadata = {
  title: "Flash Sale — R9host",
  description: "Daftar lengkap flash sale aktif dan harga spesial di R9host.",
};

export default async function FlashSalePage() {
  const session = await getMemberSession();
  const isMember = Boolean(session);
  const bundles = await getAllActiveFlashSaleBundles(new Date(), { isMember });

  const campaigns = bundles.map((bundle) => ({
    campaignName: bundle.campaignName,
    headline: bundle.headline,
    headlineAccent: bundle.headlineAccent,
    tagline: bundle.tagline,
    endsAt: bundle.endsAt.toISOString(),
    deals: bundle.deals.map((deal) => ({
      itemId: deal.itemId,
      productSlug: deal.productSlug,
      productName: deal.productName,
      imageUrl: deal.imageUrl,
      skuName: deal.skuName,
      oldPrice: deal.oldPrice,
      price: deal.price,
      quota: deal.quota,
      soldCount: deal.soldCount,
      requiresLogin: deal.requiresLogin,
    })),
  }));

  return (
    <FlashSalePageClient
      campaigns={campaigns}
      memberName={session?.user?.name ?? null}
      memberImage={session?.user?.image ?? null}
    />
  );
}
