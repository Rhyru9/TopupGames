/** Client-safe order status labels — no Prisma runtime imports. */

export const ORDER_PAYMENT_STATUSES = ["UNPAID", "PAID", "EXPIRED", "FAILED"] as const;

export type OrderPaymentStatusValue = (typeof ORDER_PAYMENT_STATUSES)[number];

export const ORDER_PAYMENT_STATUS_LABEL: Record<OrderPaymentStatusValue, string> = {
  UNPAID: "Belum bayar",
  PAID: "Lunas",
  EXPIRED: "Kadaluarsa",
  FAILED: "Gagal",
};

export const ORDER_FULFILLMENT_STATUSES = [
  "NONE",
  "QUEUED",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
] as const;

export type OrderFulfillmentStatusValue = (typeof ORDER_FULFILLMENT_STATUSES)[number];

export const ORDER_FULFILLMENT_STATUS_LABEL: Record<OrderFulfillmentStatusValue, string> = {
  NONE: "—",
  QUEUED: "Antrean",
  PROCESSING: "Diproses",
  SUCCESS: "Sukses",
  FAILED: "Gagal",
  CANCELLED: "Dibatalkan",
};

export function isOrderPaymentStatus(value: string): value is OrderPaymentStatusValue {
  return (ORDER_PAYMENT_STATUSES as readonly string[]).includes(value);
}

export function isOrderFulfillmentStatus(value: string): value is OrderFulfillmentStatusValue {
  return (ORDER_FULFILLMENT_STATUSES as readonly string[]).includes(value);
}

/** Tone CSS untuk badge riwayat member (fokus status pesanan). */
export type MemberRiwayatStatusTone =
  | "unpaid"
  | "expired"
  | "failed"
  | "queued"
  | "processing"
  | "success"
  | "cancelled";

/**
 * Status di /member/riwayat: pesanan jika sudah PAID;
 * pra-proses singkat jika belum lunas (fulfillment masih NONE).
 */
export function memberRiwayatStatus(
  paymentStatus: OrderPaymentStatusValue,
  fulfillmentStatus: OrderFulfillmentStatusValue,
): { label: string; tone: MemberRiwayatStatusTone } {
  if (paymentStatus !== "PAID") {
    if (paymentStatus === "EXPIRED") return { label: "Kadaluarsa", tone: "expired" };
    if (paymentStatus === "FAILED") return { label: "Gagal bayar", tone: "failed" };
    return { label: "Belum bayar", tone: "unpaid" };
  }

  switch (fulfillmentStatus) {
    case "SUCCESS":
      return { label: ORDER_FULFILLMENT_STATUS_LABEL.SUCCESS, tone: "success" };
    case "FAILED":
      return { label: ORDER_FULFILLMENT_STATUS_LABEL.FAILED, tone: "failed" };
    case "CANCELLED":
      return { label: ORDER_FULFILLMENT_STATUS_LABEL.CANCELLED, tone: "cancelled" };
    case "PROCESSING":
      return { label: ORDER_FULFILLMENT_STATUS_LABEL.PROCESSING, tone: "processing" };
    case "QUEUED":
      return { label: ORDER_FULFILLMENT_STATUS_LABEL.QUEUED, tone: "queued" };
    default:
      return { label: "Diproses", tone: "processing" };
  }
}
