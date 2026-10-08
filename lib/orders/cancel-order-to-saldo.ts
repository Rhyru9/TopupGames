import {
  FulfillmentLogAction,
  FulfillmentLogStatus,
  MemberLedgerDirection,
  MemberLedgerKind,
  OrderFulfillmentStatus,
  OrderPaymentStatus,
  type Prisma,
} from "@/app/generated/prisma/client";
import {
  orderRefundFulfillmentMessage,
  orderRefundLedgerReason,
} from "@/lib/orders/apply-fulfillment-correction";
import { prisma } from "@/lib/prisma";

type TxClient = Prisma.TransactionClient;

export type CancelPaidOrderResult =
  | { ok: true; credited: number }
  | { ok: false; error: string };

/**
 * Batalkan order PAID + FAILED: kredit order.amount ke saldo member.
 * Idempotent via order_wallets.walletRefundedAt. Clawback cashback bila sudah dikredit.
 */
export async function cancelPaidOrderToSaldo(
  orderId: string,
): Promise<CancelPaidOrderResult> {
  try {
    return await prisma.$transaction(async (tx) => cancelPaidOrderToSaldoInTx(tx, orderId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membatalkan order.";
    if (message === "INSUFFICIENT_POIN") {
      return { ok: false, error: "Poin member tidak cukup untuk clawback cashback." };
    }
    return { ok: false, error: message };
  }
}

export async function cancelPaidOrderToSaldoInTx(
  tx: TxClient,
  orderId: string,
): Promise<CancelPaidOrderResult> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderCode: true,
      memberId: true,
      amount: true,
      paymentStatus: true,
      fulfillmentStatus: true,
      providerSlug: true,
      wallet: {
        select: {
          walletRefundedAt: true,
          cashbackPoinSnapshot: true,
          cashbackCreditedAt: true,
        },
      },
    },
  });

  if (!order) return { ok: false, error: "Order tidak ditemukan." };
  if (!order.memberId) {
    return { ok: false, error: "Order guest — kaitkan ke member dulu." };
  }
  if (order.paymentStatus !== OrderPaymentStatus.PAID) {
    return { ok: false, error: "Order belum PAID." };
  }
  if (order.fulfillmentStatus !== OrderFulfillmentStatus.FAILED) {
    return {
      ok: false,
      error: "Hanya order gagal top-up yang bisa dibatalkan ke saldo. Tandai gagal dulu jika masih sukses.",
    };
  }

  // Pastikan row wallet ada (order lama / edge).
  if (!order.wallet) {
    await tx.orderWallet.create({
      data: { orderId: order.id },
    });
  }

  const wallet =
    order.wallet ??
    (await tx.orderWallet.findUnique({
      where: { orderId: order.id },
      select: {
        walletRefundedAt: true,
        cashbackPoinSnapshot: true,
        cashbackCreditedAt: true,
      },
    }));

  if (!wallet) return { ok: false, error: "Data wallet order tidak ditemukan." };
  if (wallet.walletRefundedAt) {
    return { ok: false, error: "Saldo untuk order ini sudah dikembalikan." };
  }
  if (order.amount < 1) {
    return { ok: false, error: "Amount order tidak valid." };
  }

  const claimedWallet = await tx.orderWallet.updateMany({
    where: {
      orderId: order.id,
      walletRefundedAt: null,
    },
    data: { walletRefundedAt: new Date() },
  });
  if (claimedWallet.count === 0) {
    return { ok: false, error: "Order tidak bisa dibatalkan (sudah berubah)." };
  }

  const claimedOrder = await tx.order.updateMany({
    where: {
      id: order.id,
      paymentStatus: OrderPaymentStatus.PAID,
      fulfillmentStatus: OrderFulfillmentStatus.FAILED,
      memberId: { not: null },
    },
    data: {
      fulfillmentStatus: OrderFulfillmentStatus.CANCELLED,
      fulfillmentCompletedAt: new Date(),
      fulfillmentMessage: orderRefundFulfillmentMessage(order.orderCode, order.amount),
    },
  });
  if (claimedOrder.count === 0) {
    await tx.orderWallet.update({
      where: { orderId: order.id },
      data: { walletRefundedAt: null },
    });
    return { ok: false, error: "Order tidak bisa dibatalkan (sudah berubah)." };
  }

  const memberId = order.memberId;
  await tx.memberBalance.upsert({
    where: { memberId },
    create: { memberId, saldo: 0, poin: 0 },
    update: {},
  });

  const clawback = wallet.cashbackCreditedAt ? Math.max(0, wallet.cashbackPoinSnapshot) : 0;
  const credited = await tx.memberBalance.updateMany({
    where: { memberId, poin: { gte: clawback } },
    data: { saldo: { increment: order.amount }, poin: { decrement: clawback } },
  });
  if (credited.count !== 1) throw new Error("INSUFFICIENT_POIN");
  const balance = await tx.memberBalance.findUniqueOrThrow({ where: { memberId } });
  const nextSaldo = balance.saldo;
  const nextPoin = balance.poin;

  await tx.memberLedgerEntry.create({
    data: {
      memberId,
      kind: MemberLedgerKind.SALDO,
      direction: MemberLedgerDirection.CREDIT,
      amount: order.amount,
      balanceAfter: nextSaldo,
      reason: orderRefundLedgerReason(order.orderCode),
    },
  });

  if (wallet.cashbackCreditedAt && wallet.cashbackPoinSnapshot > 0) {
    await tx.memberLedgerEntry.create({
      data: {
        memberId,
        kind: MemberLedgerKind.POIN,
        direction: MemberLedgerDirection.DEBIT,
        amount: wallet.cashbackPoinSnapshot,
        balanceAfter: nextPoin,
        reason: `Clawback cashback order ${order.orderCode}`,
      },
    });
    await tx.orderWallet.update({
      where: { orderId: order.id },
      data: { cashbackCreditedAt: null },
    });
  }

  await tx.fulfillmentLog.create({
    data: {
      orderId: order.id,
      providerSlug: order.providerSlug ?? "manual",
      attempt: (await tx.fulfillmentLog.count({ where: { orderId: order.id } })) + 1,
      action: FulfillmentLogAction.RETRY,
      status: FulfillmentLogStatus.FAILED,
      message: `Dibatalkan — ${orderRefundLedgerReason(order.orderCode)}`,
      responsePayload: {
        source: "admin_cancel_to_saldo",
        amount: order.amount,
      },
    },
  });

  return { ok: true, credited: order.amount };
}
