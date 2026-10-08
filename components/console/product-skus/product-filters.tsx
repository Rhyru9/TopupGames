"use client";

import { buildProductsListUrl } from "@/lib/console-redirect";
import type { FulfillmentProviderOption } from "@/lib/fulfillment-providers";
import type { ProductOption } from "@/lib/catalog-products/game-options";
import { productStatusOptions } from "@/lib/product-labels";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ConsoleListToolbar } from "@/components/console/console-list-toolbar";

export type ProductFilterValues = {
  q?: string;
  productId?: string;
  providerId?: string;
  status?: string;
};

type ProductFiltersProps = {
  products: ProductOption[];
  providers: FulfillmentProviderOption[];
  values: ProductFilterValues;
  pageSize?: number;
};

const SEARCH_DEBOUNCE_MS = 350;

export function ProductFilters({ products, providers, values, pageSize }: ProductFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [q, setQ] = useState(values.q ?? "");
  const [draftProductId, setDraftProductId] = useState(values.productId ?? "");
  const [draftProviderId, setDraftProviderId] = useState(values.providerId ?? "");
  const [draftStatus, setDraftStatus] = useState(values.status ?? "");

  useEffect(() => {
    setQ(values.q ?? "");
    setDraftProductId(values.productId ?? "");
    setDraftProviderId(values.providerId ?? "");
    setDraftStatus(values.status ?? "");
  }, [values.q, values.productId, values.providerId, values.status]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function navigate(next: ProductFilterValues) {
    startTransition(() => {
      router.push(
        buildProductsListUrl({
          q: (next.q ?? q)?.trim() || undefined,
          productId:
            next.productId !== undefined
              ? next.productId || undefined
              : values.productId || undefined,
          providerId:
            next.providerId !== undefined
              ? next.providerId || undefined
              : values.providerId || undefined,
          status:
            next.status !== undefined ? next.status || undefined : values.status || undefined,
          page: 1,
          pageSize,
        }),
      );
    });
  }

  const productValue = values.productId ?? "";
  const providerValue = values.providerId ?? "";
  const statusValue = values.status ?? "";

  return (
    <ConsoleListToolbar
      pending={isPending}
      searchPlaceholder="Cari nama atau SKU..."
      searchAriaLabel="Cari SKU"
      searchValue={q}
      onSearchChange={(value) => {
        setQ(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          navigate({ q: value });
        }, SEARCH_DEBOUNCE_MS);
      }}
      filterActive={Boolean(values.productId || values.providerId || values.status)}
      mobileTitle="Filter SKU"
      desktopFilters={
        <>
          <select
            value={productValue}
            onChange={(e) => navigate({ productId: e.target.value })}
            className="console-input console-list-filter-bar__select"
            aria-label="Filter produk"
          >
            <option value="">Semua produk</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <select
            value={providerValue}
            onChange={(e) => navigate({ providerId: e.target.value })}
            className="console-input console-list-filter-bar__select"
            aria-label="Filter provider"
          >
            <option value="">Semua provider</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
          <select
            value={statusValue}
            onChange={(e) => navigate({ status: e.target.value })}
            className="console-input console-list-filter-bar__select"
            aria-label="Filter status"
          >
            <option value="">Semua status</option>
            {productStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </>
      }
      mobileFilterFields={
        <>
          <label className="console-report-filter-bar__field">
            <span>Produk</span>
            <select
              value={draftProductId}
              onChange={(e) => setDraftProductId(e.target.value)}
              className="console-input"
            >
              <option value="">Semua</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <label className="console-report-filter-bar__field">
            <span>Provider</span>
            <select
              value={draftProviderId}
              onChange={(e) => setDraftProviderId(e.target.value)}
              className="console-input"
            >
              <option value="">Semua</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </label>
          <label className="console-report-filter-bar__field">
            <span>Status</span>
            <select
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
              className="console-input"
            >
              <option value="">Semua</option>
              {productStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </>
      }
      onMobileApply={() =>
        navigate({
          productId: draftProductId,
          providerId: draftProviderId,
          status: draftStatus,
        })
      }
      onMobileReset={() => {
        setDraftProductId("");
        setDraftProviderId("");
        setDraftStatus("");
        navigate({ productId: "", providerId: "", status: "" });
      }}
    />
  );
}
