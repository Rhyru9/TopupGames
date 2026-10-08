export type FlashSaleListItem = {
  id: string;
  name: string;
  startsAt: Date;
  endsAt: Date;
  isEnabled: boolean;
  sortOrder: number;
  itemCount: number;
};

export type FlashSaleSkuOption = {
  id: string;
  name: string;
  priceGuest: number;
  priceMember: number;
  productId: string;
  productName: string;
};

export type FlashSaleItemFormValue = {
  productSkuId: string;
  priceGuest: number;
  priceMember: number;
  quota: number;
  soldCount: number;
  sortOrder: number;
};

export function flashSaleScheduleLabel(startsAt: Date, endsAt: Date, now = new Date()) {
  if (now < startsAt) return "Terjadwal";
  if (now >= endsAt) return "Selesai";
  return "Berjalan";
}

/** Format Date → nilai input datetime-local (waktu lokal). */
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseDatetimeLocal(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
