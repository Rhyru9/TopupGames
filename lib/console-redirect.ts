import { buildConsoleQuery, type ConsoleQueryRecord } from "@/lib/console-pagination";

export type ProductSkuListFilters = {
  q?: string;
  productId?: string;
  providerId?: string;
  status?: string;
  page?: string | number;
  pageSize?: string | number;
};

/** @deprecated Use ProductSkuListFilters */
export type ProductListFilters = ProductSkuListFilters;

export function buildProductsListUrl(filters: ProductSkuListFilters = {}) {
  const query = buildConsoleQuery(
    {
      q: filters.q,
      productId: filters.productId,
      providerId: filters.providerId,
      status: filters.status,
      page: filters.page ? String(filters.page) : undefined,
      pageSize: filters.pageSize ? String(filters.pageSize) : undefined,
    },
    {},
  );

  return `/console/product-skus${query}`;
}

export function parseProductListFilters(formData: FormData): ProductSkuListFilters {
  return {
    q: String(formData.get("listQ") ?? "").trim() || undefined,
    productId: String(formData.get("listProductId") ?? formData.get("listGameId") ?? "").trim() || undefined,
    providerId: String(formData.get("listProviderId") ?? "").trim() || undefined,
    status: String(formData.get("listStatus") ?? "").trim() || undefined,
    page: String(formData.get("listPage") ?? "").trim() || undefined,
    pageSize: String(formData.get("listPageSize") ?? "").trim() || undefined,
  };
}

export function filtersFromSearchParams(params: ConsoleQueryRecord): ProductSkuListFilters {
  const legacyProductId = params.gameId ?? params.productId;
  return {
    q: params.q ?? undefined,
    productId: legacyProductId ?? undefined,
    providerId: params.providerId ?? undefined,
    status: params.status ?? undefined,
    page: params.page ?? undefined,
    pageSize: params.pageSize ?? undefined,
  };
}
