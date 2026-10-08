import {
  PromoVoucherRedemptionStatus,
  type Prisma,
} from "@/app/generated/prisma/client";
import { normalizeVoucherCode } from "@/lib/promo/voucher-shared";
import { buildVoucherUserKey } from "@/lib/promo/guest-voucher-key";
import { validatePromoVoucher } from "@/lib/promo/validate-promo-voucher";

type TxClient = Prisma.TransactionClient;

export async function reserveVoucherRedemptionInTx(
  tx: TxClient,
  input: {
    voucherCode: string;
    orderId: string;
    itemSubtotal: number;
    memberId?: string | null;
    email?: string;
    targetKey?: string | null;
    autoConfirm?: boolean;
    expectedDiscount: number;
  },
): Promise<{ discountAmount: number; voucherCode: string } | null> {
  const code = normalizeVoucherCode(input.voucherCode);
  if (!code) return null;

  // Serialize every reservation for this voucher before checking stock/user limits.
  // READ COMMITTED statements after this lock see the previous reservation's commit.
  await tx.$queryRaw`SELECT id FROM promo_vouchers WHERE code = ${code} FOR UPDATE`;
  const validated = await validatePromoVoucher({
    code,
    itemSubtotal: input.itemSubtotal,
    memberId: input.memberId,
    email: input.email,
    targetKey: input.targetKey,
  }, tx);
  if (!validated.ok) {
    throw new Error(validated.error);
  }

  if (validated.data.discountAmount !== input.expectedDiscount) {
    throw new Error("Voucher berubah. Muat ulang checkout.");
  }
  const voucher = validated.data.voucher;
  const claimed = await tx.promoVoucher.updateMany({
    where: {
      id: voucher.id,
      isEnabled: true,
      usedCount: { lt: tx.promoVoucher.fields.stock },
    },
    data: { usedCount: { increment: 1 } },
  });
  if (claimed.count === 0) {
    throw new Error("Kuota voucher sudah habis.");
  }

  const userKey = buildVoucherUserKey(input.email ?? "", input.targetKey ?? "");

  const now = new Date();
  await tx.promoVoucherRedemption.create({
    data: {
      voucherId: voucher.id,
      orderId: input.orderId,
      memberId: input.memberId ?? null,
      guestKey: userKey,
      discountAmount: validated.data.discountAmount,
      status: input.autoConfirm
        ? PromoVoucherRedemptionStatus.CONFIRMED
        : PromoVoucherRedemptionStatus.RESERVED,
      confirmedAt: input.autoConfirm ? now : null,
    },
  });

  return {
    discountAmount: validated.data.discountAmount,
    voucherCode: voucher.code,
  };
}

export async function confirmVoucherRedemptionInTx(
  tx: TxClient,
  orderId: string,
): Promise<void> {
  const redemption = await tx.promoVoucherRedemption.findUnique({
    where: { orderId },
    select: { id: true, status: true },
  });
  if (!redemption || redemption.status !== PromoVoucherRedemptionStatus.RESERVED) {
    return;
  }

  await tx.promoVoucherRedemption.updateMany({
    where: { id: redemption.id, status: PromoVoucherRedemptionStatus.RESERVED },
    data: {
      status: PromoVoucherRedemptionStatus.CONFIRMED,
      confirmedAt: new Date(),
    },
  });
}

export async function releaseVoucherRedemptionInTx(
  tx: TxClient,
  orderId: string,
): Promise<void> {
  const redemption = await tx.promoVoucherRedemption.findUnique({
    where: { orderId },
    select: { id: true, voucherId: true, status: true },
  });
  if (!redemption || redemption.status !== PromoVoucherRedemptionStatus.RESERVED) {
    return;
  }

  const released = await tx.promoVoucherRedemption.updateMany({
    where: { id: redemption.id, status: PromoVoucherRedemptionStatus.RESERVED },
    data: {
      status: PromoVoucherRedemptionStatus.RELEASED,
      releasedAt: new Date(),
    },
  });

  if (released.count !== 1) return;

  await tx.promoVoucher.updateMany({
    where: { id: redemption.voucherId, usedCount: { gt: 0 } },
    data: { usedCount: { decrement: 1 } },
  });
}
