import { ProductSkuStatus } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getRunningFlashSale } from "@/lib/promo/flash-sale-data";
import {
  parseDatetimeLocal,
  type FlashSaleItemFormValue,
} from "@/lib/promo/flash-sale-shared";
import { flashSaleCreateBlockedToast } from "@/lib/promo/flash-sale-toasts";

export type FlashSaleFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type FlashSaleFormInput = {
  name: string;
  headline: string;
  headlineAccent: string;
  tagline: string;
  startsAt: Date;
  endsAt: Date;
  isEnabled: boolean;
  sortOrder: number;
  items: FlashSaleItemFormValue[];
};

export function parseFlashSaleForm(formData: FormData): {
  input?: FlashSaleFormInput;
  error?: FlashSaleFormState;
} {
  const name = String(formData.get("name") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const headlineAccent = String(formData.get("headlineAccent") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const startsAt = parseDatetimeLocal(String(formData.get("startsAt") ?? ""));
  const endsAt = parseDatetimeLocal(String(formData.get("endsAt") ?? ""));
  const isEnabled = formData.get("isEnabled") === "on" || formData.get("isEnabled") === "true";
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Nama wajib diisi.";
  if (headline.length > 60) fieldErrors.headline = "Judul baris 1 maksimal 60 karakter.";
  if (headlineAccent.length > 60) {
    fieldErrors.headlineAccent = "Judul baris 2 maksimal 60 karakter.";
  }
  if (tagline.length > 80) fieldErrors.tagline = "Teks landing maksimal 80 karakter.";
  if (!startsAt) fieldErrors.startsAt = "Waktu mulai wajib diisi.";
  if (!endsAt) fieldErrors.endsAt = "Waktu selesai wajib diisi.";
  if (startsAt && endsAt && endsAt <= startsAt) {
    fieldErrors.endsAt = "Waktu selesai harus setelah waktu mulai.";
  }
  if (!Number.isFinite(sortOrder)) fieldErrors.sortOrder = "Urutan tidak valid.";

  let items: FlashSaleItemFormValue[] = [];
  const rawItems = String(formData.get("itemsJson") ?? "").trim();
  if (rawItems) {
    try {
      const parsed = JSON.parse(rawItems) as unknown;
      if (!Array.isArray(parsed)) {
        fieldErrors.itemsJson = "Format daftar SKU tidak valid.";
      } else {
        items = parsed
          .map((entry, index) => {
            if (!entry || typeof entry !== "object") return null;
            const row = entry as Record<string, unknown>;
            const productSkuId = String(row.productSkuId ?? "").trim();
            const priceGuest = Number(row.priceGuest);
            const priceMember = Number(row.priceMember);
            const quota = Number(row.quota);
            const soldCount = Number(row.soldCount);
            const itemSort = Number(row.sortOrder ?? index);
            if (
              !productSkuId ||
              !Number.isFinite(priceGuest) ||
              !Number.isFinite(priceMember) ||
              !Number.isFinite(quota) ||
              !Number.isFinite(soldCount)
            ) {
              return null;
            }
            return {
              productSkuId,
              priceGuest: Math.round(priceGuest),
              priceMember: Math.round(priceMember),
              quota: Math.trunc(quota),
              soldCount: Math.trunc(soldCount),
              sortOrder: Number.isFinite(itemSort) ? Math.trunc(itemSort) : index,
            };
          })
          .filter((entry): entry is FlashSaleItemFormValue => entry !== null);
      }
    } catch {
      fieldErrors.itemsJson = "Format daftar SKU tidak valid.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: { fieldErrors } };
  }

  return {
    input: {
      name,
      headline,
      headlineAccent,
      tagline,
      startsAt: startsAt!,
      endsAt: endsAt!,
      isEnabled,
      sortOrder: Math.trunc(sortOrder),
      items,
    },
  };
}

export async function persistFlashSale(
  input: FlashSaleFormInput,
  flashSaleId?: string,
): Promise<FlashSaleFormState | null> {
  if (!flashSaleId) {
    const running = await getRunningFlashSale();
    if (running) {
      return {
        error: flashSaleCreateBlockedToast(running.name),
      };
    }
  }

  if (input.items.length === 0) {
    return { error: "Tambahkan minimal satu SKU ke flash sale." };
  }

  const skuIds = input.items.map((item) => item.productSkuId);
  if (new Set(skuIds).size !== skuIds.length) {
    return { error: "Ada SKU duplikat di daftar flash sale." };
  }

  const skus = await prisma.productSku.findMany({
    where: { id: { in: skuIds }, status: ProductSkuStatus.AVAILABLE },
    select: { id: true, name: true, priceGuest: true, priceMember: true },
  });

  if (skus.length !== skuIds.length) {
    return { error: "Beberapa SKU tidak ditemukan atau tidak tersedia." };
  }

  const skuMap = new Map(skus.map((sku) => [sku.id, sku]));

  for (const item of input.items) {
    const sku = skuMap.get(item.productSkuId);
    if (!sku) continue;
    if (item.priceGuest <= 0 || item.priceMember <= 0) {
      return { error: `Harga flash untuk "${sku.name}" harus lebih dari 0.` };
    }
    if (item.priceGuest >= sku.priceGuest) {
      return {
        error: `Harga flash guest "${sku.name}" harus lebih rendah dari harga normal (${sku.priceGuest}).`,
      };
    }
    if (item.priceMember >= sku.priceMember) {
      return {
        error: `Harga flash member "${sku.name}" harus lebih rendah dari harga normal (${sku.priceMember}).`,
      };
    }
    if (item.quota < 1) {
      return { error: `Kuota "${sku.name}" minimal 1.` };
    }
    if (item.soldCount < 0) {
      return { error: `Terjual "${sku.name}" tidak boleh negatif.` };
    }
    if (!flashSaleId && item.soldCount > item.quota) {
      return {
        error: `Terjual "${sku.name}" tidak boleh melebihi kuota (${item.quota}) agar masih ada sisa.`,
      };
    }
  }

  if (flashSaleId) {
    const existing = await prisma.flashSale.findUnique({ where: { id: flashSaleId } });
    if (!existing) return { error: "Flash sale tidak ditemukan." };

    try {
      await prisma.$transaction(async (tx) => {
        await tx.flashSale.update({
          where: { id: flashSaleId },
          data: {
            name: input.name,
            headline: input.headline,
            headlineAccent: input.headlineAccent,
            tagline: input.tagline,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            isEnabled: input.isEnabled,
            sortOrder: input.sortOrder,
          },
        });

        // Keep IDs and live reservations when editing a campaign.
        await tx.flashSaleItem.deleteMany({ where: { flashSaleId, productSkuId: { notIn: skuIds } } });
        for (const item of input.items) {
          const existingItem = await tx.flashSaleItem.findUnique({
            where: { flashSaleId_productSkuId: { flashSaleId, productSkuId: item.productSkuId } },
            select: { id: true },
          });
          if (existingItem) {
            const updated = await tx.flashSaleItem.updateMany({
              where: { id: existingItem.id, soldCount: { lte: item.quota } },
              data: { priceGuest: item.priceGuest, priceMember: item.priceMember, quota: item.quota, sortOrder: item.sortOrder },
            });
            if (updated.count !== 1) throw new Error("FLASH_QUOTA_TOO_LOW");
          } else {
            if (item.soldCount > item.quota) throw new Error("FLASH_QUOTA_TOO_LOW");
            await tx.flashSaleItem.create({ data: { ...item, flashSaleId } });
          }
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message === "FLASH_QUOTA_TOO_LOW") {
        return { error: "Kuota tidak boleh kurang dari reservasi checkout yang sudah berjalan. Muat ulang halaman." };
      }
      throw error;
    }

    return null;
  }

  await prisma.flashSale.create({
    data: {
      name: input.name,
      headline: input.headline,
      headlineAccent: input.headlineAccent,
      tagline: input.tagline,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      isEnabled: input.isEnabled,
      sortOrder: input.sortOrder,
      items: {
        create: input.items.map((item) => ({
          productSkuId: item.productSkuId,
          priceGuest: item.priceGuest,
          priceMember: item.priceMember,
          quota: item.quota,
          soldCount: item.soldCount,
          sortOrder: item.sortOrder,
        })),
      },
    },
  });

  return null;
}
