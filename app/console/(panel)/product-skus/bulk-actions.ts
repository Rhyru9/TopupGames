"use server";

import { assertConsoleAdminAction } from "@/lib/admin/require-console-admin";
import { prisma } from "@/lib/prisma";
import {
  syncSkuAvailability,
  type SkuAvailabilityCheckItem,
  type SyncSkuAvailabilityResult,
} from "@/lib/providers/catalog/sync-sku-availability";
import { revalidatePath } from "next/cache";

export type BulkUpdateProductSkusResult =
  | { ok: true; updated: number; message: string }
  | { ok: false; error: string };

function parseOptionalInt(raw: unknown): number | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const n = Number(text);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export async function bulkUpdateProductSkus(input: {
  ids: string[];
  marginGuest?: string | number | null;
  marginMember?: string | number | null;
  cashbackPoin?: string | number | null;
  providerCatalogBrand?: string | null;
}): Promise<BulkUpdateProductSkusResult> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { ok: false, error: gate.error };

  const ids = Array.from(
    new Set((input.ids ?? []).map((id) => String(id).trim()).filter(Boolean)),
  );
  if (ids.length === 0) {
    return { ok: false, error: "Pilih minimal satu SKU." };
  }
  if (ids.length > 500) {
    return { ok: false, error: "Maksimal 500 SKU per edit massal." };
  }

  const marginGuest = parseOptionalInt(input.marginGuest);
  const marginMember = parseOptionalInt(input.marginMember);
  const cashbackPoin = parseOptionalInt(input.cashbackPoin);
  const brandRaw = input.providerCatalogBrand;
  const brandProvided = brandRaw !== undefined && brandRaw !== null && String(brandRaw).trim() !== "";
  const providerCatalogBrand = brandProvided ? String(brandRaw).trim() : null;

  if (marginGuest === null && marginMember === null && cashbackPoin === null && !brandProvided) {
    return { ok: false, error: "Isi minimal satu field: margin, cashback poin, atau brand provider." };
  }
  if (marginGuest !== null && marginGuest < 0) {
    return { ok: false, error: "Margin guest tidak boleh negatif." };
  }
  if (marginMember !== null && marginMember < 0) {
    return { ok: false, error: "Margin member tidak boleh negatif." };
  }
  if (cashbackPoin !== null && cashbackPoin < 0) {
    return { ok: false, error: "Cashback poin tidak boleh negatif." };
  }

  const skus = await prisma.productSku.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      costPrice: true,
      marginGuest: true,
      marginMember: true,
      cashbackPoin: true,
      provider: { select: { slug: true } },
    },
  });

  if (skus.length === 0) {
    return { ok: false, error: "Tidak ada SKU yang cocok." };
  }

  if (brandProvided) {
    const catalogSlugs = new Set(["melostore", "digiflazz", "iak"]);
    const selectedSlugs = new Set(
      skus.map((sku) => sku.provider.slug).filter((slug) => catalogSlugs.has(slug)),
    );
    if (selectedSlugs.size !== 1) {
      return {
        ok: false,
        error:
          "Brand massal hanya bisa jika semua SKU terpilih dari provider yang sama (Melostore, Digiflazz, atau IAK).",
      };
    }
  }

  await prisma.$transaction(
    skus.map((sku) => {
      const nextMarginGuest = marginGuest ?? sku.marginGuest;
      const nextMarginMember = marginMember ?? sku.marginMember;
      const nextCashback = cashbackPoin ?? sku.cashbackPoin;
      return prisma.productSku.update({
        where: { id: sku.id },
        data: {
          marginGuest: nextMarginGuest,
          marginMember: nextMarginMember,
          cashbackPoin: nextCashback,
          priceGuest: sku.costPrice + nextMarginGuest,
          priceMember: sku.costPrice + nextMarginMember,
          ...(brandProvided ? { providerCatalogBrand } : {}),
        },
      });
    }),
  );

  revalidatePath("/console/product-skus");
  revalidatePath("/console");

  return {
    ok: true,
    updated: skus.length,
    message: `${skus.length} SKU berhasil diperbarui (harga = modal + margin).`,
  };
}

export type BulkCheckProviderStatusResult = {
  total: number;
  checked: number;
  available: number;
  unavailable: number;
  failed: number;
  statusUpdated: number;
  message: string;
  items: SkuAvailabilityCheckItem[];
};

export async function bulkCheckProductSkuProviderStatus(input: {
  ids: string[];
}): Promise<BulkCheckProviderStatusResult | { ok: false; error: string }> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { ok: false, error: gate.error };

  const ids = Array.from(
    new Set((input.ids ?? []).map((id) => String(id).trim()).filter(Boolean)),
  );
  if (ids.length === 0) {
    return { ok: false, error: "Pilih minimal satu SKU." };
  }
  if (ids.length > 500) {
    return { ok: false, error: "Maksimal 500 SKU per cek massal." };
  }

  const result = await syncSkuAvailability({ productSkuIds: ids });

  if (result.updated > 0) {
    revalidatePath("/console/product-skus");
    revalidatePath("/console");
  }

  return {
    total: result.total,
    checked: result.checked,
    available: result.available,
    unavailable: result.unavailable,
    failed: result.errors.length + result.skippedUnsupported,
    statusUpdated: result.updated,
    message: result.message,
    items: result.items,
  };
}

export type BulkDeleteProductSkusResult =
  | { ok: true; deleted: number; message: string }
  | { ok: false; error: string };

export async function bulkDeleteProductSkus(input: {
  ids: string[];
}): Promise<BulkDeleteProductSkusResult> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { ok: false, error: gate.error };

  const ids = Array.from(
    new Set((input.ids ?? []).map((id) => String(id).trim()).filter(Boolean)),
  );
  if (ids.length === 0) {
    return { ok: false, error: "Pilih minimal satu SKU." };
  }
  if (ids.length > 500) {
    return { ok: false, error: "Maksimal 500 SKU per hapus massal." };
  }

  try {
    const result = await prisma.productSku.deleteMany({
      where: { id: { in: ids } },
    });

    revalidatePath("/console/product-skus");
    revalidatePath("/console/produk");
    revalidatePath("/console");

    return {
      ok: true,
      deleted: result.count,
      message: `${result.count} SKU berhasil dihapus.`,
    };
  } catch {
    return {
      ok: false,
      error:
        "Gagal menghapus. Beberapa SKU masih terhubung ke order — hapus yang belum pernah dipesan, atau nonaktifkan saja.",
    };
  }
}

export async function runSkuAvailabilitySyncAction(): Promise<
  | { ok: true; message: string; result: SyncSkuAvailabilityResult }
  | { ok: false; error: string }
> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return { ok: false, error: gate.error };

  try {
    const result = await syncSkuAvailability();
    if (result.updated > 0) {
      revalidatePath("/console/product-skus");
      revalidatePath("/console");
    }
    return { ok: true, message: result.message, result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal sync ketersediaan SKU.",
    };
  }
}
