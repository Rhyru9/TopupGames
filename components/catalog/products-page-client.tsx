"use client";

import Link from "next/link";
import { Header } from "@/components/landing/header";
import { StorefrontPageShell } from "@/components/landing/storefront-page-shell";
import { StorefrontPopup } from "@/components/landing/storefront-popup";
import { CatalogProductGrid } from "@/components/catalog/catalog-product-grid";
import type { LandingCatalog } from "@/lib/catalog-products/get-landing-catalog";
import type { StorefrontPopupData } from "@/lib/content/popup-form";
import type { SiteStyleSettings } from "@/lib/site-settings/site-settings-schemas";

type ProductsPageClientProps = {
  catalog: LandingCatalog;
  style: SiteStyleSettings["catalog"];
  memberName?: string | null;
  memberImage?: string | null;
  popup?: StorefrontPopupData | null;
};

export function ProductsPageClient({
  catalog,
  style,
  memberName = null,
  memberImage = null,
  popup = null,
}: ProductsPageClientProps) {
  const hasProducts = catalog.products.length > 0;

  return (
    <StorefrontPageShell>
      <div className="storefront-page products-page">
        <Header
          homeHref="/"
          navPrefix="/"
          forceSolid
          hideSearch={false}
          memberName={memberName}
          memberImage={memberImage}
        />

        <div className="storefront-page__inner products-page__inner">
          <p className="storefront-page__eyebrow">Katalog game</p>
          <h1 className="storefront-page__title">
            Pilih produk
            <span className="storefront-page__title-accent">favoritmu</span>
          </h1>

          {hasProducts ? (
            <div className="products-page__catalog">
              <CatalogProductGrid
                catalog={catalog}
                style={style}
                mode="full"
                showHeader={false}
                showStartingPrice={false}
              />
            </div>
          ) : (
            <div className="storefront-page__empty">
              <h2 className="storefront-page__empty-title">Belum ada produk aktif</h2>
              <p className="storefront-page__empty-text">
                Katalog akan muncul di sini begitu admin menambahkan game.
              </p>
              <Link href="/" className="storefront-page__cta">
                Kembali ke beranda
              </Link>
            </div>
          )}
        </div>
      </div>
      <StorefrontPopup popup={popup} />
    </StorefrontPageShell>
  );
}
