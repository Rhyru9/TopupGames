import { LandingPage } from "@/components/landing/landing-page";
import { getLandingCatalog } from "@/lib/catalog-products/get-landing-catalog";
import { getPopularLandingProducts } from "@/lib/catalog-products/get-popular-landing-products";
import { getActiveLandingBanners } from "@/lib/content/get-active-landing-banners";
import { getActiveLandingTickers } from "@/lib/content/get-active-landing-tickers";
import { getActiveStorefrontPopup } from "@/lib/content/get-active-storefront-popup";
import { getMemberSession } from "@/lib/member-auth";
import { getActiveFlashSaleBundle } from "@/lib/promo/get-active-flash-sales";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { resolvePwaDisplaySettings } from "@/lib/site-settings/site-settings-schemas";

export default async function Home() {
  const memberSession = await getMemberSession();
  const isMember = Boolean(memberSession);

  const [flashSale, banners, tickers, popularProducts, catalog, settings, popup] =
    await Promise.all([
      getActiveFlashSaleBundle(new Date(), { isMember }),
      getActiveLandingBanners(),
      getActiveLandingTickers(),
      getPopularLandingProducts(),
      getLandingCatalog(),
      getSiteSettings(),
      getActiveStorefrontPopup(),
    ]);

  const pwa = resolvePwaDisplaySettings(settings);

  return (
    <LandingPage
      banners={banners}
      tickers={tickers}
      popularProducts={popularProducts}
      catalog={catalog}
      style={settings.style}
      pwaEnabled={pwa.enabled}
      pwaAppName={pwa.name}
      pwaIconUrl={pwa.iconUrl}
      memberName={memberSession?.user?.name ?? null}
      memberImage={memberSession?.user?.image ?? null}
      popup={popup}
      flashSale={
        flashSale
          ? {
              campaignName: flashSale.campaignName,
              headline: flashSale.headline,
              headlineAccent: flashSale.headlineAccent,
              tagline: flashSale.tagline,
              endsAt: flashSale.endsAt.toISOString(),
              deals: flashSale.deals.map((deal) => ({
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
            }
          : null
      }
    />
  );
}
