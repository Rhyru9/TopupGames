import {
  PromoVoucherDiscountType,
  PromoVoucherRedemptionStatus,
  PromoVoucherType,
  type PromoVoucher,
  type Prisma,
} from "@/app/generated/prisma/client";
import { buildVoucherUserKey } from "@/lib/promo/guest-voucher-key";
import { normalizeVoucherCode } from "@/lib/promo/voucher-shared";
import { prisma } from "@/lib/prisma";

export type ValidatedPromoVoucher = {
  voucher: PromoVoucher;
  discountAmount: number;
  payableItem: number;
};

export type ValidatePromoVoucherInput = {
  code: string;
  itemSubtotal: number;
  memberId?: string | null;
  email?: string;
  /** Akun game / tujuan top-up (hasil buildCustomerNo). */
  targetKey?: string | null;
  /** Skip per-user check for preview-only (still validates code/stock/min). */
  skipPerUserCheck?: boolean;
};

function isWithinSchedule(
  voucher: Pick<PromoVoucher, "startsAt" | "endsAt">,
  now: Date,
): boolean {
  if (voucher.startsAt && voucher.startsAt > now) return false;
  if (voucher.endsAt && voucher.endsAt <= now) return false;
  return true;
}

function computeDiscountAmount(
  voucher: Pick<PromoVoucher, "discountType" | "discountValue" | "maxDiscount">,
  itemSubtotal: number,
): number {
  if (itemSubtotal < 1) return 0;

  let discount = 0;
  if (voucher.discountType === PromoVoucherDiscountType.PERCENT) {
    discount = Math.floor((itemSubtotal * voucher.discountValue) / 100);
    if (voucher.maxDiscount > 0) {
      discount = Math.min(discount, voucher.maxDiscount);
    }
  } else {
    discount = voucher.discountValue;
  }

  return Math.min(Math.max(0, discount), itemSubtotal);
}

async function countActiveRedemptions(
  db: Prisma.TransactionClient,
  voucherId: string,
  userKey: string | null,
  memberId: string | null | undefined,
): Promise<number> {
  const statuses = [
    PromoVoucherRedemptionStatus.RESERVED,
    PromoVoucherRedemptionStatus.CONFIRMED,
  ];

  if (userKey) {
    return db.promoVoucherRedemption.count({
      where: { voucherId, guestKey: userKey, status: { in: statuses } },
    });
  }

  if (memberId) {
    return db.promoVoucherRedemption.count({
      where: { voucherId, memberId, status: { in: statuses } },
    });
  }

  return 0;
}

export async function validatePromoVoucher(
  input: ValidatePromoVoucherInput,
  db: Prisma.TransactionClient = prisma,
): Promise<{ ok: true; data: ValidatedPromoVoucher } | { ok: false; error: string }> {
  const code = normalizeVoucherCode(input.code);
  if (!code) return { ok: false, error: "Kode voucher wajib diisi." };

  const itemSubtotal = Math.trunc(input.itemSubtotal);
  if (itemSubtotal < 0) return { ok: false, error: "Subtotal tidak valid." };

  const voucher = await db.promoVoucher.findUnique({ where: { code } });
  if (!voucher) return { ok: false, error: "Kode voucher tidak ditemukan." };
  if (!voucher.isEnabled) return { ok: false, error: "Voucher tidak aktif." };

  const now = new Date();
  if (!isWithinSchedule(voucher, now)) {
    return { ok: false, error: "Voucher di luar periode berlaku." };
  }

  if (voucher.usedCount >= voucher.stock) {
    return { ok: false, error: "Kuota voucher sudah habis." };
  }

  if (voucher.type === PromoVoucherType.GENERAL) {
    if (voucher.minOrderAmount < 1) {
      return { ok: false, error: "Voucher umum tidak valid (minimal transaksi belum diset)." };
    }
    if (itemSubtotal < voucher.minOrderAmount) {
      return {
        ok: false,
        error: `Minimal transaksi Rp ${voucher.minOrderAmount.toLocaleString("id-ID")} (setelah flash sale).`,
      };
    }
  }

  const perUserLimit =
    voucher.type === PromoVoucherType.SPECIAL ? 1 : voucher.perUserLimit;

  if (!input.skipPerUserCheck && perUserLimit > 0) {
    const targetKey = input.targetKey?.trim() ?? "";
    const userKey = buildVoucherUserKey(input.email ?? "", targetKey);

    if (!userKey) {
      return {
        ok: false,
        error: "Isi email dan ID akun tujuan untuk menggunakan voucher ini.",
      };
    }

    const usedByUser = await countActiveRedemptions(
      db,
      voucher.id,
      userKey,
      input.memberId ?? null,
    );
    if (usedByUser >= perUserLimit) {
      return {
        ok: false,
        error: "Voucher ini sudah pernah dipakai untuk kombinasi email dan akun tujuan ini.",
      };
    }
  }

  const discountAmount = computeDiscountAmount(voucher, itemSubtotal);
  if (discountAmount < 1 && voucher.type === PromoVoucherType.GENERAL) {
    return { ok: false, error: "Voucher tidak memberikan potongan untuk transaksi ini." };
  }

  const payableItem = Math.max(0, itemSubtotal - discountAmount);

  return {
    ok: true,
    data: {
      voucher,
      discountAmount,
      payableItem,
    },
  };
}
