import { prisma } from "@/lib/prisma";
import { upsertProductProviderCatalog } from "@/lib/catalog-products/game-catalog-mutations";
import { getFulfillmentProviderConfig } from "@/lib/providers/get-provider-config";
import {
  asRecord,
  type CatalogItem,
  type DigiflazzCatalogFilters,
  type IakCatalogFilters,
  type MelostoreCatalogFilters,
} from "@/lib/providers/catalog/catalog-types";
import { fetchCatalogWithFilters } from "@/lib/providers/catalog/fetch-catalog-with-filters";
import {
  parseDigiflazzFilters,
  parseMelostoreFilters,
} from "@/lib/providers/catalog/match-catalog-item";

export type ProductSyncProviderInput = {
  providerId: string;
  providerSlug: string;
  filters: DigiflazzCatalogFilters | MelostoreCatalogFilters | IakCatalogFilters;
};

export type ProductSyncPreviewItem = CatalogItem;

export type ProductSyncPreviewProvider = {
  providerId: string;
  providerSlug: string;
  providerName: string;
  totalFetched: number;
  items: ProductSyncPreviewItem[];
  appliedFilters?: Record<string, string | number | undefined>;
  pagesFetched?: number;
  error?: string;
};

export type ProductSyncPreview = {
  productId: string;
  providers: ProductSyncPreviewProvider[];
};

export type SavedProviderFilters = {
  providerId: string;
  providerSlug: string;
  filters: DigiflazzCatalogFilters | MelostoreCatalogFilters | IakCatalogFilters;
};

export async function getSavedProviderFilters(productId: string): Promise<SavedProviderFilters[]> {
  const rows = await prisma.productProvider.findMany({
    where: { productId, isEnabled: true },
    include: { provider: true },
  });

  return rows.map((row) => ({
    providerId: row.providerId,
    providerSlug: row.provider.slug,
    filters: row.filters as DigiflazzCatalogFilters | MelostoreCatalogFilters | IakCatalogFilters,
  }));
}

export async function previewProductSync(input: {
  productId: string;
  providers: ProductSyncProviderInput[];
  persistFilters?: boolean;
}): Promise<ProductSyncPreview | null> {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) return null;

  const providerPreviews: ProductSyncPreviewProvider[] = [];

  for (const providerInput of input.providers) {
    const provider = await prisma.fulfillmentProvider.findUnique({
      where: { id: providerInput.providerId },
    });

    const base: ProductSyncPreviewProvider = {
      providerId: providerInput.providerId,
      providerSlug: providerInput.providerSlug,
      providerName: provider?.name ?? providerInput.providerSlug,
      totalFetched: 0,
      items: [],
    };

    if (!provider) {
      base.error = "Provider tidak ditemukan.";
      providerPreviews.push(base);
      continue;
    }

    const runtime = await getFulfillmentProviderConfig(provider.slug);
    if (!runtime?.isConfigured) {
      base.error = "Kredensial provider belum lengkap di Pengaturan Provider.";
      providerPreviews.push(base);
      continue;
    }

    try {
      const result = await fetchCatalogWithFilters({
        providerSlug: provider.slug,
        providerId: provider.id,
        config: asRecord(runtime.config),
        apiUrl: runtime.apiUrl,
        sandboxMode: provider.sandboxMode,
        filters: providerInput.filters,
      });

      let filtersToPersist = providerInput.filters;
      if (provider.slug === "melostore" && result.meta.resolvedBrandId !== undefined) {
        filtersToPersist = {
          ...parseMelostoreFilters(providerInput.filters),
          brandId: result.meta.resolvedBrandId,
        };
      } else if (provider.slug === "digiflazz" && result.meta.appliedFilters?.brand) {
        filtersToPersist = {
          ...parseDigiflazzFilters(providerInput.filters),
          brand: String(result.meta.appliedFilters.brand),
        };
      }

      if (input.persistFilters) {
        await upsertProductProviderCatalog({
          productId: input.productId,
          providerId: providerInput.providerId,
          isEnabled: true,
          filters: filtersToPersist,
        });
      }

      const availableItems = result.items
        .filter((item) => item.isAvailable)
        .sort((a, b) => a.costPrice - b.costPrice || a.name.localeCompare(b.name));
      base.totalFetched = availableItems.length;
      base.items = availableItems;
      base.appliedFilters = result.meta.appliedFilters;
      base.pagesFetched = result.meta.pagesFetched;
      providerPreviews.push(base);
    } catch (error) {
      base.error = error instanceof Error ? error.message : "Gagal mengambil katalog provider.";
      providerPreviews.push(base);
    }
  }

  return { productId: input.productId, providers: providerPreviews };
}
