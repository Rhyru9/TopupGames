import { type OrderPaymentStatus, type Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type OrderPaymentListItem = {
  id: string;
  orderId: string | null;
  orderCode: string | null;
  provider: string;
  channel: string;
  channelName: string | null;
  reference: string;
  amount: number;
  status: OrderPaymentStatus;
  paidAt: Date | null;
  createdAt: Date;
  productName: string | null;
};

export async function listOrderPayments(options: {
  q?: string;
  paymentStatus?: OrderPaymentStatus | "";
  skip?: number;
  take?: number;
}): Promise<{ payments: OrderPaymentListItem[]; total: number }> {
  const q = options.q?.trim();
  const where: Prisma.PaymentWhereInput = {
    orderId: { not: null },
    ...(options.paymentStatus ? { status: options.paymentStatus } : {}),
    ...(q
      ? {
          OR: [
            { reference: { contains: q } },
            { channel: { contains: q } },
            { channelName: { contains: q } },
            { order: { orderCode: { contains: q } } },
            { order: { email: { contains: q } } },
            { order: { productNameSnapshot: { contains: q } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip: options.skip ?? 0,
      take: options.take ?? 15,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        orderId: true,
        provider: true,
        channel: true,
        channelName: true,
        reference: true,
        amount: true,
        status: true,
        paidAt: true,
        createdAt: true,
        order: {
          select: {
            orderCode: true,
            productNameSnapshot: true,
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    total,
    payments: rows.map((row) => ({
      id: row.id,
      orderId: row.orderId,
      orderCode: row.order?.orderCode ?? null,
      provider: row.provider,
      channel: row.channel,
      channelName: row.channelName,
      reference: row.reference,
      amount: row.amount,
      status: row.status,
      paidAt: row.paidAt,
      createdAt: row.createdAt,
      productName: row.order?.productNameSnapshot ?? null,
    })),
  };
}

export async function getOrderPaymentAdminDetail(id: string) {
  return prisma.payment.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          id: true,
          orderCode: true,
          productNameSnapshot: true,
          skuNameSnapshot: true,
          amount: true,
          paymentStatus: true,
          fulfillmentStatus: true,
          email: true,
          whatsapp: true,
        },
      },
    },
  });
}
