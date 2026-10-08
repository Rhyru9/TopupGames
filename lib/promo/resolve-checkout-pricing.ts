import {
  ProductSkuStatus,
  ProductStatus,
} from "@/app/generated/prisma/client";
import { validatePromoVoucher } from "@/lib/promo/validate-promo-voucher";
import { buildVoucherTargetKey } from "@/lib/promo/guest-voucher-key";
import { normalizeVoucherCode } from "@/lib/promo/voucher-shared";
import { prisma } from "@/lib/prisma";

export type ResolvedCheckoutPricing = {
  productName: string;
  skuName: string;
  requiresLogin: boolean;
  itemSubtotal: number;
  voucherCode: string | null;
  voucherDiscount: number;
  priceSnapshot: number;
  voucherId: string | null;
  flashSaleItemId: string | null;
};

export async function resolveFlashPricing(options: {
  productSkuId: string;
  priceGuest: number;
  priceMember: number;
  isMember: boolean;
  now?: Date;
}): Promise<{ itemSubtotal: number; flashSaleItemId: string | null }> {
  const now = options.now ?? new Date();
  const flash = await prisma.flashSaleItem.findFirst({
    where: {
      productSkuId: options.productSkuId,
      quota: { gt: 0 },
      flashSale: {
        isEnabled: true,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
    },
    orderBy: [{ flashSale: { sortOrder: "asc" } }, { id: "asc" }],
    select: {
      id: true,
      priceGuest: true,
      priceMember: true,
      soldCount: true,
      quota: true,
    },
  });

  const base = options.isMember ? options.priceMember : options.priceGuest;
  if (!flash || flash.soldCount >= flash.quota) return { itemSubtotal: base, flashSaleItemId: null };
  const flashPrice = options.isMember ? flash.priceMember : flash.priceGuest;
  return { itemSubtotal: Math.min(flashPrice, base), flashSaleItemId: flashPrice < base ? flash.id : null };
}

export async function resolveFlashItemSubtotal(options: Parameters<typeof resolveFlashPricing>[0]): Promise<number> {
  return (await resolveFlashPricing(options)).itemSubtotal;
}

export async function resolveCheckoutPricing(input: {
  productId: string;
  productSkuId: string;
  isMember: boolean;
  voucherCode?: string | null;
  memberId?: string | null;
  email?: string;
  accountValues?: Record<string, string>;
}): Promise<
  | { ok: true; data: ResolvedCheckoutPricing }
  | { ok: false; error: string }
> {
  const product = await prisma.product.findFirst({
    where: { id: input.productId, status: ProductStatus.ACTIVE },
    select: {
      id: true,
      name: true,
      requiresLogin: true,
      inputFields: true,
      requiresZone: true,
    },
  });
  if (!product) return { ok: false, error: "Produk tidak ditemukan atau nonaktif." };

  const sku = await prisma.productSku.findFirst({
    where: {
      id: input.productSkuId,
      productId: product.id,
      status: ProductSkuStatus.AVAILABLE,
    },
    select: {
      id: true,
      name: true,
      priceGuest: true,
      priceMember: true,
    },
  });
  if (!sku) return { ok: false, error: "Nominal tidak tersedia." };

  const { itemSubtotal, flashSaleItemId } = await resolveFlashPricing({
    productSkuId: sku.id,
    priceGuest: sku.priceGuest,
    priceMember: sku.priceMember,
    isMember: input.isMember,
  });

  const voucherCodeRaw = input.voucherCode?.trim() ?? "";
  if (!voucherCodeRaw) {
    if (itemSubtotal < 1 && itemSubtotal !== 0) {
      return { ok: false, error: "Harga produk tidak valid." };
    }
    return {
      ok: true,
      data: {
        productName: product.name,
        skuName: sku.name,
        requiresLogin: product.requiresLogin,
        itemSubtotal,
        voucherCode: null,
        voucherDiscount: 0,
        priceSnapshot: itemSubtotal,
        voucherId: null,
        flashSaleItemId,
      },
    };
  }

  const validated = await validatePromoVoucher({
    code: voucherCodeRaw,
    itemSubtotal,
    memberId: input.memberId,
    email: input.email,
    targetKey: input.accountValues
      ? buildVoucherTargetKey(
          input.accountValues,
          product.inputFields,
          product.requiresZone,
        )
      : null,
  });
  if (!validated.ok) return validated;

  return {
    ok: true,
    data: {
      productName: product.name,
      skuName: sku.name,
      requiresLogin: product.requiresLogin,
      itemSubtotal,
      voucherCode: normalizeVoucherCode(voucherCodeRaw),
      voucherDiscount: validated.data.discountAmount,
      priceSnapshot: validated.data.payableItem,
      voucherId: validated.data.voucher.id,
      flashSaleItemId,
    },
  };
}
