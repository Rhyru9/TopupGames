import { ensureMemberBalanceInTx } from "@/lib/member/ensure-balance-in-tx";
import {
  MemberLedgerDirection,
  MemberLedgerKind,
  OrderPaymentStatus,
  type Prisma,
} from "@/app/generated/prisma/client";

type TxClient = Prisma.TransactionClient;

export type CheckoutWalletUsage = {
  priceSnapshot: number;
  poinUsed: number;
  saldoUsed: number;
  remainingAfterPoin: number;
  gatewayAmount: number;
  canPayWithSaldo: boolean;
  payWithSaldo: boolean;
};

/**
 * Hitung potongan poin/saldo (1 poin = Rp 1).
 * Saldo hanya full-cover sisa setelah poin — tidak campur gateway parsial.
 */
export function computeCheckoutWalletUsage(input: {
  priceSnapshot: number;
  usePoin: boolean;
  useSaldo: boolean;
  poinBalance: number;
  saldoBalance: number;
}): CheckoutWalletUsage {
  const priceSnapshot = Math.max(0, Math.trunc(input.priceSnapshot));
  const poinBalance = Math.max(0, Math.trunc(input.poinBalance));
  const saldoBalance = Math.max(0, Math.trunc(input.saldoBalance));

  const poinUsed = input.usePoin ? Math.min(poinBalance, priceSnapshot) : 0;
  const remainingAfterPoin = Math.max(0, priceSnapshot - poinUsed);
  const canPayWithSaldo = remainingAfterPoin > 0 && saldoBalance >= remainingAfterPoin;
  const payWithSaldo = Boolean(input.useSaldo && canPayWithSaldo);
  const saldoUsed = payWithSaldo ? remainingAfterPoin : 0;
  const gatewayAmount = Math.max(0, remainingAfterPoin - saldoUsed);

  return {
    priceSnapshot,
    poinUsed,
    saldoUsed,
    remainingAfterPoin,
    gatewayAmount,
    canPayWithSaldo,
    payWithSaldo,
  };
}

/**
 * Debit poin/saldo sesuai snapshot order_wallets. Idempotent via walletDebitedAt.
 */
export async function debitOrderWalletInTx(
  tx: TxClient,
  orderId: string,
): Promise<{ debited: boolean }> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderCode: true,
      memberId: true,
      wallet: {
        select: {
          poinUsed: true,
          saldoUsed: true,
          walletDebitedAt: true,
        },
      },
    },
  });

  const wallet = order?.wallet;
  if (!order?.memberId || !wallet) return { debited: false };
  if (wallet.poinUsed < 1 && wallet.saldoUsed < 1) return { debited: false };
  if (wallet.walletDebitedAt) return { debited: false };

  const claimed = await tx.orderWallet.updateMany({
    where: {
      orderId: order.id,
      walletDebitedAt: null,
    },
    data: { walletDebitedAt: new Date() },
  });
  if (claimed.count === 0) return { debited: false };

  await ensureMemberBalanceInTx(tx, order.memberId);

  const debited = await tx.memberBalance.updateMany({
    where: {
      memberId: order.memberId,
      poin: { gte: wallet.poinUsed },
      saldo: { gte: wallet.saldoUsed },
    },
    data: {
      poin: { decrement: wallet.poinUsed },
      saldo: { decrement: wallet.saldoUsed },
    },
  });
  if (debited.count !== 1) {
    const current = await tx.memberBalance.findUniqueOrThrow({ where: { memberId: order.memberId } });
    throw new Error(current.poin < wallet.poinUsed ? "INSUFFICIENT_POIN" : "INSUFFICIENT_SALDO");
  }
  const balance = await tx.memberBalance.findUniqueOrThrow({ where: { memberId: order.memberId } });
  const nextPoin = balance.poin;
  const nextSaldo = balance.saldo;

  if (wallet.poinUsed > 0) {
    await tx.memberLedgerEntry.create({
      data: {
        memberId: order.memberId,
        kind: MemberLedgerKind.POIN,
        direction: MemberLedgerDirection.DEBIT,
        amount: wallet.poinUsed,
        balanceAfter: nextPoin,
        reason: `Order ${order.orderCode} poin`,
      },
    });
  }

  if (wallet.saldoUsed > 0) {
    await tx.memberLedgerEntry.create({
      data: {
        memberId: order.memberId,
        kind: MemberLedgerKind.SALDO,
        direction: MemberLedgerDirection.DEBIT,
        amount: wallet.saldoUsed,
        balanceAfter: nextSaldo,
        reason: `Order ${order.orderCode} saldo`,
      },
    });
  }

  return { debited: true };
}

/**
 * Refund poin/saldo jika pembayaran EXPIRED/FAILED. Idempotent via walletRefundedAt.
 * Hanya untuk order yang belum PAID.
 */
export async function refundOrderWalletInTx(
  tx: TxClient,
  orderId: string,
): Promise<{ refunded: boolean }> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderCode: true,
      memberId: true,
      paymentStatus: true,
      wallet: {
        select: {
          poinUsed: true,
          saldoUsed: true,
          walletDebitedAt: true,
          walletRefundedAt: true,
        },
      },
    },
  });

  const wallet = order?.wallet;
  if (!order?.memberId || !wallet) return { refunded: false };
  if (!wallet.walletDebitedAt) return { refunded: false };
  if (wallet.walletRefundedAt) return { refunded: false };
  if (order.paymentStatus === OrderPaymentStatus.PAID) return { refunded: false };
  if (wallet.poinUsed < 1 && wallet.saldoUsed < 1) return { refunded: false };

  const claimed = await tx.orderWallet.updateMany({
    where: {
      orderId: order.id,
      walletDebitedAt: { not: null },
      walletRefundedAt: null,
    },
    data: { walletRefundedAt: new Date() },
  });
  if (claimed.count === 0) return { refunded: false };

  // Re-check payment status after claim window (order still unpaid).
  const fresh = await tx.order.findUnique({
    where: { id: order.id },
    select: { paymentStatus: true },
  });
  if (fresh?.paymentStatus === OrderPaymentStatus.PAID) {
    await tx.orderWallet.update({
      where: { orderId: order.id },
      data: { walletRefundedAt: null },
    });
    return { refunded: false };
  }

  await ensureMemberBalanceInTx(tx, order.memberId);

  const balance = await tx.memberBalance.update({
    where: { memberId: order.memberId },
    data: {
      poin: { increment: wallet.poinUsed },
      saldo: { increment: wallet.saldoUsed },
    },
  });
  const nextPoin = balance.poin;
  const nextSaldo = balance.saldo;

  if (wallet.poinUsed > 0) {
    await tx.memberLedgerEntry.create({
      data: {
        memberId: order.memberId,
        kind: MemberLedgerKind.POIN,
        direction: MemberLedgerDirection.CREDIT,
        amount: wallet.poinUsed,
        balanceAfter: nextPoin,
        reason: `Refund order ${order.orderCode} poin`,
      },
    });
  }

  if (wallet.saldoUsed > 0) {
    await tx.memberLedgerEntry.create({
      data: {
        memberId: order.memberId,
        kind: MemberLedgerKind.SALDO,
        direction: MemberLedgerDirection.CREDIT,
        amount: wallet.saldoUsed,
        balanceAfter: nextSaldo,
        reason: `Refund order ${order.orderCode} saldo`,
      },
    });
  }

  return { refunded: true };
}
