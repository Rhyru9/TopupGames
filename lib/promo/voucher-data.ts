import { prisma } from "@/lib/prisma";
import type { PromoVoucherListItem } from "@/lib/promo/voucher-shared";
import { voucherRemainingStock } from "@/lib/promo/voucher-shared";

export type { PromoVoucherListItem } from "@/lib/promo/voucher-shared";
export {
  formatVoucherDiscount,
  normalizeVoucherCode,
  parseDatetimeLocal,
  toDatetimeLocalValue,
  voucherScheduleLabel,
  voucherRemainingStock,
} from "@/lib/promo/voucher-shared";

export async function listPromoVouchers(options?: {
  skip?: number;
  take?: number;
  q?: string;
}): Promise<{ rows: PromoVoucherListItem[]; total: number }> {
  const q = options?.q?.trim();
  const where = q
    ? {
        OR: [
          { code: { contains: q.toUpperCase() } },
          { label: { contains: q } },
        ],
      }
    : undefined;

  const [rows, total] = await Promise.all([
    prisma.promoVoucher.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ isEnabled: "desc" }, { createdAt: "desc" }],
    }),
    prisma.promoVoucher.count({ where }),
  ]);

  return { rows, total };
}

export async function getPromoVoucherById(id: string) {
  return prisma.promoVoucher.findUnique({ where: { id } });
}

export function promoVoucherStockLabel(stock: number, usedCount: number): string {
  const remaining = voucherRemainingStock(stock, usedCount);
  return `${remaining} / ${stock}`;
}
