import { prisma } from "@/lib/prisma";
import type {
  OrderFulfillmentStatusValue,
  OrderPaymentStatusValue,
} from "@/lib/orders/order-status-labels";

export type MemberOrderListItem = {
  id: string;
  orderCode: string;
  productNameSnapshot: string;
  skuNameSnapshot: string;
  amount: number;
  paymentStatus: OrderPaymentStatusValue;
  fulfillmentStatus: OrderFulfillmentStatusValue;
  createdAt: Date;
  channel: string | null;
  thumbnailUrl: string | null;
};

export const MEMBER_ORDERS_PAGE_SIZE = 15;

export async function listMemberOrders(options: {
  memberId: string;
  q?: string;
  skip?: number;
  take?: number;
}): Promise<{ orders: MemberOrderListItem[]; total: number }> {
  const q = options.q?.trim() || "";
  const where = {
    memberId: options.memberId,
    ...(q
      ? {
          orderCode: { contains: q },
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: options.skip ?? 0,
      take: options.take ?? MEMBER_ORDERS_PAGE_SIZE,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        orderCode: true,
        productNameSnapshot: true,
        skuNameSnapshot: true,
        amount: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        createdAt: true,
        product: {
          select: { thumbnailUrl: true },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { channel: true, channelName: true },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    total,
    orders: rows.map((row) => ({
      id: row.id,
      orderCode: row.orderCode,
      productNameSnapshot: row.productNameSnapshot,
      skuNameSnapshot: row.skuNameSnapshot,
      amount: row.amount,
      paymentStatus: row.paymentStatus as OrderPaymentStatusValue,
      fulfillmentStatus: row.fulfillmentStatus as OrderFulfillmentStatusValue,
      createdAt: row.createdAt,
      channel: row.payments[0]?.channelName || row.payments[0]?.channel || null,
      thumbnailUrl: row.product.thumbnailUrl || null,
    })),
  };
}
