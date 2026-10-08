"use client";

import Link from "next/link";

import { CatalogProductGrid } from "@/components/catalog/catalog-product-grid";
import { PopularFlameIcon } from "@/components/catalog/popular-flame-icon";
import { ProductGridCard } from "@/components/catalog/product-grid-card";
import { StorefrontPageShell } from "./storefront-page-shell";
import { Header } from "./header";
import { BannerSlider, type BannerSliderSlide } from "./banner-slider";
import {
  FlashSaleSection,
  type LandingFlashSaleProps,
} from "./flash-sale-section";
import type { LandingCatalog } from "@/lib/catalog-products/get-landing-catalog";
import { gridColsClass } from "@/lib/site-settings/grid-cols-class";
import {
  defaultSiteStyle,
  type SiteStyleSettings,
} from "@/lib/site-settings/site-settings-schemas";
import { PwaInstallPrompt } from "@/components/pwa/pwa-install-prompt";
import { StorefrontPopup } from "@/components/landing/storefront-popup";
import type { StorefrontPopupData } from "@/lib/content/popup-form";

export type { LandingFlashSaleDeal, LandingFlashSaleProps } from "./flash-sale-section";

export type LandingTickerSlide = {
  id: string;
  label: string;
  detail: string;
  href: string;
};

export type LandingPopularProduct = {
  id: string;
  slug: string;
  name: string;
  thumbnailUrl: string;
  soldCount: number;
  requiresLogin?: boolean;
};

type LandingPageProps = {
  banners?: BannerSliderSlide[];
  tickers?: LandingTickerSlide[];
  popularProducts?: LandingPopularProduct[];
  catalog?: LandingCatalog;
  flashSale?: LandingFlashSaleProps | null;
  style?: SiteStyleSettings;
  pwaEnabled?: boolean;
  pwaAppName?: string;
  pwaIconUrl?: string;
  memberName?: string | null;
  memberImage?: string | null;
  popup?: StorefrontPopupData | null;
};

export function LandingPage({
  banners = [],
  tickers = [],
  popularProducts = [],
  catalog = { categories: [], products: [] },
  flashSale = null,
  style = defaultSiteStyle,
  pwaEnabled = false,
  pwaAppName,
  pwaIconUrl,
  memberName = null,
  memberImage = null,
  popup = null,
}: LandingPageProps) {
  return (
    <StorefrontPageShell>
      <div id="page-top" className="pointer-events-none absolute top-0 left-0 h-3 w-px" />
      <Header memberName={memberName} memberImage={memberImage} />

      <main className="relative isolate overflow-x-clip pt-[6.25rem]">
        <BannerSlider slides={banners} />
        <Ticker items={tickers} />
        <FlashSaleSection flashSale={flashSale} slidesPerView={style.flashSale.slidesPerView} />
        <Popular products={popularProducts} style={style.popular} />
        <CatalogProductGrid
          catalog={catalog}
          style={style.catalog}
          mode="preview"
          sectionId="katalog"
        />
      </main>
      <PwaInstallPrompt enabled={pwaEnabled} appName={pwaAppName} iconUrl={pwaIconUrl} />
      <StorefrontPopup popup={popup} />
    </StorefrontPageShell>
  );
}

function Ticker({ items }: { items: LandingTickerSlide[] }) {
  if (items.length === 0) return null;

  const loop = [...items, ...items];
  return (
    <div className="relative mt-6 overflow-hidden border-y border-line bg-steel md:mt-8">
      <div className="animate-marquee flex w-max gap-10 py-3">
        {loop.map((item, i) => {
          const content = (
            <>
              <span className="mr-10 text-neon">◆</span>
              <span className="text-neon">{item.label}</span>
              <span className="mx-3 text-line">/</span>
              <span className="text-chrome-dim">{item.detail}</span>
            </>
          );

          const className =
            "flex items-center text-[13px] font-semibold tracking-tight";

          if (item.href) {
            return (
              <Link key={`${item.id}-${i}`} href={item.href} className={className}>
                {content}
              </Link>
            );
          }

          return (
            <span key={`${item.id}-${i}`} className={className}>
              {content}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Popular({
  products,
  style,
}: {
  products: LandingPopularProduct[];
  style: SiteStyleSettings["popular"];
}) {
  if (products.length === 0) return null;

  return (
    <section id="popular" className="popular-neon mx-auto max-w-[1400px] px-4 pt-10 md:pt-12">
      <div className="popular-neon__head mb-5 md:mb-6">
        <div className="popular-neon__brand">
          <span className="popular-neon__flame" aria-hidden>
            <span className="popular-neon__flame-core" />
            <PopularFlameIcon />
          </span>
          <div className="popular-neon__copy">
            <p className="popular-neon__eyebrow">
              <span className="popular-neon__eyebrow-line" aria-hidden />
              Paling ramai
              <span className="popular-neon__eyebrow-line" aria-hidden />
            </p>
            <h2 className="popular-neon__title font-display text-2xl font-extrabold tracking-tight text-chrome sm:text-3xl md:text-4xl">
              Top <span className="text-neon">populer</span>
            </h2>
          </div>
        </div>
      </div>

      <div className={`popular-neon__grid ${gridColsClass(style.columns, style.gap)}`}>
        {products.map((product, index) => (
          <ProductGridCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </section>
  );
}
