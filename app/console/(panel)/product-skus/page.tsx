import { ConsolePageHeader, type ConsolePageHeaderAction } from "@/components/console/console-page-header";
import { ConsolePagination } from "@/components/console/console-pagination";
import { ProductFilters } from "@/components/console/product-skus/product-filters";
import { ProductSkusBulkPanel } from "@/components/console/product-skus/product-skus-bulk-panel";
import { filtersFromSearchParams } from "@/lib/console-redirect";
import {
  getActiveFulfillmentProviders,
  getConfiguredSyncProviders,
} from "@/lib/fulfillment-providers";
import { getProductOptionsForSku } from "@/lib/catalog-products/game-options";
import { parsePagination } from "@/lib/console-pagination";
import { prisma } from "@/lib/prisma";
import { ProductSkuStatus } from "@/app/generated/prisma/client";
import type { Prisma } from "@/app/generated/prisma/client";

type NominalPageProps = {
  searchParams: Promise<{
    q?: string;
    productId?: string;
    gameId?: string;
    providerId?: string;
    status?: string;
    page?: string;
    pageSize?: string;
  }>;
};

function buildNominalWhere(filters: ReturnType<typeof filtersFromSearchParams>): Prisma.ProductSkuWhereInput {
  const q = filters.q?.trim();
  const status =
    filters.status && Object.values(ProductSkuStatus).includes(filters.status as ProductSkuStatus)
      ? (filters.status as ProductSkuStatus)
      : undefined;

  return {
    ...(filters.productId ? { productId: filters.productId } : {}),
    ...(filters.providerId ? { providerId: filters.providerId } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [{ name: { contains: q } }, { providerSku: { contains: q } }],
        }
      : {}),
  };
}

export default async function NominalPage({ searchParams }: NominalPageProps) {
  const params = await searchParams;
  const filters = filtersFromSearchParams(params);
  const { page, pageSize, skip } = parsePagination(params);
  const where = buildNominalWhere(filters);
  const hasFilters = Boolean(filters.q || filters.productId || filters.providerId || filters.status);

  const [nominals, total, products, providers, syncProviders] = await Promise.all([
    prisma.productSku.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ costPrice: "asc" }, { name: "asc" }, { id: "asc" }],
      include: {
        product: { select: { id: true, name: true } },
        provider: { select: { name: true, slug: true } },
        productType: { select: { name: true } },
      },
    }),
    prisma.productSku.count({ where }),
    getProductOptionsForSku(),
    getActiveFulfillmentProviders(),
    getConfiguredSyncProviders(),
  ]);

  const newSkuHref = filters.productId
    ? `/console/product-skus/new?productId=${filters.productId}`
    : "/console/product-skus/new";

  const syncHref = filters.productId
    ? `/console/product-skus/sync?productId=${encodeURIComponent(filters.productId)}`
    : "/console/product-skus/sync";

  const headerActions: ConsolePageHeaderAction[] = [
    ...(syncProviders.length > 0
      ? [{ href: syncHref, label: "Sync SKU", variant: "secondary" as const }]
      : []),
    { href: newSkuHref, label: "+ Tambah SKU", variant: "primary" },
  ];

  return (
    <div className="console-page">
      <ConsolePageHeader
        eyebrow="Produk"
        title="SKU Produk"
        description="Kelola SKU produk, harga, cashback, brand provider, dan status. Cek ketersediaan lewat tombol di bawah."
        actions={headerActions}
      />

      <div className="console-panel console-list-panel">
        <ProductFilters
          products={products}
          providers={providers}
          values={filters}
          pageSize={pageSize}
        />
        <ProductSkusBulkPanel
          skus={nominals}
          hasFilters={hasFilters}
          listFilters={filters}
          providerName={
            filters.providerId
              ? providers.find((p) => p.id === filters.providerId)?.name
              : undefined
          }
        />
        <ConsolePagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/console/product-skus"
          query={{
            q: filters.q,
            productId: filters.productId,
            providerId: filters.providerId,
            status: filters.status,
            pageSize: filters.pageSize ? String(filters.pageSize) : undefined,
          }}
        />
      </div>
    </div>
  );
}
