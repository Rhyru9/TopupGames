import { ProductSkuStatus, type Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildFetchFiltersFromSkuBrand,
  resolveSkuCatalogBrand,
} from "@/lib/catalog-products/sku-catalog-brand";
import {
  asRecord,
  type CatalogItem,
  type DigiflazzCatalogFilters,
  type IakCatalogFilters,
  type MelostoreCatalogFilters,
} from "@/lib/providers/catalog/catalog-types";
import { fetchCatalogWithFilters } from "@/lib/providers/catalog/fetch-catalog-with-filters";
import {
  catalogBrandMatches,
  parseMelostoreFilters,
} from "@/lib/providers/catalog/match-catalog-item";
import { getFulfillmentProviderConfig } from "@/lib/providers/get-provider-config";

export const CATALOG_AVAILABILITY_SLUGS = ["digiflazz", "iak", "melostore"] as const;

export type SkuAvailabilityCheckOutcome =
  | "available"
  | "unavailable"
  | "not_found"
  | "skipped_manual"
  | "skipped_unsupported"
  | "not_configured"
  | "fetch_error";

export type SkuAvailabilityCheckItem = {
  id: string;
  name: string;
  providerSku: string;
  productId: string;
  productName: string;
  providerName: string;
  providerSlug: string;
  localStatus: ProductSkuStatus;
  outcome: SkuAvailabilityCheckOutcome;
  statusUpdated: boolean;
  message: string;
  providerCatalogBrand?: string;
  catalogMatchName?: string;
  catalogMatchBrand?: string;
  catalogMatchStatus?: string;
};

export type SyncSkuAvailabilityResult = {
  total: number;
  checked: number;
  available: number;
  unavailable: number;
  updated: number;
  skippedNotFound: number;
  skippedManual: number;
  skippedUnsupported: number;
  errors: string[];
  items: SkuAvailabilityCheckItem[];
  message: string;
};

type SyncSkuAvailabilityInput = {
  providerId?: string;
  productId?: string;
  productSkuIds?: string[];
};

type SkuRow = {
  id: string;
  name: string;
  productId: string;
  providerSku: string;
  status: ProductSkuStatus;
  providerId: string;
  providerCatalogBrand: string | null;
  product: { id: string; name: string };
  provider: { id: string; slug: string; name: string; sandboxMode: boolean };
};

type PushItemExtras = {
  providerCatalogBrand?: string;
  catalogName?: string;
  catalogBrand?: string;
  catalogStatus?: string;
};

type PreparedSkuRow = SkuRow & {
  resolvedBrand?: string;
};

type FetchBatch = {
  providerSlug: string;
  providerName: string;
  providerId: string;
  sandboxMode: boolean;
  productId: string;
  productName: string;
  brandKey: string;
  resolvedBrand?: string;
  filters: DigiflazzCatalogFilters | MelostoreCatalogFilters | IakCatalogFilters;
  rows: PreparedSkuRow[];
};

function batchGroupKey(row: PreparedSkuRow) {
  const brandKey = (row.resolvedBrand ?? "").trim().toLowerCase() || "__empty__";
  return `${row.providerId}::${row.productId}::${brandKey}`;
}

function readCatalogItemStatus(item: CatalogItem): string {
  const raw = item.raw?.status;
  return raw === undefined || raw === null ? "" : String(raw).trim();
}

function findCatalogMatch(
  items: CatalogItem[],
  providerSku: string,
  providerSlug: string,
  brandFilter?: string,
): CatalogItem | undefined {
  const skuKey = providerSku.trim().toLowerCase();
  const matches = items.filter((item) => item.sku.trim().toLowerCase() === skuKey);

  if (matches.length === 0) return undefined;
  if (providerSlug !== "melostore" || !brandFilter) {
    return matches[0];
  }

  const brandMatch = matches.find((item) => catalogBrandMatches(item.brand, brandFilter));
  return brandMatch;
}

function formatCatalogMatchMessage(match: CatalogItem, isAvailable: boolean, statusUpdated: boolean) {
  const statusRaw = readCatalogItemStatus(match);
  const brandPart = match.brand ? ` · brand ${match.brand}` : "";
  const statusPart = statusRaw ? ` · status provider ${statusRaw}` : "";
  const catalogPart = `Cocok katalog: ${match.name} (${match.sku})${brandPart}${statusPart}`;

  if (isAvailable) {
    return statusUpdated
      ? `${catalogPart}. Tersedia — status toko diupdate.`
      : `${catalogPart}. Tersedia — status toko sudah sesuai.`;
  }

  return statusUpdated
    ? `${catalogPart}. Gangguan / tidak tersedia — status toko diupdate.`
    : `${catalogPart}. Gangguan / tidak tersedia — status toko sudah sesuai.`;
}

function pushItem(
  itemsById: Map<string, SkuAvailabilityCheckItem>,
  row: SkuRow,
  outcome: SkuAvailabilityCheckOutcome,
  message: string,
  statusUpdated = false,
  extras?: PushItemExtras,
) {
  itemsById.set(row.id, {
    id: row.id,
    name: row.name,
    providerSku: row.providerSku,
    productId: row.product.id,
    productName: row.product.name,
    providerName: row.provider.name,
    providerSlug: row.provider.slug,
    localStatus: row.status,
    outcome,
    statusUpdated,
    message,
    providerCatalogBrand: extras?.providerCatalogBrand,
    catalogMatchName: extras?.catalogName,
    catalogMatchBrand: extras?.catalogBrand,
    catalogMatchStatus: extras?.catalogStatus,
  });
}

export async function syncSkuAvailability(
  input: SyncSkuAvailabilityInput = {},
): Promise<SyncSkuAvailabilityResult> {
  const providerId = input.providerId?.trim() || undefined;
  const productId = input.productId?.trim() || undefined;
  const productSkuIds = input.productSkuIds
    ? Array.from(new Set(input.productSkuIds.map((id) => String(id).trim()).filter(Boolean)))
    : undefined;

  const where: Prisma.ProductSkuWhereInput = {
    ...(providerId ? { providerId } : {}),
    ...(productId ? { productId } : {}),
    ...(productSkuIds ? { id: { in: productSkuIds } } : {}),
  };

  const rows = await prisma.productSku.findMany({
    where,
    select: {
      id: true,
      name: true,
      productId: true,
      providerSku: true,
      status: true,
      providerId: true,
      providerCatalogBrand: true,
      product: { select: { id: true, name: true } },
      provider: { select: { id: true, slug: true, name: true, sandboxMode: true } },
    },
    orderBy: [{ product: { name: "asc" } }, { name: "asc" }, { id: "asc" }],
  });

  const itemsById = new Map<string, SkuAvailabilityCheckItem>();
  let skippedManual = 0;
  let skippedUnsupported = 0;
  const eligible: SkuRow[] = [];

  for (const row of rows) {
    if (row.provider.slug === "manual") {
      skippedManual += 1;
      pushItem(
        itemsById,
        row,
        "skipped_manual",
        "Provider Manual tidak punya cek katalog.",
      );
      continue;
    }
    if (!(CATALOG_AVAILABILITY_SLUGS as readonly string[]).includes(row.provider.slug)) {
      skippedUnsupported += 1;
      pushItem(
        itemsById,
        row,
        "skipped_unsupported",
        "Cek ketersediaan belum didukung untuk provider ini.",
      );
      continue;
    }
    eligible.push(row);
  }

  const productProviderCache = new Map<string, unknown>();
  async function getProductProviderFilters(productId: string, providerId: string) {
    const cacheKey = `${productId}::${providerId}`;
    if (productProviderCache.has(cacheKey)) {
      return productProviderCache.get(cacheKey);
    }
    const row = await prisma.productProvider.findUnique({
      where: { productId_providerId: { productId, providerId } },
      select: { filters: true },
    });
    const filters = row?.filters ?? {};
    productProviderCache.set(cacheKey, filters);
    return filters;
  }

  const batches = new Map<string, FetchBatch>();
  const configCache = new Map<string, Awaited<ReturnType<typeof getFulfillmentProviderConfig>>>();

  for (const row of eligible) {
    const providerSlug = row.provider.slug;
    const providerName = row.provider.name;
    const productProviderFilters = await getProductProviderFilters(row.productId, row.providerId);
    const resolvedBrand = resolveSkuCatalogBrand(
      providerSlug,
      row.providerCatalogBrand,
      productProviderFilters,
    );

    if (providerSlug === "melostore") {
      const meloFilters = parseMelostoreFilters(productProviderFilters);
      if (!resolvedBrand && meloFilters.brandId === undefined) {
        const errorMsg = `${providerName} / ${row.name}: brand belum diset. Atur di Edit SKU atau Edit massal.`;
        pushItem(itemsById, row, "fetch_error", errorMsg, false, {
          providerCatalogBrand: resolvedBrand,
        });
        continue;
      }
    }

    const prepared: PreparedSkuRow = { ...row, resolvedBrand };
    const key = batchGroupKey(prepared);
    const existing = batches.get(key);
    if (existing) {
      existing.rows.push(prepared);
      continue;
    }

    batches.set(key, {
      providerSlug,
      providerName,
      providerId: row.provider.id,
      sandboxMode: row.provider.sandboxMode,
      productId: row.productId,
      productName: row.product.name,
      brandKey: (resolvedBrand ?? "").trim().toLowerCase() || "__empty__",
      resolvedBrand,
      filters: buildFetchFiltersFromSkuBrand(providerSlug, resolvedBrand, productProviderFilters),
      rows: [prepared],
    });
  }

  let checked = 0;
  let available = 0;
  let unavailable = 0;
  let updated = 0;
  let skippedNotFound = 0;
  const errors: string[] = [];

  for (const batch of batches.values()) {
    let runtime = configCache.get(batch.providerSlug);
    if (runtime === undefined) {
      runtime = await getFulfillmentProviderConfig(batch.providerSlug);
      configCache.set(batch.providerSlug, runtime);
    }

    if (!runtime?.isConfigured) {
      const errorMsg = `${batch.providerName}: kredensial belum lengkap.`;
      errors.push(errorMsg);
      for (const row of batch.rows) {
        pushItem(itemsById, row, "not_configured", errorMsg, false, {
          providerCatalogBrand: row.resolvedBrand,
        });
      }
      continue;
    }

    let catalogItems: CatalogItem[];
    try {
      const result = await fetchCatalogWithFilters({
        providerSlug: batch.providerSlug,
        providerId: batch.providerId,
        config: asRecord(runtime.config),
        apiUrl: runtime.apiUrl,
        sandboxMode: batch.sandboxMode,
        filters: batch.filters,
        skipCache: true,
      });
      catalogItems = result.items;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Gagal mengambil katalog.";
      const errorMsg = `${batch.providerName} / ${batch.productName}: ${msg}`;
      errors.push(errorMsg);
      for (const row of batch.rows) {
        pushItem(itemsById, row, "fetch_error", errorMsg, false, {
          providerCatalogBrand: row.resolvedBrand,
        });
      }
      continue;
    }

    const updates: { id: string; status: ProductSkuStatus }[] = [];
    const melostoreBrandFilter =
      batch.providerSlug === "melostore" ? batch.resolvedBrand : undefined;

    for (const row of batch.rows) {
      const match = findCatalogMatch(
        catalogItems,
        row.providerSku,
        batch.providerSlug,
        melostoreBrandFilter,
      );

      if (!match) {
        skippedNotFound += 1;
        const brandHint = row.resolvedBrand ? ` Brand: ${row.resolvedBrand}.` : "";
        pushItem(
          itemsById,
          row,
          "not_found",
          `Kode SKU tidak ketemu di katalog provider.${brandHint} Cek kode providerSku atau brand SKU.`,
          false,
          { providerCatalogBrand: row.resolvedBrand },
        );
        continue;
      }

      const isAvailable = match.isAvailable;
      checked += 1;
      if (isAvailable) available += 1;
      else unavailable += 1;

      const nextStatus = isAvailable
        ? ProductSkuStatus.AVAILABLE
        : ProductSkuStatus.UNAVAILABLE;
      const statusUpdated = row.status !== nextStatus;

      if (statusUpdated) {
        updates.push({ id: row.id, status: nextStatus });
      }

      const catalogStatus = readCatalogItemStatus(match);
      pushItem(
        itemsById,
        row,
        isAvailable ? "available" : "unavailable",
        formatCatalogMatchMessage(match, isAvailable, statusUpdated),
        statusUpdated,
        {
          providerCatalogBrand: row.resolvedBrand,
          catalogName: match.name,
          catalogBrand: match.brand,
          catalogStatus: catalogStatus || undefined,
        },
      );
    }

    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map((item) =>
          prisma.productSku.update({
            where: { id: item.id },
            data: { status: item.status },
          }),
        ),
      );
      updated += updates.length;
    }
  }

  const items = rows
    .map((row) => itemsById.get(row.id))
    .filter((item): item is SkuAvailabilityCheckItem => Boolean(item));

  const base = {
    total: rows.length,
    checked,
    available,
    unavailable,
    updated,
    skippedNotFound,
    skippedManual,
    skippedUnsupported,
    errors,
    items,
  };

  const message = [
    `Total ${base.total} SKU`,
    base.checked > 0
      ? `${base.checked} ketemu (${base.available} tersedia, ${base.unavailable} gangguan)`
      : null,
    base.skippedNotFound > 0 ? `${base.skippedNotFound} tidak ketemu di katalog` : null,
    base.updated > 0 ? `${base.updated} status diubah otomatis` : null,
    base.skippedManual > 0 ? `${base.skippedManual} manual dilewati` : null,
    base.skippedUnsupported > 0 ? `${base.skippedUnsupported} provider tidak didukung` : null,
    base.errors.length > 0 ? `${base.errors.length} error fetch` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return { ...base, message };
}
