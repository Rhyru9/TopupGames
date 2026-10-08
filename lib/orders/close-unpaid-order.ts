import { releaseFlashSaleInTx } from "@/lib/orders/flash-sale-reservation";
import {
  OrderPaymentStatus,
  type Prisma,
} from "@/app/generated/prisma/client";
import { refundOrderWalletInTx } from "@/lib/member/order-wallet";
import { releaseVoucherRedemptionInTx } from "@/lib/promo/voucher-redemption";

type TxClient = Prisma.TransactionClient;

/**
 * Tutup order UNPAID (EXPIRED/FAILED): payment, order, refund poin, lepas voucher.
 * Idempotent — sudah tertutup → closed: false.
 */
export async function closeUnpaidOrderInTx(
  tx: TxClient,
  orderId: string,
  nextStatus: typeof OrderPaymentStatus.EXPIRED | typeof OrderPaymentStatus.FAILED,
): Promise<{ closed: boolean }> {
  await tx.payment.updateMany({
    where: {
      orderId,
      status: OrderPaymentStatus.UNPAID,
    },
    data: { status: nextStatus },
  });

  const orderUpdated = await tx.order.updateMany({
    where: {
      id: orderId,
      paymentStatus: OrderPaymentStatus.UNPAID,
    },
    data: { paymentStatus: nextStatus },
  });

  if (orderUpdated.count === 0) {
    return { closed: false };
  }

  await refundOrderWalletInTx(tx, orderId);
  await releaseVoucherRedemptionInTx(tx, orderId);
  await releaseFlashSaleInTx(tx, orderId);
  return { closed: true };
}
