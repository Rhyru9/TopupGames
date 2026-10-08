import {
  FulfillmentLogAction,
  FulfillmentLogStatus,
  OrderFulfillmentStatus,
  OrderPaymentStatus,
} from "@/app/generated/prisma/client";
import { applyFulfillmentUpdate } from "@/lib/orders/apply-fulfillment-update";
import { prisma } from "@/lib/prisma";
import { getFulfillmentAdapter } from "@/lib/providers/fulfillment/registry";
import { resolveOrderCustomerNo } from "@/lib/providers/fulfillment/resolve-customer-no";
import { getFulfillmentProviderConfig } from "@/lib/providers/get-provider-config";
import type { ProviderFulfillmentStatus } from "@/lib/providers/fulfillment/types";
import { redactPayload } from "@/lib/providers/fulfillment/redact-payload";
import type { Prisma } from "@/app/generated/prisma/client";

export type PollOrderFulfillmentResult =
  | {
      ok: true;
      providerStatus: ProviderFulfillmentStatus;
      message?: string;
      /** Order fulfillment status berubah setelah poll. */
      updated: boolean;
    }
  | { ok: false; error: string };

function toLogStatus(status: ProviderFulfillmentStatus): FulfillmentLogStatus {
  if (status === "SUCCESS") return FulfillmentLogStatus.SUCCESS;
  if (status === "FAILED") return FulfillmentLogStatus.FAILED;
  return FulfillmentLogStatus.PENDING;
}

/**
 * Poll status transaksi ke provider untuk satu order.
 * PROCESSING: boleh update order via applyFulfillmentUpdate.
 * SUCCESS: hanya catat log + laporkan (koreksi FAILED lewat admin terpisah).
 */
export async function pollOrderFulfillmentById(
  orderId: string,
): Promise<PollOrderFulfillmentResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      product: { select: { inputFields: true, requiresZone: true } },
    },
  });

  if (!order) return { ok: false, error: "Order tidak ditemukan." };
  if (order.paymentStatus !== OrderPaymentStatus.PAID) {
    return { ok: false, error: "Order belum PAID." };
  }

  const pollable = [
    OrderFulfillmentStatus.PROCESSING,
    OrderFulfillmentStatus.SUCCESS,
  ] as const;
  if (
    !pollable.includes(order.fulfillmentStatus as (typeof pollable)[number])
  ) {
    return {
      ok: false,
      error: "Poll hanya untuk order Diproses atau Sukses.",
    };
  }

  const slug = order.providerSlug?.trim() ?? "";
  const adapter = getFulfillmentAdapter(slug);
  if (!adapter || !order.providerSkuSnapshot) {
    return { ok: false, error: "Provider atau SKU tidak tersedia untuk poll." };
  }

  const runtime = await getFulfillmentProviderConfig(slug);
  const customerNo = resolveOrderCustomerNo({
    playerFields: order.playerFields,
    productInputFields: order.product.inputFields,
    requiresZone: order.product.requiresZone,
  });

  try {
    const status = await adapter.getStatus({
      orderCode: order.orderCode,
      providerRef: order.providerRefId || order.orderCode,
      providerSku: order.providerSkuSnapshot,
      customerNo,
      sandbox: Boolean(runtime?.sandboxMode),
      externalId: order.providerRefId ?? undefined,
    });

    const attempt =
      (await prisma.fulfillmentLog.count({ where: { orderId: order.id } })) + 1;

    if (order.fulfillmentStatus === OrderFulfillmentStatus.SUCCESS) {
      await prisma.fulfillmentLog.create({
        data: {
          orderId: order.id,
          providerSlug: slug,
          attempt,
          providerRef: order.providerRefId || order.orderCode,
          action: FulfillmentLogAction.POLL,
          responsePayload: redactPayload(status.raw) as Prisma.InputJsonValue,
          status: toLogStatus(status.status),
          message:
            status.message ??
            `Poll admin: provider ${status.status}${status.status === "SUCCESS" ? " (order tetap sukses — gunakan koreksi gagal jika item tidak masuk)" : ""}`,
        },
      });
      return {
        ok: true,
        providerStatus: status.status,
        message: status.message,
        updated: false,
      };
    }

    if (status.status === "PENDING") {
      await prisma.fulfillmentLog.create({
        data: {
          orderId: order.id,
          providerSlug: slug,
          attempt,
          providerRef: order.providerRefId || order.orderCode,
          action: FulfillmentLogAction.POLL,
          responsePayload: redactPayload(status.raw) as Prisma.InputJsonValue,
          status: FulfillmentLogStatus.PENDING,
          message: status.message ?? "Poll: masih pending di provider.",
        },
      });
      return {
        ok: true,
        providerStatus: status.status,
        message: status.message,
        updated: false,
      };
    }

    const result = await applyFulfillmentUpdate({
      orderCode: order.orderCode,
      providerRef: order.providerRefId || order.orderCode,
      status: status.status,
      serial: status.serial,
      message: status.message,
      providerSlug: slug,
      action: "POLL",
      responsePayload: status.raw,
      attempt,
    });

    if (!result.ok) {
      return { ok: false, error: result.reason ?? "Gagal memperbarui order." };
    }

    return {
      ok: true,
      providerStatus: status.status,
      message: status.message,
      updated: !result.skipped,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal poll provider.";
    return { ok: false, error: message };
  }
}
