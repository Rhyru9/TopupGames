"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { FlashSaleCountdown } from "@/components/flash-sale/flash-sale-countdown";
import { FlashSaleDealCard } from "@/components/flash-sale/flash-sale-deal-card";

export type LandingFlashSaleDeal = {
  itemId: string;
  productSlug: string;
  productName: string;
  imageUrl: string;
  skuName: string;
  oldPrice: number;
  price: number;
  quota: number;
  soldCount: number;
  requiresLogin?: boolean;
};

export type LandingFlashSaleProps = {
  campaignName: string;
  headline: string;
  headlineAccent: string;
  tagline: string;
  endsAt: string;
  deals: LandingFlashSaleDeal[];
};

export function FlashSaleSection({
  flashSale,
  slidesPerView = { mobile: 1.8, tablet: 3.5, desktop: 5.1 },
}: {
  flashSale: LandingFlashSaleProps | null;
  slidesPerView?: { mobile: number; tablet: number; desktop: number };
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (!flashSale || flashSale.deals.length === 0) {
    return null;
  }

  function scrollBy(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".flash-neon-card");
    const step = card ? card.offsetWidth + 14 : Math.min(260, el.clientWidth * 0.7);
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  return (
    <section id="flash" className="flash-neon pt-6 md:pt-8">
      <div className="flash-neon__shell mx-auto max-w-[1400px] px-4">
        <aside className="flash-neon__hero">
          <div className="flash-neon__badge flash-neon-pulse">
            <LightningIcon className="h-3.5 w-3.5" />
            Flash Sale
          </div>

          <h2 className="flash-neon__title">
            <span className="flash-neon__title-line">{flashSale.headline}</span>
            <span className="flash-neon__title-accent">{flashSale.headlineAccent}</span>
          </h2>

          {flashSale.tagline ? (
            <p className="flash-neon__tagline">{flashSale.tagline}</p>
          ) : null}

          <FlashSaleCountdown endsAt={flashSale.endsAt} />

          <div className="flash-neon__hero-nav" aria-label="Geser paket flash">
            <NavBtn onClick={() => scrollBy(-1)} label="Geser kiri">
              ‹
            </NavBtn>
            <NavBtn onClick={() => scrollBy(1)} label="Geser kanan">
              ›
            </NavBtn>
          </div>
        </aside>

        <div className="flash-neon__rail min-w-0">
          <div
            ref={scrollerRef}
            className="flash-neon__track scrollbar-hide flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth"
            style={
              {
                "--flash-mobile": String(slidesPerView.mobile),
                "--flash-tablet": String(slidesPerView.tablet),
                "--flash-desktop": String(slidesPerView.desktop),
              } as CSSProperties
            }
          >
            {flashSale.deals.map((deal, index) => (
              <FlashSaleDealCard key={deal.itemId} deal={deal} index={index} layout="rail" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NavBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="flash-neon__nav" aria-label={label}>
      <span className="flash-neon__nav-face">{children}</span>
    </button>
  );
}

function LightningIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M13 2 4 14h7l-1 8 10-14h-7V2z" />
    </svg>
  );
}
