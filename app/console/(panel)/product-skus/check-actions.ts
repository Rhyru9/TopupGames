"use server";

import {
  checkSkuProviderStatus,
  type CheckSkuProviderStatusResult,
} from "@/lib/providers/catalog/check-sku-provider-status";
import {
  syncSkuAvailability,
  type SyncSkuAvailabilityResult,
} from "@/lib/providers/catalog/sync-sku-availability";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type { CheckSkuProviderStatusResult, SyncSkuAvailabilityResult };

export type RunProductSkusAvailabilityCheckResult =
  | { ok: true; result: SyncSkuAvailabilityResult }
  | { ok: false; error: string };

const MAX_SKUS_PER_CHECK = 500;

export type SkuCheckScopeInput = {
  ids?: string[];
  productId?: string;
  providerId?: string;
  /** Cek semua SKU (dibatasi MAX_SKUS_PER_CHECK). */
  all?: boolean;
};

async function countSkusForScope(input: SkuCheckScopeInput): Promise<number> {
  if (input.all) {
    return prisma.productSku.count();
  }

  const ids = input.ids
    ? Array.from(new Set(input.ids.map((id) => String(id).trim()).filter(Boolean)))
    : undefined;

  return prisma.productSku.count({
    where: {
      ...(input.providerId?.trim() ? { providerId: input.providerId.trim() } : {}),
      ...(input.productId?.trim() ? { productId: input.productId.trim() } : {}),
      ...(ids?.length ? { id: { in: ids } } : {}),
    },
  });
}

function validateScope(input: SkuCheckScopeInput): string | null {
  const ids = input.ids
    ? Array.from(new Set(input.ids.map((id) => String(id).trim()).filter(Boolean)))
    : undefined;
  const productId = input.productId?.trim() || undefined;
  const providerId = input.providerId?.trim() || undefined;

  if (ids && ids.length === 0) {
    return "Tidak ada SKU yang dipilih.";
  }
  if (ids && ids.length > MAX_SKUS_PER_CHECK) {
    return `Maksimal ${MAX_SKUS_PER_CHECK} SKU per cek ketersediaan.`;
  }
  if (input.all) {
    return null;
  }
  if (!ids?.length && !productId && !providerId) {
    return "Pilih lingkup cek: produk, provider, atau SKU terpilih.";
  }
  if (productId && providerId) {
    return "Pilih salah satu: filter produk atau provider, tidak keduanya.";
  }
  return null;
}

export async function runProductSkusAvailabilityCheck(
  input: SkuCheckScopeInput = {},
): Promise<RunProductSkusAvailabilityCheckResult> {
  const scopeError = validateScope(input);
  if (scopeError) {
    return { ok: false, error: scopeError };
  }

  const ids = input.ids
    ? Array.from(new Set(input.ids.map((id) => String(id).trim()).filter(Boolean)))
    : undefined;

  if (!ids?.length) {
    const total = await countSkusForScope(input);
    if (total === 0) {
      return { ok: false, error: "Tidak ada SKU untuk lingkup yang dipilih." };
    }
    if (total > MAX_SKUS_PER_CHECK) {
      return {
        ok: false,
        error: `${total} SKU — terlalu banyak sekaligus. Maks ${MAX_SKUS_PER_CHECK} per cek; pilih produk/provider yang lebih spesifik.`,
      };
    }
  }

  try {
    const result = await syncSkuAvailability({
      productSkuIds: ids,
      productId: input.productId?.trim() || undefined,
      providerId: input.providerId?.trim() || undefined,
    });

    if (result.updated > 0) {
      revalidatePath("/console/product-skus");
      revalidatePath("/console/product-skus/check");
      revalidatePath("/console");
    }

    return { ok: true, result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal cek ketersediaan SKU.",
    };
  }
}

export async function checkProductSkuProviderStatus(
  productSkuId: string,
): Promise<CheckSkuProviderStatusResult> {
  const id = String(productSkuId ?? "").trim();
  if (!id) {
    return {
      ok: false,
      code: "MISSING",
      found: false,
      isAvailable: null,
      providerName: "",
      providerSlug: "",
      localStatus: null,
      statusUpdated: false,
      message: "SKU tidak valid.",
    };
  }

  const result = await checkSkuProviderStatus(id);

  if (result.statusUpdated) {
    revalidatePath("/console/product-skus");
    revalidatePath("/console");
  }

  return result;
}

export type SkuCheckScopeOption = {
  products: { id: string; name: string; skuCount: number }[];
  providers: { id: string; name: string; skuCount: number }[];
  totalSkuCount: number;
};

export async function getSkuCheckScopeOptions(): Promise<SkuCheckScopeOption> {
  const [products, providers, totalSkuCount] = await Promise.all([
    prisma.product.findMany({
      where: { skus: { some: {} } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { skus: true } },
      },
    }),
    prisma.fulfillmentProvider.findMany({
      where: { isActive: true, productSkus: { some: {} } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        _count: { select: { productSkus: true } },
      },
    }),
    prisma.productSku.count(),
  ]);

  return {
    products: products.map((row) => ({
      id: row.id,
      name: row.name,
      skuCount: row._count.skus,
    })),
    providers: providers.map((row) => ({
      id: row.id,
      name: row.name,
      skuCount: row._count.productSkus,
    })),
    totalSkuCount,
  };
}

export async function countSkusForCheckScope(input: SkuCheckScopeInput): Promise<number> {
  return countSkusForScope(input);
}
