import { OrderPaymentStatus } from "@/app/generated/prisma/client";
import { notifyOrderFailed } from "@/lib/mail/transaction-notifications";
import { closeUnpaidOrderInTx } from "@/lib/orders/close-unpaid-order";
import { prisma } from "@/lib/prisma";

const GRACE_MS = 5 * 60 * 1000;

export async function expireUnpaidOrders(now = new Date()) {
  const cutoff = new Date(now.getTime() - GRACE_MS);
  const fallbackCreated = new Date(now.getTime() - 25 * 60 * 60 * 1000);

  const due = await prisma.order.findMany({
    where: {
      paymentStatus: OrderPaymentStatus.UNPAID,
      OR: [
        { expiresAt: { lte: cutoff } },
        { expiresAt: null, createdAt: { lte: fallbackCreated } },
      ],
    },
    select: { id: true, orderCode: true },
    take: 80,
  });

  let expired = 0;
  const errors: string[] = [];

  for (const order of due) {
    try {
      const result = await prisma.$transaction(async (tx) =>
        closeUnpaidOrderInTx(tx, order.id, OrderPaymentStatus.EXPIRED),
      );
      if (result.closed) {
        expired += 1;
        void notifyOrderFailed(order.id, "EXPIRED").catch((err) =>
          console.error("[expire-unpaid] notify failed", order.orderCode, err),
        );
      }
    } catch (error) {
      errors.push(
        `${order.orderCode}: ${error instanceof Error ? error.message : "gagal"}`,
      );
    }
  }

  return { scanned: due.length, expired, errors };
}
