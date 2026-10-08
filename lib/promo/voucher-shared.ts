import type {
  PromoVoucherDiscountType,
  PromoVoucherType,
} from "@/app/generated/prisma/client";

export type PromoVoucherListItem = {
  id: string;
  code: string;
  label: string | null;
  type: PromoVoucherType;
  discountType: PromoVoucherDiscountType;
  discountValue: number;
  maxDiscount: number;
  minOrderAmount: number;
  stock: number;
  usedCount: number;
  perUserLimit: number;
  isEnabled: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
};

export function normalizeVoucherCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function parseDatetimeLocal(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function voucherScheduleLabel(startsAt: Date | null, endsAt: Date | null): string {
  if (!startsAt && !endsAt) return "Tanpa batas waktu";
  const fmt = (d: Date) =>
    d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  if (startsAt && endsAt) return `${fmt(startsAt)} – ${fmt(endsAt)}`;
  if (startsAt) return `Mulai ${fmt(startsAt)}`;
  return `Sampai ${fmt(endsAt!)}`;
}

export function formatVoucherDiscount(row: {
  discountType: PromoVoucherDiscountType;
  discountValue: number;
  maxDiscount: number;
}): string {
  if (row.discountType === "PERCENT") {
    const cap =
      row.maxDiscount > 0 ? ` (max Rp ${row.maxDiscount.toLocaleString("id-ID")})` : "";
    return `${row.discountValue}%${cap}`;
  }
  return `Rp ${row.discountValue.toLocaleString("id-ID")}`;
}

export function voucherRemainingStock(stock: number, usedCount: number): number {
  return Math.max(0, stock - usedCount);
}
