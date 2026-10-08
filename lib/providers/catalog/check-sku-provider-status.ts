import { ProductSkuStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildFetchFiltersFromSkuBrand,
  resolveSkuCatalogBrand,
} from "@/lib/catalog-products/sku-catalog-brand";
import { asRecord } from "@/lib/providers/catalog/catalog-types";
import { fetchCatalogWithFilters } from "@/lib/providers/catalog/fetch-catalog-with-filters";
import { catalogBrandMatches, parseMelostoreFilters } from "@/lib/providers/catalog/match-catalog-item";
import { getFulfillmentProviderConfig } from "@/lib/providers/get-provider-config";

const CATALOG_CHECK_SLUGS = new Set(["digiflazz", "iak", "melostore"]);

export type CheckSkuProviderStatusResult =
  | {
      ok: true;
      code: "AVAILABLE" | "UNAVAILABLE";
      found: true;
      isAvailable: boolean;
      providerName: string;
      providerSlug: string;
      costPrice: number | null;
      localStatus: ProductSkuStatus;
      statusUpdated: boolean;
      message: string;
    }
  | {
      ok: false;
      code: "MANUAL" | "UNSUPPORTED" | "NOT_CONFIGURED" | "NOT_FOUND" | "ERROR" | "MISSING";
      found: false;
      isAvailable: null;
      providerName: string;
      providerSlug: string;
      localStatus: ProductSkuStatus | null;
      statusUpdated: false;
      message: string;
    };

export async function checkSkuProviderStatus(
  productSkuId: string,
): Promise<CheckSkuProviderStatusResult> {
  const sku = await prisma.productSku.findUnique({
    where: { id: productSkuId },
    select: {
      id: true,
      productId: true,
      providerSku: true,
      status: true,
      providerCatalogBrand: true,
      provider: { select: { id: true, slug: true, name: true, sandboxMode: true } },
    },
  });

  if (!sku) {
    return {
      ok: false,
      code: "MISSING",
      found: false,
      isAvailable: null,
      providerName: "",
      providerSlug: "",
      localStatus: null,
      statusUpdated: false,
      message: "SKU tidak ditemukan.",
    };
  }

  const providerSlug = sku.provider.slug;
  const providerName = sku.provider.name;

  if (providerSlug === "manual") {
    return {
      ok: false,
      code: "MANUAL",
      found: false,
      isAvailable: null,
      providerName,
      providerSlug,
      localStatus: sku.status,
      statusUpdated: false,
      message: "Provider Manual tidak punya cek status katalog.",
    };
  }

  if (!CATALOG_CHECK_SLUGS.has(providerSlug)) {
    return {
      ok: false,
      code: "UNSUPPORTED",
      found: false,
      isAvailable: null,
      providerName,
      providerSlug,
      localStatus: sku.status,
      statusUpdated: false,
      message: `Cek status belum didukung untuk provider ${providerName}.`,
    };
  }

  const runtime = await getFulfillmentProviderConfig(providerSlug);
  if (!runtime?.isConfigured) {
    return {
      ok: false,
      code: "NOT_CONFIGURED",
      found: false,
      isAvailable: null,
      providerName,
      providerSlug,
      localStatus: sku.status,
      statusUpdated: false,
      message: "Kredensial provider belum lengkap di Pengaturan Provider.",
    };
  }

  const productProvider = await prisma.productProvider.findUnique({
    where: {
      productId_providerId: {
        productId: sku.productId,
        providerId: sku.provider.id,
      },
    },
    select: { filters: true, isEnabled: true },
  });

  const productProviderFilters = productProvider?.filters ?? {};
  const resolvedBrand = resolveSkuCatalogBrand(
    providerSlug,
    sku.providerCatalogBrand,
    productProviderFilters,
  );

  if (providerSlug === "melostore") {
    const meloFilters = parseMelostoreFilters(productProviderFilters);
    if (!resolvedBrand && meloFilters.brandId === undefined) {
      return {
        ok: false,
        code: "ERROR",
        found: false,
        isAvailable: null,
        providerName,
        providerSlug,
        localStatus: sku.status,
        statusUpdated: false,
        message: "Brand belum diset. Atur di Edit SKU atau Edit massal.",
      };
    }
  }

  const filters = buildFetchFiltersFromSkuBrand(
    providerSlug,
    resolvedBrand,
    productProviderFilters,
  );

  try {
    const result = await fetchCatalogWithFilters({
      providerSlug,
      providerId: sku.provider.id,
      config: asRecord(runtime.config),
      apiUrl: runtime.apiUrl,
      sandboxMode: sku.provider.sandboxMode,
      filters,
      skipCache: true,
    });

    const skuKey = sku.providerSku.trim().toLowerCase();
    const candidates = result.items.filter((item) => item.sku.trim().toLowerCase() === skuKey);
    const match =
      providerSlug === "melostore" && resolvedBrand
        ? candidates.find((item) => catalogBrandMatches(item.brand, resolvedBrand))
        : candidates[0];

    if (!match) {
      return {
        ok: false,
        code: "NOT_FOUND",
        found: false,
        isAvailable: null,
        providerName,
        providerSlug,
        localStatus: sku.status,
        statusUpdated: false,
        message: resolvedBrand
          ? `Tidak ditemukan di katalog (brand: ${resolvedBrand}).`
          : "Tidak ditemukan di katalog.",
      };
    }

    const nextStatus = match.isAvailable
      ? ProductSkuStatus.AVAILABLE
      : ProductSkuStatus.UNAVAILABLE;

    let statusUpdated = false;
    if (sku.status !== nextStatus) {
      await prisma.productSku.update({
        where: { id: sku.id },
        data: { status: nextStatus },
      });
      statusUpdated = true;
    }

    return {
      ok: true,
      code: match.isAvailable ? "AVAILABLE" : "UNAVAILABLE",
      found: true,
      isAvailable: match.isAvailable,
      providerName,
      providerSlug,
      costPrice: match.costPrice,
      localStatus: nextStatus,
      statusUpdated,
      message: match.isAvailable
        ? `Provider: tersedia.${match.brand ? ` Match: ${match.name} (${match.brand}).` : ` Match: ${match.name}.`}`
        : `Provider: tidak tersedia / gangguan.${match.brand ? ` Match: ${match.name} (${match.brand}).` : ` Match: ${match.name}.`}`,
    };
  } catch (error) {
    return {
      ok: false,
      code: "ERROR",
      found: false,
      isAvailable: null,
      providerName,
      providerSlug,
      localStatus: sku.status,
      statusUpdated: false,
      message: error instanceof Error ? error.message : "Gagal mengambil katalog provider.",
    };
  }
}
