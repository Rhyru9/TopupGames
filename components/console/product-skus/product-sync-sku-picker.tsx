"use client";

import { useEffect, useMemo, useState } from "react";
import { ConsolePaginationClient } from "@/components/console/console-pagination-client";
import { ProductSyncEmptyState } from "@/components/console/product-skus/product-sync-empty-state";
import { DEFAULT_PAGE_SIZE } from "@/lib/console-pagination";
import {
  catalogItemKey,
  type CatalogItem,
} from "@/lib/providers/catalog/catalog-types";
import { formatRupiah } from "@/lib/format-rupiah";

/** @deprecated Prefer DEFAULT_PAGE_SIZE — kept for any external imports */
export const SYNC_SKU_PAGE_SIZE = DEFAULT_PAGE_SIZE;

type StatusFilter = "all" | "new" | "update";

type ProductSyncSkuPickerProps = {
  providerName: string;
  items: CatalogItem[];
  existingKeys: Set<string>;
  selectedKeys: Set<string>;
  searchQuery: string;
  statusFilter: StatusFilter;
  listPage: number;
  totalLoaded: number;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onListPageChange: (page: number) => void;
  onToggleItem: (item: CatalogItem, checked: boolean) => void;
  onTogglePage: (items: CatalogItem[], checked: boolean) => void;
};

export function ProductSyncSkuPicker({
  providerName,
  items,
  existingKeys,
  selectedKeys,
  searchQuery,
  statusFilter,
  listPage,
  totalLoaded,
  onSearchChange,
  onStatusFilterChange,
  onListPageChange,
  onToggleItem,
  onTogglePage,
}: ProductSyncSkuPickerProps) {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return items
      .filter((item) => {
        const key = catalogItemKey(item.providerId, item.sku);
        const isExisting = existingKeys.has(key);

        if (statusFilter === "new" && isExisting) return false;
        if (statusFilter === "update" && !isExisting) return false;

        if (!query) return true;

        return (
          item.sku.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          item.providerTypeKey.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.costPrice - b.costPrice || a.name.localeCompare(b.name));
  }, [items, searchQuery, statusFilter, existingKeys]);

  const paginatedItems = useMemo(() => {
    const start = (listPage - 1) * pageSize;
    return visibleItems.slice(start, start + pageSize);
  }, [visibleItems, listPage, pageSize]);

  const allPageSelected =
    paginatedItems.length > 0 &&
    paginatedItems.every((item) => selectedKeys.has(catalogItemKey(item.providerId, item.sku)));

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(visibleItems.length / pageSize));
    if (listPage > totalPages) {
      onListPageChange(totalPages);
    }
  }, [visibleItems.length, listPage, pageSize, onListPageChange]);

  return (
    <div className="console-provider-card">
      <div className="console-provider-card__head console-provider-card__head--split">
        <p className="console-provider-card__title">Daftar SKU · {providerName}</p>
        <label className="console-checkbox product-sync-picker__select-all">
          <input
            type="checkbox"
            checked={allPageSelected}
            onChange={(event) => onTogglePage(paginatedItems, event.target.checked)}
            disabled={paginatedItems.length === 0}
          />
          Pilih halaman ({paginatedItems.length})
        </label>
      </div>

      <div className="product-sync-toolbar">
        <input
          id="sync-search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="console-input product-sync-toolbar__search"
          placeholder="Cari SKU, nama, atau tipe..."
          aria-label="Cari SKU"
        />
        <div className="product-sync-toolbar__filters" role="group" aria-label="Filter status">
          {(
            [
              ["all", "Semua"],
              ["new", "Baru"],
              ["update", "Update"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={
                statusFilter === value
                  ? "product-sync-filter-chip product-sync-filter-chip--active"
                  : "product-sync-filter-chip"
              }
              onClick={() => onStatusFilterChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <ProductSyncEmptyState mode="no-search-results" totalLoaded={totalLoaded} />
      ) : (
        <>
          <div className="product-sync-sku-list">
            <div className="console-table-wrap product-sync-sku-list__table">
              <table className="console-table product-sync-picker__table">
                <thead>
                  <tr>
                    <th aria-label="Pilih" className="product-sync-table__check" />
                    <th>SKU</th>
                    <th>Nama</th>
                    <th>Tipe</th>
                    <th>Modal</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item) => {
                    const key = catalogItemKey(item.providerId, item.sku);
                    const isExisting = existingKeys.has(key);
                    const isSelected = selectedKeys.has(key);

                    return (
                      <tr
                        key={key}
                        className={isSelected ? "product-sync-table__row--selected" : undefined}
                      >
                        <td className="product-sync-table__check">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(event) => onToggleItem(item, event.target.checked)}
                            aria-label={`Pilih ${item.sku}`}
                          />
                        </td>
                        <td>
                          <code className="console-table__code">{item.sku}</code>
                        </td>
                        <td>{item.name}</td>
                        <td>{item.providerTypeKey || "Umum"}</td>
                        <td>{formatRupiah(item.costPrice)}</td>
                        <td>
                          {isExisting ? (
                            <span className="console-badge console-badge--success">Update</span>
                          ) : (
                            <span className="console-badge">Baru</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="product-sync-sku-list__cards">
              {paginatedItems.map((item) => {
                const key = catalogItemKey(item.providerId, item.sku);
                const isExisting = existingKeys.has(key);
                const isSelected = selectedKeys.has(key);

                return (
                  <label
                    key={key}
                    className={[
                      "product-sync-sku-card",
                      isSelected ? "product-sync-sku-card--selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(event) => onToggleItem(item, event.target.checked)}
                      aria-label={`Pilih ${item.sku}`}
                    />
                    <div className="product-sync-sku-card__body">
                      <div className="product-sync-sku-card__head">
                        <code className="console-table__code">{item.sku}</code>
                        {isExisting ? (
                          <span className="console-badge console-badge--success">Update</span>
                        ) : (
                          <span className="console-badge">Baru</span>
                        )}
                      </div>
                      <p className="product-sync-sku-card__name">{item.name}</p>
                      <div className="product-sync-sku-card__meta">
                        <span>{item.providerTypeKey || "Umum"}</span>
                        <span>{formatRupiah(item.costPrice)}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <ConsolePaginationClient
            page={listPage}
            pageSize={pageSize}
            total={visibleItems.length}
            onPageChange={onListPageChange}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              onListPageChange(1);
            }}
          />
        </>
      )}
    </div>
  );
}
