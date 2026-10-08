"use client";

import Link from "next/link";
import Image from "next/image";

import { useState } from "react";
import type { LandingFlashSaleDeal } from "@/components/landing/flash-sale-section";

function formatRp(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function discountPercent(oldPrice: number, price: number) {
  if (oldPrice <= 0 || price >= oldPrice) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function FlashDealThumb({ name, imageUrl }: { name: string; imageUrl: string }) {
  const [failed, setFailed] = useState(!imageUrl);

  if (failed) {
    return (
      <span className="flex h-[80%] w-[80%] max-h-36 max-w-36 items-center justify-center font-display text-3xl font-extrabold text-neon/80">
        {initialsOf(name)}
      </span>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={name}
      width={160}
      height={160}
      unoptimized
      className="h-[82%] w-[82%] max-h-36 max-w-36 object-contain drop-shadow-[0_0_22px_rgba(255,122,26,0.5)] sm:max-h-40 sm:max-w-40"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

export function FlashSaleDealCard({
  deal,
  index = 0,
  layout = "rail",
}: {
  deal: LandingFlashSaleDeal;
  index?: number;
  layout?: "rail" | "grid";
}) {
  const pct = discountPercent(deal.oldPrice, deal.price);
  const remaining = Math.max(0, deal.quota - deal.soldCount);
  const soldPct = Math.min(100, Math.max(0, (deal.soldCount / Math.max(1, deal.quota)) * 100));

  return (
    <Link
      href={`/produk/${deal.productSlug}`}
      className={`flash-neon-card flash-card-in group flex flex-col${
        layout === "grid" ? " flash-neon-card--grid" : " shrink-0 snap-start"
      }`}
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
      title={`${deal.productName} — ${deal.skuName}`}
    >
      <div className="flash-neon-card__inner flex flex-1 flex-col">
        <div className="flash-neon-card__media relative aspect-square overflow-hidden">
          <div className="flash-neon-card__glow" aria-hidden />
          <span className="flash-neon-badge flash-neon-badge--sale flash-fire">
            <span className="flash-fire__flame" aria-hidden />
            Hot
          </span>
          {pct > 0 ? (
            <span className="flash-neon-badge flash-neon-badge--pct">-{pct}%</span>
          ) : null}
          <div className="relative z-[1] flex h-full items-center justify-center p-3">
            <FlashDealThumb name={deal.skuName} imageUrl={deal.imageUrl} />
          </div>
        </div>

        <div className="flash-neon-card__body flex flex-1 flex-col">
          <p className="flash-neon-card__product truncate">{deal.productName}</p>
          <p className="flash-neon-card__sku truncate">{deal.skuName}</p>

          <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-2">
            <p className="flash-neon-price font-display text-[13px] font-extrabold leading-none text-neon sm:text-sm">
              {formatRp(deal.price)}
            </p>
            <p className="text-[10px] leading-none text-chrome-dim line-through sm:text-[11px]">
              {formatRp(deal.oldPrice)}
            </p>
          </div>

          <div className="mt-2.5">
            <div className="mb-1 flex items-center justify-between gap-1 text-[11px] font-semibold tracking-tight text-chrome-dim">
              <span className="min-w-0 truncate">
                {deal.soldCount}/{deal.quota}
              </span>
              <span className="shrink-0 text-neon">Sisa {remaining}</span>
            </div>
            <div className="flash-neon-card__bar-track">
              <div className="flash-neon-bar h-full bg-neon" style={{ width: `${soldPct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
