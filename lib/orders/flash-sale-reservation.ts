import type { Prisma } from "@/app/generated/prisma/client";

export async function reserveFlashSaleInTx(
  tx: Prisma.TransactionClient,
  input: { flashSaleItemId: string | null; itemSubtotal: number; isMember: boolean },
) {
  if (!input.flashSaleItemId) return;
  const now = new Date();
  const claimed = await tx.flashSaleItem.updateMany({
    where: {
      id: input.flashSaleItemId,
      soldCount: { lt: tx.flashSaleItem.fields.quota },
      [input.isMember ? "priceMember" : "priceGuest"]: input.itemSubtotal,
      flashSale: { isEnabled: true, startsAt: { lte: now }, endsAt: { gt: now } },
    },
    data: { soldCount: { increment: 1 } },
  });
  if (claimed.count !== 1) throw new Error("Kuota/harga flash sale berubah. Muat ulang checkout.");
}

export async function releaseFlashSaleInTx(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.findUnique({ where: { id: orderId }, select: { flashSaleItemId: true } });
  if (!order?.flashSaleItemId) return;
  const released = await tx.order.updateMany({
    where: { id: orderId, paymentStatus: { in: ["EXPIRED", "FAILED"] }, flashSaleReleasedAt: null },
    data: { flashSaleReleasedAt: new Date() },
  });
  if (released.count !== 1) return;
  await tx.flashSaleItem.updateMany({
    where: { id: order.flashSaleItemId, soldCount: { gt: 0 } },
    data: { soldCount: { decrement: 1 } },
  });
}
