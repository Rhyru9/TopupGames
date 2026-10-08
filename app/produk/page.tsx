import type { Metadata } from "next";
import { ProductsPageClient } from "@/components/catalog/products-page-client";
import { getLandingCatalog } from "@/lib/catalog-products/get-landing-catalog";
import { getActiveStorefrontPopup } from "@/lib/content/get-active-storefront-popup";
import { getMemberSession } from "@/lib/member-auth";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";

export const metadata: Metadata = {
  title: "Katalog Game — R9host",
  description: "Daftar lengkap game dan top-up yang tersedia di R9host.",
};

export default async function ProductsPage() {
  const [catalog, settings, session, popup] = await Promise.all([
    getLandingCatalog(),
    getSiteSettings(),
    getMemberSession(),
    getActiveStorefrontPopup(),
  ]);

  return (
    <ProductsPageClient
      catalog={catalog}
      style={settings.style.catalog}
      memberName={session?.user?.name ?? null}
      memberImage={session?.user?.image ?? null}
      popup={popup}
    />
  );
}
