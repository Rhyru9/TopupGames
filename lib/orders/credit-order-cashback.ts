import { ensureMemberBalanceInTx } from "@/lib/member/ensure-balance-in-tx";
import {
  MemberLedgerDirection,
  MemberLedgerKind,
  OrderPaymentStatus,
  type Prisma,
} from "@/app/generated/prisma/client";

type TxClient = Prisma.TransactionClient;

/**
 * Credit cashback poin for a paid order (idempotent via cashbackCreditedAt on order_wallets).
 */
export async function creditOrderCashbackInTx(
  tx: TxClient,
  orderId: string,
): Promise<{ credited: boolean }> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderCode: true,
      memberId: true,
      paymentStatus: true,
      wallet: {
        select: {
          cashbackPoinSnapshot: true,
          cashbackCreditedAt: true,
        },
      },
    },
  });

  if (order?.paymentStatus !== OrderPaymentStatus.PAID) return { credited: false };
  const wallet = order?.wallet;
  if (!order?.memberId || !wallet) return { credited: false };
  if (wallet.cashbackPoinSnapshot < 1) return { credited: false };
  if (wallet.cashbackCreditedAt) return { credited: false };

  await ensureMemberBalanceInTx(tx, order.memberId);

  const claimed = await tx.orderWallet.updateMany({
    where: {
      orderId: order.id,
      cashbackCreditedAt: null,
      cashbackPoinSnapshot: { gt: 0 },
    },
    data: { cashbackCreditedAt: new Date() },
  });

  if (claimed.count === 0) return { credited: false };

  const amount = wallet.cashbackPoinSnapshot;
  const balance = await tx.memberBalance.update({
    where: { memberId: order.memberId },
    data: { poin: { increment: amount } },
  });
  const next = balance.poin;

  await tx.memberLedgerEntry.create({
    data: {
      memberId: order.memberId,
      kind: MemberLedgerKind.POIN,
      direction: MemberLedgerDirection.CREDIT,
      amount,
      balanceAfter: next,
      reason: `Cashback order ${order.orderCode}`,
    },
  });

  return { credited: true };
}
