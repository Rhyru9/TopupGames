"use client";

import Link from "next/link";
import { Header } from "@/components/landing/header";
import { StorefrontPageShell } from "@/components/landing/storefront-page-shell";
import type { LandingFlashSaleProps } from "@/components/landing/flash-sale-section";
import { FlashSaleCountdown } from "./flash-sale-countdown";
import { FlashSaleDealCard } from "./flash-sale-deal-card";

type FlashSalePageClientProps = {
  campaigns: LandingFlashSaleProps[];
  memberName?: string | null;
  memberImage?: string | null;
};

function LightningIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M13 2 4 14h7l-1 8 10-14h-7V2z" />
    </svg>
  );
}

export function FlashSalePageClient({
  campaigns,
  memberName = null,
  memberImage = null,
}: FlashSalePageClientProps) {
  return (
    <StorefrontPageShell>
      <div className="storefront-page flash-sale-page">
        <Header
          homeHref="/"
          navPrefix="/"
          forceSolid
          hideSearch={false}
          memberName={memberName}
          memberImage={memberImage}
        />

        <div className="storefront-page__inner flash-sale-page__inner">
          <p className="storefront-page__eyebrow">Promo terbatas</p>
          <h1 className="storefront-page__title">
            Flash sale
            <span className="storefront-page__title-accent">aktif sekarang</span>
          </h1>

          {campaigns.length > 0 ? (
            <div className="flash-sale-page__campaigns">
              {campaigns.map((campaign) => (
                <section key={campaign.campaignName + campaign.endsAt} className="flash-sale-page__campaign">
                  <div className="flash-sale-page__campaign-head">
                    <div>
                      <div className="flash-sale-page__badge">
                        <LightningIcon className="h-3.5 w-3.5" />
                        {campaign.campaignName}
                      </div>
                      <h2 className="flash-sale-page__campaign-title">
                        <span>{campaign.headline}</span>
                        <span className="flash-sale-page__campaign-accent">{campaign.headlineAccent}</span>
                      </h2>
                      {campaign.tagline ? (
                        <p className="flash-sale-page__campaign-tagline">{campaign.tagline}</p>
                      ) : null}
                    </div>
                    <FlashSaleCountdown endsAt={campaign.endsAt} variant="hero" />
                  </div>

                  <div className="flash-sale-page__grid">
                    {campaign.deals.map((deal, index) => (
                      <FlashSaleDealCard key={deal.itemId} deal={deal} index={index} layout="grid" />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="storefront-page__empty">
              <h2 className="storefront-page__empty-title">Belum ada flash sale aktif</h2>
              <p className="storefront-page__empty-text">
                Cek lagi nanti — promo flash sale baru akan muncul di halaman ini.
              </p>
              <Link href="/produk" className="storefront-page__cta">
                Lihat katalog game
              </Link>
            </div>
          )}

          {campaigns.length > 0 ? (
            <div className="storefront-page__footer-cta">
              <Link href="/produk" className="storefront-page__cta storefront-page__cta--ghost">
                Lihat semua produk
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </StorefrontPageShell>
  );
}
