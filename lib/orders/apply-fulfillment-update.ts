import {
  FulfillmentLogAction,
  FulfillmentLogStatus,
  OrderFulfillmentStatus,
  OrderPaymentStatus,
  type Prisma,
} from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { redactPayload } from "@/lib/providers/fulfillment/redact-payload";
import type { ProviderFulfillmentStatus } from "@/lib/providers/fulfillment/types";
import { notifyOrderFulfillmentFailed, notifyOrderFulfillmentSuccess } from "@/lib/mail/transaction-notifications";

function toOrderFulfillmentStatus(
  status: ProviderFulfillmentStatus,
): OrderFulfillmentStatus {
  if (status === "SUCCESS") return OrderFulfillmentStatus.SUCCESS;
  if (status === "FAILED") return OrderFulfillmentStatus.FAILED;
  return OrderFulfillmentStatus.PROCESSING;
}

function toLogStatus(status: ProviderFulfillmentStatus): FulfillmentLogStatus {
  if (status === "SUCCESS") return FulfillmentLogStatus.SUCCESS;
  if (status === "FAILED") return FulfillmentLogStatus.FAILED;
  return FulfillmentLogStatus.PENDING;
}

export type ApplyFulfillmentUpdateInput = {
  orderCode?: string;
  providerRef?: string;
  status: ProviderFulfillmentStatus;
  serial?: string;
  message?: string;
  externalId?: string;
  providerSlug?: string;
  action: "WEBHOOK" | "POLL" | "CREATE" | "RETRY";
  requestPayload?: unknown;
  responsePayload?: unknown;
  attempt?: number;
};

/**
 * Update status fulfillment order secara idempotent.
 * Tidak boleh downgrade SUCCESS → FAILED/PENDING.
 */
export async function applyFulfillmentUpdate(
  input: ApplyFulfillmentUpdateInput,
): Promise<{ ok: boolean; orderId?: string; skipped?: boolean; reason?: string }> {
  const order =
    (input.orderCode
      ? await prisma.order.findUnique({ where: { orderCode: input.orderCode } })
      : null) ??
    (input.providerRef
      ? await prisma.order.findFirst({
          where: {
            OR: [
              { orderCode: input.providerRef },
              { providerRefId: input.providerRef },
            ],
          },
        })
      : null);

  if (!order) {
    return { ok: false, reason: "Order tidak ditemukan." };
  }

  if (order.paymentStatus !== OrderPaymentStatus.PAID) {
    return { ok: false, orderId: order.id, reason: "Order belum PAID." };
  }

  if (order.fulfillmentStatus === OrderFulfillmentStatus.SUCCESS) {
    await prisma.fulfillmentLog.create({
      data: {
        orderId: order.id,
        providerSlug: input.providerSlug ?? order.providerSlug ?? "unknown",
        attempt: input.attempt ?? 1,
        providerRef: input.providerRef ?? order.providerRefId ?? order.orderCode,
        action: input.action as FulfillmentLogAction,
        requestPayload: redactPayload(input.requestPayload) as Prisma.InputJsonValue,
        responsePayload: redactPayload(input.responsePayload) as Prisma.InputJsonValue,
        status: toLogStatus(input.status),
        message: input.message ?? "Skipped: order already SUCCESS",
      },
    });
    return { ok: true, orderId: order.id, skipped: true, reason: "already_success" };
  }

  if (order.fulfillmentStatus === OrderFulfillmentStatus.CANCELLED) {
    return { ok: true, orderId: order.id, skipped: true, reason: "cancelled" };
  }

  if (input.providerRef && order.providerRefId && input.providerRef !== order.providerRefId) {
    return { ok: true, orderId: order.id, skipped: true, reason: "stale_provider_attempt" };
  }
  const nextStatus = toOrderFulfillmentStatus(input.status);
  const now = new Date();

  const applied = await prisma.$transaction(async (tx) => {
    await tx.fulfillmentLog.create({
      data: {
        orderId: order.id,
        providerSlug: input.providerSlug ?? order.providerSlug ?? "unknown",
        attempt: input.attempt ?? 1,
        providerRef: input.providerRef ?? order.providerRefId ?? order.orderCode,
        action: input.action as FulfillmentLogAction,
        requestPayload: redactPayload(input.requestPayload) as Prisma.InputJsonValue,
        responsePayload: redactPayload(input.responsePayload) as Prisma.InputJsonValue,
        status: toLogStatus(input.status),
        message: input.message ?? null,
      },
    });

    const updated = await tx.order.updateMany({
      where: {
        id: order.id,
        paymentStatus: OrderPaymentStatus.PAID,
        fulfillmentStatus: { notIn: [OrderFulfillmentStatus.SUCCESS, OrderFulfillmentStatus.CANCELLED] },
        providerRefId: order.providerRefId,
      },
      data: {
        fulfillmentStatus: nextStatus,
        providerRefId: input.providerRef ?? order.providerRefId ?? order.orderCode,
        fulfillmentMessage: input.message ?? order.fulfillmentMessage,
        fulfillmentSn: input.serial ?? order.fulfillmentSn,
        fulfillmentAttemptedAt: order.fulfillmentAttemptedAt ?? now,
        fulfillmentCompletedAt:
          nextStatus === OrderFulfillmentStatus.SUCCESS ||
          nextStatus === OrderFulfillmentStatus.FAILED
            ? now
            : order.fulfillmentCompletedAt,
      },
    });
    return updated.count === 1;
  });
  if (!applied) return { ok: true, orderId: order.id, skipped: true, reason: "state_changed" };

  if (nextStatus === OrderFulfillmentStatus.FAILED) {
    void notifyOrderFulfillmentFailed(order.id).catch((err) =>
      console.error("[mail] fulfillment failed notify", order.orderCode, err),
    );
  }

  if (nextStatus === OrderFulfillmentStatus.SUCCESS) {
    void notifyOrderFulfillmentSuccess(order.id).catch((err) =>
      console.error("[mail] fulfillment success notify", order.orderCode, err),
    );
  }

  return { ok: true, orderId: order.id };
}
