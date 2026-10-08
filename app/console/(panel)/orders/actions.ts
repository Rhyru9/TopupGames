"use server";

import { allocateUniqueTransactionId } from "@/lib/transaction-id";

import {
  FulfillmentLogAction,
  FulfillmentLogStatus,
  OrderFulfillmentStatus,
  OrderPaymentStatus,
  ProductSkuStatus,
} from "@/app/generated/prisma/client";
import { assertConsoleAdminAction, guardConsoleAdminAction } from "@/lib/admin/require-console-admin";
import { withToastUrl } from "@/lib/console-toast";
import {
  resolveMemberForOrderLink,
  searchMembersForOrderLink,
  type MemberLinkSearchResult,
} from "@/lib/member/search-members-for-link";
import { cancelPaidOrderToSaldo } from "@/lib/orders/cancel-order-to-saldo";
import { applyFulfillmentCorrectionFailed } from "@/lib/orders/apply-fulfillment-correction";
import { applyFulfillmentUpdate } from "@/lib/orders/apply-fulfillment-update";
import { enqueueProcessTopup } from "@/lib/orders/enqueue-fulfillment";
import { pollOrderFulfillmentById } from "@/lib/orders/poll-order-fulfillment";
import { orderFulfillmentToasts } from "@/lib/orders/order-fulfillment-toasts";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function detailUrl(orderId: string) {
  return `/console/orders/${orderId}`;
}

function actionsUrl(orderId: string) {
  return `/console/orders/${orderId}/aksi`;
}

function revalidateOrderPaths(orderId: string) {
  revalidatePath(detailUrl(orderId));
  revalidatePath(actionsUrl(orderId));
  revalidatePath("/console/orders");
}

export async function retryOrderFulfillment(formData: FormData) {
  await guardConsoleAdminAction();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const productSkuId = String(formData.get("productSkuId") ?? "").trim();
  if (!orderId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      productId: true,
      productSkuId: true,
      skuNameSnapshot: true,
      paymentStatus: true,
      fulfillmentStatus: true,
    },
  });
  if (!order || order.paymentStatus !== OrderPaymentStatus.PAID) {
    redirect(
      withToastUrl(actionsUrl(orderId), orderFulfillmentToasts.retryFailed, "error"),
    );
  }

  if (order.fulfillmentStatus !== OrderFulfillmentStatus.FAILED) {
    redirect(withToastUrl(actionsUrl(orderId), "Retry hanya untuk order FAILED. Cek status provider untuk order yang sedang diproses.", "error"));
  }

  const skuId = productSkuId || order.productSkuId;
  const sku = await prisma.productSku.findFirst({
    where: { id: skuId, productId: order.productId },
    select: {
      id: true,
      name: true,
      providerSku: true,
      status: true,
      provider: { select: { slug: true, isActive: true } },
    },
  });

  if (!sku || !sku.provider.isActive) {
    redirect(
      withToastUrl(actionsUrl(orderId), "Nominal / provider tidak valid.", "error"),
    );
  }

  if (sku.status !== ProductSkuStatus.AVAILABLE && sku.id !== order.productSkuId) {
    redirect(
      withToastUrl(
        actionsUrl(orderId),
        "Nominal terpilih sedang tidak available.",
        "error",
      ),
    );
  }

  const attempt =
    (await prisma.fulfillmentLog.count({ where: { orderId } })) + 1;

  const providerRefId = await allocateUniqueTransactionId();
  const retried = await prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: OrderPaymentStatus.PAID, fulfillmentStatus: OrderFulfillmentStatus.FAILED },
      data: {
        providerRefId,
        productSkuId: sku.id,
        providerSlug: sku.provider.slug,
        providerSkuSnapshot: sku.providerSku,
        fulfillmentStatus: OrderFulfillmentStatus.QUEUED,
        fulfillmentCompletedAt: null,
        fulfillmentMessage: "Diantrikan ulang ke worker…",
      },
    });

    if (claimed.count !== 1) return false;
    await tx.fulfillmentLog.create({
      data: {
        orderId,
        providerSlug: sku.provider.slug,
        attempt,
        action: FulfillmentLogAction.RETRY,
        status: FulfillmentLogStatus.PENDING,
        message: `Retry antrian: ${sku.name} (${sku.providerSku})`,
        requestPayload: {
          checkoutSkuName: order.skuNameSnapshot,
          sentSkuId: sku.id,
          sentSkuName: sku.name,
          sentProviderSku: sku.providerSku,
        },
      },
    });

    return true;
  });
  if (!retried) redirect(withToastUrl(actionsUrl(orderId), "Order sudah berubah. Muat ulang halaman.", "error"));

  const enqueued = await enqueueProcessTopup(orderId, "retry");
  revalidateOrderPaths(orderId);

  if (!enqueued.ok) {
    redirect(
      withToastUrl(
        actionsUrl(orderId),
        `${orderFulfillmentToasts.retryFailed} ${enqueued.error}`,
        "error",
      ),
    );
  }

  redirect(withToastUrl(actionsUrl(orderId), orderFulfillmentToasts.retryQueued));
}

export async function markOrderFulfillmentManual(formData: FormData) {
  await guardConsoleAdminAction();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim().toUpperCase();
  const serial = String(formData.get("serial") ?? "").trim() || undefined;
  const message = String(formData.get("message") ?? "").trim() || undefined;

  if (!orderId || (statusRaw !== "SUCCESS" && statusRaw !== "FAILED")) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderCode: true,
      providerSlug: true,
      paymentStatus: true,
      fulfillmentStatus: true,
    },
  });

  if (!order || order.paymentStatus !== OrderPaymentStatus.PAID) {
    redirect(withToastUrl(actionsUrl(orderId), "Order belum PAID.", "error"));
  }

  if (
    order.fulfillmentStatus === OrderFulfillmentStatus.SUCCESS ||
    order.fulfillmentStatus === OrderFulfillmentStatus.CANCELLED
  ) {
    redirect(
      withToastUrl(actionsUrl(orderId), "Status final — tidak bisa diubah.", "error"),
    );
  }

  await applyFulfillmentUpdate({
    orderCode: order.orderCode,
    status: statusRaw === "SUCCESS" ? "SUCCESS" : "FAILED",
    serial,
    message:
      message ||
      (statusRaw === "SUCCESS"
        ? "Ditandai sukses oleh admin (manual)."
        : "Ditandai gagal oleh admin (manual)."),
    providerSlug: order.providerSlug ?? "manual",
    action: "RETRY",
    responsePayload: { source: "admin_manual", status: statusRaw },
  });

  revalidateOrderPaths(orderId);
  redirect(
    withToastUrl(
      actionsUrl(orderId),
      statusRaw === "SUCCESS"
        ? orderFulfillmentToasts.manualSuccess
        : orderFulfillmentToasts.manualFailed,
    ),
  );
}

export async function linkOrderToMember(formData: FormData) {
  await guardConsoleAdminAction();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const memberIdInput = String(formData.get("memberId") ?? "").trim();
  const memberQuery = String(formData.get("memberQuery") ?? "").trim();
  if (!orderId || (!memberIdInput && !memberQuery)) {
    redirect(withToastUrl(actionsUrl(orderId || ""), "Pilih atau isi ID member (CUS…).", "error"));
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, memberId: true, paymentStatus: true, fulfillmentStatus: true },
  });
  if (!order) {
    redirect(withToastUrl("/console/orders", "Order tidak ditemukan.", "error"));
  }
  if (order.memberId) {
    redirect(withToastUrl(actionsUrl(orderId), "Order sudah terkait member.", "error"));
  }
  if (order.paymentStatus !== OrderPaymentStatus.PAID) {
    redirect(withToastUrl(actionsUrl(orderId), "Order belum PAID.", "error"));
  }
  if (order.fulfillmentStatus !== OrderFulfillmentStatus.FAILED) {
    redirect(
      withToastUrl(
        actionsUrl(orderId),
        "Kaitkan member hanya untuk order gagal yang akan dikembalikan ke saldo.",
        "error",
      ),
    );
  }

  const member = await resolveMemberForOrderLink(memberIdInput, memberQuery);

  if (!member) {
    redirect(withToastUrl(actionsUrl(orderId), "Member tidak ditemukan.", "error"));
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { memberId: member.id },
  });

  revalidateOrderPaths(orderId);
  redirect(
    withToastUrl(
      actionsUrl(orderId),
      `Order dikaitkan ke ${member.name} (${member.memberCode}).`,
    ),
  );
}

export async function cancelOrderToSaldo(formData: FormData) {
  await guardConsoleAdminAction();
  const orderId = String(formData.get("orderId") ?? "").trim();
  if (!orderId) return;

  const result = await cancelPaidOrderToSaldo(orderId);
  revalidateOrderPaths(orderId);
  if (result.ok) {
    revalidatePath("/console/members/balances");
    redirect(
      withToastUrl(
        detailUrl(orderId),
        `Pengembalian saldo Rp ${result.credited.toLocaleString("id-ID")} — order dibatalkan.`,
      ),
    );
  }
  redirect(withToastUrl(actionsUrl(orderId), result.error, "error"));
}

export async function lookupMembersForOrderLink(
  query: string,
): Promise<MemberLinkSearchResult[]> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) return [];
  return searchMembersForOrderLink(query);
}

export async function pollOrderFulfillmentStatus(orderId: string): Promise<{
  ok: boolean;
  title: string;
  message: string;
  variant: "default" | "danger";
}> {
  const gate = await assertConsoleAdminAction();
  if (!gate.ok) {
    return { ok: false, title: "Gagal cek provider", message: gate.error, variant: "danger" };
  }

  const id = orderId.trim();
  if (!id) {
    return { ok: false, title: "Gagal cek provider", message: "Order tidak valid.", variant: "danger" };
  }

  const result = await pollOrderFulfillmentById(id);
  revalidateOrderPaths(id);

  if (!result.ok) {
    return {
      ok: false,
      title: "Gagal cek provider",
      message: result.error,
      variant: "danger",
    };
  }

  const statusLabel =
    result.providerStatus === "SUCCESS"
      ? "Sukses"
      : result.providerStatus === "FAILED"
        ? "Gagal"
        : "Pending";

  const detail = result.message ? `\n\n${result.message}` : "";
  const suffix = result.updated
    ? "\n\nStatus order diperbarui."
    : result.providerStatus === "SUCCESS"
      ? "\n\nOrder tetap Sukses. Jika item tidak masuk, gunakan Tandai gagal (koreksi)."
      : "";

  return {
    ok: true,
    title: `Provider: ${statusLabel}`,
    message: `Status dari provider: ${statusLabel}.${detail}${suffix}`,
    variant: result.providerStatus === "FAILED" ? "danger" : "default",
  };
}

export async function markOrderFulfillmentCorrectionFailed(formData: FormData) {
  await guardConsoleAdminAction();
  const orderId = String(formData.get("orderId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!orderId) return;

  const result = await applyFulfillmentCorrectionFailed(orderId, note);
  revalidateOrderPaths(orderId);

  if (!result.ok) {
    redirect(withToastUrl(actionsUrl(orderId), result.error, "error"));
  }

  redirect(
    withToastUrl(
      actionsUrl(orderId),
      "Order ditandai gagal (koreksi). Lanjutkan pengembalian saldo jika perlu.",
    ),
  );
}
