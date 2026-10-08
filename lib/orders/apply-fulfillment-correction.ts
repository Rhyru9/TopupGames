import {
  FulfillmentLogAction,
  FulfillmentLogStatus,
  OrderFulfillmentStatus,
  OrderPaymentStatus,
  type Prisma,
} from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { redactPayload } from "@/lib/providers/fulfillment/redact-payload";
import { notifyOrderFulfillmentFailed } from "@/lib/mail/transaction-notifications";

export type ApplyCorrectionFailedResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

/**
 * Admin koreksi: SUCCESS → FAILED (item tidak masuk / false success).
 * Satu-satunya jalur downgrade dari SUCCESS.
 */
export async function applyFulfillmentCorrectionFailed(
  orderId: string,
  note: string,
): Promise<ApplyCorrectionFailedResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderCode: true,
      providerSlug: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      providerRefId: true,
    },
  });

  if (!order) return { ok: false, error: "Order tidak ditemukan." };
  if (order.paymentStatus !== OrderPaymentStatus.PAID) {
    return { ok: false, error: "Order belum PAID." };
  }
  if (order.fulfillmentStatus !== OrderFulfillmentStatus.SUCCESS) {
    return {
      ok: false,
      error: "Koreksi gagal hanya untuk order yang statusnya Sukses.",
    };
  }

  const message = note.trim() || "Item tidak masuk — koreksi admin.";
  const now = new Date();
  const attempt =
    (await prisma.fulfillmentLog.count({ where: { orderId: order.id } })) + 1;

  await prisma.$transaction(async (tx) => {
    await tx.fulfillmentLog.create({
      data: {
        orderId: order.id,
        providerSlug: order.providerSlug ?? "manual",
        attempt,
        providerRef: order.providerRefId ?? order.orderCode,
        action: FulfillmentLogAction.RETRY,
        status: FulfillmentLogStatus.FAILED,
        message,
        responsePayload: redactPayload({
          source: "admin_correction_failed",
          note: message,
        }) as Prisma.InputJsonValue,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        fulfillmentStatus: OrderFulfillmentStatus.FAILED,
        fulfillmentMessage: message,
        fulfillmentCompletedAt: now,
      },
    });
  });

  void notifyOrderFulfillmentFailed(order.id).catch((err) =>
    console.error("[mail] correction failed notify", order.orderCode, err),
  );

  return { ok: true, orderId: order.id };
}

export function orderRefundLedgerReason(orderCode: string): string {
  return `Pengembalian dari order ${orderCode}`;
}

export function orderRefundFulfillmentMessage(orderCode: string, amount: number): string {
  return `Dibatalkan — pengembalian saldo Rp ${amount.toLocaleString("id-ID")} dari order ${orderCode}`;
}
