import {
  OrderFulfillmentStatus,
  OrderPaymentStatus,
} from "@/app/generated/prisma/client";
import { applyFulfillmentUpdate } from "@/lib/orders/apply-fulfillment-update";
import { prisma } from "@/lib/prisma";
import { getFulfillmentAdapter } from "@/lib/providers/fulfillment/registry";
import { resolveOrderCustomerNo } from "@/lib/providers/fulfillment/resolve-customer-no";
import { getFulfillmentProviderConfig } from "@/lib/providers/get-provider-config";
import { allocateUniqueTransactionId } from "@/lib/transaction-id";

export type ProcessFulfillmentResult =
  | { ok: true; status: string; skipped?: boolean }
  | { ok: false; error: string; retryable?: boolean };

/**
 * Core worker logic: lock QUEUED → PROCESSING → adapter.createOrder → update.
 * Satu provider/SKU per attempt (productSkuId + provider snapshot).
 * Snapshot checkout (nama/harga yang dibayar) tidak diubah worker.
 * Retry manual lewat admin.
 */
export async function processOrderFulfillment(
  orderId: string,
  options?: { forceRetry?: boolean },
): Promise<ProcessFulfillmentResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      product: {
        select: { inputFields: true, requiresZone: true },
      },
    },
  });

  if (!order) {
    return { ok: false, error: "Order tidak ditemukan.", retryable: false };
  }

  if (order.paymentStatus !== OrderPaymentStatus.PAID) {
    return { ok: false, error: "Order belum PAID.", retryable: false };
  }

  if (order.fulfillmentStatus === OrderFulfillmentStatus.SUCCESS) {
    return { ok: true, status: "SUCCESS", skipped: true };
  }

  if (order.fulfillmentStatus === OrderFulfillmentStatus.CANCELLED) {
    return { ok: true, status: "CANCELLED", skipped: true };
  }

  if (
    order.fulfillmentStatus === OrderFulfillmentStatus.FAILED &&
    !options?.forceRetry
  ) {
    return { ok: true, status: "FAILED", skipped: true };
  }

  const wasFailedRetry =
    Boolean(options?.forceRetry) &&
    order.fulfillmentStatus === OrderFulfillmentStatus.FAILED;

  const allowedStatus = options?.forceRetry
    ? { in: [OrderFulfillmentStatus.QUEUED, OrderFulfillmentStatus.FAILED] }
    : OrderFulfillmentStatus.QUEUED;
  if (order.fulfillmentStatus !== OrderFulfillmentStatus.QUEUED && !wasFailedRetry) {
    return { ok: true, status: order.fulfillmentStatus, skipped: true };
  }
  const locked = await prisma.order.updateMany({
    where: {
      id: order.id,
      paymentStatus: OrderPaymentStatus.PAID,
      fulfillmentStatus: allowedStatus,
      updatedAt: order.updatedAt,
    },
    data: {
      fulfillmentStatus: OrderFulfillmentStatus.PROCESSING,
      fulfillmentAttemptedAt: new Date(),
      fulfillmentMessage: "Menghubungi provider…",
    },
  });
  if (locked.count !== 1) return { ok: true, status: "PROCESSING", skipped: true };

  const providerSlug = order.providerSlug?.trim() ?? "";
  const providerSku = order.providerSkuSnapshot?.trim() ?? "";

  if (!providerSlug || !providerSku) {
    await applyFulfillmentUpdate({
      orderCode: order.orderCode,
      status: "FAILED",
      message: "Tidak ada provider/SKU untuk diproses.",
      providerSlug: providerSlug || "unknown",
      action: options?.forceRetry ? "RETRY" : "CREATE",
    });
    return { ok: false, error: "Tidak ada target provider.", retryable: false };
  }

  const adapter = getFulfillmentAdapter(providerSlug);
  if (!adapter) {
    await applyFulfillmentUpdate({
      orderCode: order.orderCode,
      status: "FAILED",
      message: `Provider adapter tidak dikenal: ${providerSlug}`,
      providerSlug,
      action: options?.forceRetry ? "RETRY" : "CREATE",
    });
    return { ok: false, error: `Adapter tidak dikenal: ${providerSlug}`, retryable: false };
  }

  const customerNo = resolveOrderCustomerNo({
    playerFields: order.playerFields,
    productInputFields: order.product.inputFields,
    requiresZone: order.product.requiresZone,
  });

  const playerFields =
    order.playerFields &&
    typeof order.playerFields === "object" &&
    !Array.isArray(order.playerFields)
      ? Object.fromEntries(
          Object.entries(order.playerFields as Record<string, unknown>).map(([k, v]) => [
            k,
            String(v ?? ""),
          ]),
        )
      : undefined;

  const attempt = (await prisma.fulfillmentLog.count({ where: { orderId: order.id } })) + 1;

  let providerRef = order.providerRefId?.trim() || order.orderCode;
  if (wasFailedRetry) {
    providerRef = await allocateUniqueTransactionId();
    await prisma.order.update({
      where: { id: order.id },
      data: { providerRefId: providerRef },
    });
  } else if (!order.providerRefId?.trim()) {
    await prisma.order.update({
      where: { id: order.id },
      data: { providerRefId: providerRef },
    });
  }

  const runtime = await getFulfillmentProviderConfig(providerSlug);
  const requestPayload = {
    orderCode: order.orderCode,
    providerSku,
    customerNo,
    providerRef,
    sandbox: Boolean(runtime?.sandboxMode),
  };

  try {
    const result = await adapter.createOrder({
      orderCode: order.orderCode,
      providerSku,
      customerNo,
      sandbox: Boolean(runtime?.sandboxMode),
      playerFields,
      providerRef,
    });

    const uncertain = result.status === "FAILED" && Boolean(result.retryable);
    const status = uncertain ? "PENDING" : result.status;
    await applyFulfillmentUpdate({
      orderCode: order.orderCode,
      providerRef: result.providerRef,
      status,
      serial: result.serial,
      message: uncertain ? `Status provider belum pasti; cek status sebelum retry. ${result.message ?? ""}` : result.message,
      externalId: result.externalId,
      providerSlug,
      action: options?.forceRetry ? "RETRY" : "CREATE",
      requestPayload: result.requestPayload ?? requestPayload,
      responsePayload: result.raw,
      attempt,
    });

    if (status === "SUCCESS" || status === "PENDING") {
      return { ok: true, status };
    }

    return {
      ok: false,
      error: result.message || "Provider error",
      retryable: Boolean(result.retryable),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gagal memproses fulfillment.";
    await applyFulfillmentUpdate({
      orderCode: order.orderCode,
      status: "PENDING",
      message: `Status provider belum pasti; cek status sebelum retry. ${message}`,
      providerSlug,
      action: options?.forceRetry ? "RETRY" : "CREATE",
      requestPayload,
      responsePayload: { error: message },
      attempt,
    });
    return { ok: false, error: message, retryable: true };
  }
}
