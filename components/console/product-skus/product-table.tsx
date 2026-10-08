"use client";

import Link from "next/link";
import { buildProductsListUrl, type ProductSkuListFilters } from "@/lib/console-redirect";
import { formatRupiah } from "@/lib/format-rupiah";
import { productStatusLabel } from "@/lib/product-labels";
import { ProductProviderStatusCell } from "./product-provider-status-cell";
import { ProductRowActions } from "./product-row-actions";

import {
  catalogBrandFieldLabel,
  providerUsesCatalogBrand,
} from "@/lib/catalog-products/sku-catalog-brand";

function ProductSkuBrandCell({
  productSkuId,
  providerSlug,
  brand,
}: {
  productSkuId: string;
  providerSlug: string;
  brand?: string | null;
}) {
  if (!providerUsesCatalogBrand(providerSlug)) {
    return <span className="console-table__muted">—</span>;
  }

  if (brand) {
    return (
      <p className="console-table__brand-readonly" title={brand}>
        {brand}
      </p>
    );
  }

  return (
    <Link
      href={`/console/product-skus/${productSkuId}/edit`}
      className="console-badge console-badge--warning console-table__brand-missing"
      title={`${catalogBrandFieldLabel(providerSlug)} belum diset — atur di Edit SKU`}
    >
      Belum diset
    </Link>
  );
}

export type ProductSkuTableRow = {
  id: string;
  name: string;
  providerSku: string;
  costPrice: number;
  priceGuest: number;
  priceMember: number;
  cashbackPoin: number;
  status: "AVAILABLE" | "UNAVAILABLE" | string;
  productType: { name: string } | null;
  provider: { name: string; slug: string };
  product: { id: string; name: string };
  providerCatalogBrand?: string | null;
};

type ProductTableProps = {
  skus: ProductSkuTableRow[];
  hasFilters?: boolean;
  listFilters?: ProductSkuListFilters;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
};

export function ProductTable({
  skus,
  hasFilters = false,
  listFilters = {},
  selectable = false,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: ProductTableProps) {
  if (skus.length === 0) {
    return (
      <div className="console-empty">
        <div className="console-empty__icon" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M6 6h15l-1.5 9h-12z" />
            <circle cx="9" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
          </svg>
        </div>
        <p className="console-empty__title">
          {hasFilters ? "Tidak ada SKU yang cocok" : "Belum ada SKU"}
        </p>
        <p className="console-empty__text">
          {hasFilters
            ? "Coba ubah kata kunci pencarian atau reset filter."
            : "Tambahkan SKU untuk ditampilkan di storefront."}
        </p>
      </div>
    );
  }

  const allSelected =
    selectable && skus.length > 0 && skus.every((sku) => selectedIds?.has(sku.id));

  return (
    <div className="console-table-wrap">
      <table
        className={`console-table console-table--products${
          selectable ? " console-table--products-selectable" : ""
        }`}
      >
        <thead>
          <tr>
            {selectable ? (
              <th className="console-table__check-head" aria-label="Pilih">
                <input
                  type="checkbox"
                  className="console-checkbox"
                  checked={Boolean(allSelected)}
                  onChange={() => onToggleSelectAll?.()}
                  aria-label="Pilih semua di halaman"
                />
              </th>
            ) : null}
            <th className="console-table__name-head">SKU</th>
            <th>Produk</th>
            <th className="console-table__brand-head">Brand provider</th>
            <th>Jenis</th>
            <th>Provider / Kode</th>
            <th className="console-table__price-head">Modal</th>
            <th className="console-table__price-head">Harga Guest</th>
            <th className="console-table__price-head">Harga Member</th>
            <th className="console-table__count-head">Cashback</th>
            <th>Status</th>
            <th>Cek provider</th>
            <th className="console-table__actions-head">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {skus.map((sku) => {
            const isAvailable = sku.status === "AVAILABLE";
            const isSelected = Boolean(selectedIds?.has(sku.id));
            return (
              <tr key={sku.id} className={isSelected ? "console-table__row--selected" : undefined}>
                {selectable ? (
                  <td className="console-table__check-cell">
                    <input
                      type="checkbox"
                      className="console-checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect?.(sku.id)}
                      aria-label={`Pilih ${sku.name}`}
                    />
                  </td>
                ) : null}
                <td>
                  <p className="console-table__primary">{sku.name}</p>
                </td>
                <td>
                  <Link
                    href={buildProductsListUrl({
                      ...listFilters,
                      productId: sku.product.id,
                      page: 1,
                    })}
                    className="console-table__link console-table__cell-text"
                  >
                    {sku.product.name}
                  </Link>
                </td>
                <td className="console-table__brand-cell">
                  <ProductSkuBrandCell
                    productSkuId={sku.id}
                    providerSlug={sku.provider.slug}
                    brand={sku.providerCatalogBrand}
                  />
                </td>
                <td>
                  <p className="console-table__cell-text">
                    {sku.productType?.name ?? "—"}
                  </p>
                </td>
                <td>
                  <div className="console-table__cell-stack">
                    <p className="console-table__primary">{sku.provider.name}</p>
                    <code className="console-table__code">{sku.providerSku}</code>
                  </div>
                </td>
                <td className="console-table__price-cell">{formatRupiah(sku.costPrice)}</td>
                <td className="console-table__price-cell">{formatRupiah(sku.priceGuest)}</td>
                <td className="console-table__price-cell">{formatRupiah(sku.priceMember)}</td>
                <td className="console-table__count-cell">
                  {sku.cashbackPoin > 0 ? sku.cashbackPoin.toLocaleString("id-ID") : "—"}
                </td>
                <td>
                  <span
                    className={`console-badge ${
                      isAvailable ? "console-badge--success" : "console-badge--danger"
                    }`}
                  >
                    {productStatusLabel(sku.status)}
                  </span>
                </td>
                <td>
                  <ProductProviderStatusCell
                    productSkuId={sku.id}
                    providerSlug={sku.provider.slug}
                  />
                </td>
                <td className="console-table__actions-cell">
                  <ProductRowActions
                    productSkuId={sku.id}
                    skuName={sku.name}
                    isAvailable={isAvailable}
                    listFilters={listFilters}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
