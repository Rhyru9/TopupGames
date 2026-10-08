"use client";

import Link from "next/link";

import { formatSoldCount } from "@/lib/catalog-products/format-sold-count";
import { formatStartingPrice } from "@/lib/catalog-products/format-starting-price";
import { GameLogo } from "./game-logo";
import { PopularFlameIcon } from "./popular-flame-icon";

export type ProductGridCardProduct = {
  slug: string;
  name: string;
  thumbnailUrl: string;
  soldCount: number;
  startingPrice?: number | null;
};

export function ProductGridCard({
  product,
  index,
  showStartingPrice = false,
}: {
  product: ProductGridCardProduct;
  index: number;
  showStartingPrice?: boolean;
}) {
  const soldLabel = formatSoldCount(product.soldCount);
  const priceLabel =
    showStartingPrice && product.startingPrice != null
      ? formatStartingPrice(product.startingPrice)
      : null;

  return (
    <Link
      href={`/produk/${product.slug}`}
      className="product-tile group"
      title={product.name}
    >
      <div className="product-tile__art">
        <GameLogo
          game={{ name: product.name, logo: product.thumbnailUrl }}
          className="product-tile__img"
          priority={index < 4}
        />
        {soldLabel ? (
          <span className="product-tile__sold">
            <PopularFlameIcon />
            <span>{soldLabel}</span>
          </span>
        ) : null}
      </div>
      <div className="product-tile__body">
        <p className="product-tile__name">{product.name}</p>
        {priceLabel ? (
          <p className="product-tile__price">Mulai {priceLabel}</p>
        ) : null}
      </div>
    </Link>
  );
}
