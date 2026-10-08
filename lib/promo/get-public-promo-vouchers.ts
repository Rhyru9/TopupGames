import { PromoVoucherType } from "@/app/generated/prisma/client";
import {
  formatVoucherDiscount,
  voucherRemainingStock,
  voucherScheduleLabel,
} from "@/lib/promo/voucher-shared";
import { prisma } from "@/lib/prisma";

export type PublicPromoVoucher = {
  code: string;
  label: string | null;
  discountLabel: string;
  minOrderAmount: number;
  perUserLimit: number;
  remainingStock: number;
  scheduleLabel: string;
  endsAt: Date | null;
};

export async function getPublicPromoVouchers(now = new Date()): Promise<PublicPromoVoucher[]> {
  const rows = await prisma.promoVoucher.findMany({
    where: {
      isEnabled: true,
      type: PromoVoucherType.GENERAL,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
    },
    orderBy: [{ endsAt: "asc" }, { createdAt: "desc" }],
    select: {
      code: true,
      label: true,
      discountType: true,
      discountValue: true,
      maxDiscount: true,
      minOrderAmount: true,
      perUserLimit: true,
      stock: true,
      usedCount: true,
      startsAt: true,
      endsAt: true,
    },
  });

  return rows
    .filter((row) => voucherRemainingStock(row.stock, row.usedCount) > 0)
    .map((row) => ({
      code: row.code,
      label: row.label,
      discountLabel: formatVoucherDiscount(row),
      minOrderAmount: row.minOrderAmount,
      perUserLimit: row.perUserLimit,
      remainingStock: voucherRemainingStock(row.stock, row.usedCount),
      scheduleLabel: voucherScheduleLabel(row.startsAt, row.endsAt),
      endsAt: row.endsAt,
    }));
}
