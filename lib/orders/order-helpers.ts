import { generateTransactionId } from "@/lib/transaction-id";
import type {
  OrderFulfillmentStatus,
  OrderPaymentStatus,
} from "@/app/generated/prisma/client";
import {
  extractPaymentInstructionsFromRaw,
  type PaymentInstructionGroup,
} from "@/lib/payments/payment-instructions";
import { sanitizePaymentBrandLabel } from "@/lib/payments/sanitize-payment-brand";
import {
  ORDER_FULFILLMENT_STATUS_LABEL,
  ORDER_PAYMENT_STATUS_LABEL,
  type OrderFulfillmentStatusValue,
  type OrderPaymentStatusValue,
} from "@/lib/orders/order-status-labels";

export function generateOrderCode(): string {
  return generateTransactionId();
}

export { normalizeEmail, normalizeWhatsapp } from "@/lib/orders/order-contact";

export type PublicInvoiceDto = {
  orderCode: string;
  productName: string;
  skuName: string;
  productSlug: string | null;
  playerLabel: string | null;
  playerNickname: string | null;
  email: string | null;
  whatsapp: string | null;
  itemSubtotalSnapshot: number;
  voucherCodeSnapshot: string | null;
  voucherDiscountSnapshot: number;
  priceSnapshot: number;
  feeSnapshot: number;
  amount: number;
  poinUsed: number;
  saldoUsed: number;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  paymentStatusLabel: string;
  fulfillmentStatusLabel: string;
  fulfillmentMessage: string | null;
  fulfillmentSn: string | null;
  fulfillmentCompletedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  expiresAt: string | null;
  payment: {
    channel: string;
    channelName: string | null;
    payCode: string | null;
    qrUrl: string | null;
    checkoutUrl: string | null;
    expiredAt: string | null;
    paidAt: string | null;
    instructions: PaymentInstructionGroup[];
  } | null;
  statusLabel: string;
};

export function publicOrderStatusLabel(
  paymentStatus: OrderPaymentStatus,
  fulfillmentStatus: OrderFulfillmentStatus,
): string {
  if (paymentStatus === "UNPAID") return "Menunggu pembayaran";
  if (paymentStatus === "EXPIRED") return "Kadaluarsa";
  if (paymentStatus === "FAILED") return "Pembayaran gagal";
  if (fulfillmentStatus === "SUCCESS") return "Berhasil";
  if (fulfillmentStatus === "FAILED") return "Gagal diproses — hubungi CS";
  if (fulfillmentStatus === "CANCELLED") return "Dibatalkan — saldo dikembalikan";
  if (fulfillmentStatus === "PROCESSING" || fulfillmentStatus === "QUEUED") {
    return "Diproses";
  }
  return "Lunas";
}

export function toPublicInvoiceDto(order: {
  orderCode: string;
  productNameSnapshot: string;
  skuNameSnapshot: string;
  playerLabel: string | null;
  playerNickname: string | null;
  email: string | null;
  whatsapp: string | null;
  itemSubtotalSnapshot?: number;
  voucherCodeSnapshot?: string | null;
  voucherDiscountSnapshot?: number;
  priceSnapshot: number;
  feeSnapshot: number;
  amount: number;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  fulfillmentMessage: string | null;
  fulfillmentSn: string | null;
  fulfillmentCompletedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
  product?: { slug: string } | null;
  wallet?: {
    poinUsed: number;
    saldoUsed: number;
  } | null;
  payments: Array<{
    channel: string;
    channelName: string | null;
    payCode: string | null;
    qrUrl: string | null;
    checkoutUrl: string | null;
    expiredAt: Date | null;
    paidAt: Date | null;
    createdAt: Date;
    rawCreateResponse?: unknown;
  }>;
}): PublicInvoiceDto {
  const payment = [...order.payments].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  )[0];

  const paymentStatus = order.paymentStatus as OrderPaymentStatusValue;
  const fulfillmentStatus = order.fulfillmentStatus as OrderFulfillmentStatusValue;
  const paidAtIso = payment?.paidAt?.toISOString() ?? null;

  return {
    orderCode: order.orderCode,
    productName: order.productNameSnapshot,
    skuName: order.skuNameSnapshot,
    productSlug: order.product?.slug ?? null,
    playerLabel: order.playerLabel,
    playerNickname: order.playerNickname,
    email: order.email,
    whatsapp: order.whatsapp,
    priceSnapshot: order.priceSnapshot,
    itemSubtotalSnapshot: order.itemSubtotalSnapshot ?? order.priceSnapshot,
    voucherCodeSnapshot: order.voucherCodeSnapshot ?? null,
    voucherDiscountSnapshot: order.voucherDiscountSnapshot ?? 0,
    feeSnapshot: order.feeSnapshot,
    amount: order.amount,
    poinUsed: order.wallet?.poinUsed ?? 0,
    saldoUsed: order.wallet?.saldoUsed ?? 0,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    paymentStatusLabel: ORDER_PAYMENT_STATUS_LABEL[paymentStatus],
    fulfillmentStatusLabel:
      fulfillmentStatus === "NONE" && order.paymentStatus !== "PAID"
        ? "Belum diproses"
        : ORDER_FULFILLMENT_STATUS_LABEL[fulfillmentStatus],
    fulfillmentMessage: order.fulfillmentMessage?.trim() || null,
    fulfillmentSn: order.fulfillmentSn?.trim() || null,
    fulfillmentCompletedAt: order.fulfillmentCompletedAt?.toISOString() ?? null,
    paidAt: paidAtIso,
    createdAt: order.createdAt.toISOString(),
    expiresAt: order.expiresAt?.toISOString() ?? null,
    payment: payment
      ? {
          channel: payment.channel,
          channelName: sanitizePaymentBrandLabel(payment.channelName || payment.channel),
          payCode: payment.payCode,
          qrUrl: payment.qrUrl,
          checkoutUrl: payment.checkoutUrl,
          expiredAt: payment.expiredAt?.toISOString() ?? null,
          paidAt: paidAtIso,
          instructions: extractPaymentInstructionsFromRaw(payment.rawCreateResponse),
        }
      : null,
    statusLabel: publicOrderStatusLabel(order.paymentStatus, order.fulfillmentStatus),
  };
}
