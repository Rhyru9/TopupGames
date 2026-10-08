import {
  type Prisma,
  type OrderPaymentStatus,
  type OrderFulfillmentStatus,
} from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type OrderListItem = {
  id: string;
  orderCode: string;
  productNameSnapshot: string;
  skuNameSnapshot: string;
  amount: number;
  email: string | null;
  whatsapp: string | null;
  playerLabel: string | null;
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
  fulfillmentMessage: string | null;
  providerSlug: string | null;
  providerSkuSnapshot: string | null;
  createdAt: Date;
};

export async function listOrders(options: {
  q?: string;
  /** Kosong / undefined = semua status bayar. */
  paymentStatus?: OrderPaymentStatus | "";
  fulfillmentStatus?: OrderFulfillmentStatus | "";
  /** Filter `createdAt` inklusif (opsional). */
  from?: Date;
  to?: Date;
  skip?: number;
  take?: number;
}): Promise<{ orders: OrderListItem[]; total: number }> {
  const q = options.q?.trim();
  const paymentStatus = options.paymentStatus || undefined;
  const where: Prisma.OrderWhereInput = {
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(options.fulfillmentStatus
      ? { fulfillmentStatus: options.fulfillmentStatus }
      : {}),
    ...(options.from || options.to
      ? {
          createdAt: {
            ...(options.from ? { gte: options.from } : {}),
            ...(options.to ? { lte: options.to } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { orderCode: { contains: q } },
            { email: { contains: q } },
            { whatsapp: { contains: q } },
            { productNameSnapshot: { contains: q } },
            { skuNameSnapshot: { contains: q } },
            { playerLabel: { contains: q } },
            { providerSlug: { contains: q } },
            { providerSkuSnapshot: { contains: q } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: options.skip ?? 0,
      take: options.take ?? 15,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        orderCode: true,
        productNameSnapshot: true,
        skuNameSnapshot: true,
        amount: true,
        email: true,
        whatsapp: true,
        playerLabel: true,
        paymentStatus: true,
        fulfillmentStatus: true,
        fulfillmentMessage: true,
        providerSlug: true,
        providerSkuSnapshot: true,
        createdAt: true,
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
      email: row.email,
      whatsapp: row.whatsapp,
      playerLabel: row.playerLabel,
      paymentStatus: row.paymentStatus,
      fulfillmentStatus: row.fulfillmentStatus,
      fulfillmentMessage: row.fulfillmentMessage,
      providerSlug: row.providerSlug,
      providerSkuSnapshot: row.providerSkuSnapshot,
      createdAt: row.createdAt,
    })),
  };
}

export async function getOrderAdminDetail(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      wallet: true,
      payments: {
        orderBy: { createdAt: "desc" },
      },
      member: {
        select: { id: true, memberCode: true, name: true, email: true },
      },
      productSku: {
        select: { id: true, name: true, providerSku: true },
      },
      fulfillmentLogs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export type RetryNominalOption = {
  id: string;
  name: string;
  providerSku: string;
  providerSlug: string;
  providerName: string;
  status: string;
};

export async function listRetryNominalOptions(
  productId: string,
): Promise<RetryNominalOption[]> {
  const rows = await prisma.productSku.findMany({
    where: { productId },
    orderBy: [{ status: "asc" }, { costPrice: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      providerSku: true,
      status: true,
      provider: { select: { slug: true, name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    providerSku: row.providerSku,
    providerSlug: row.provider.slug,
    providerName: row.provider.name,
    status: row.status,
  }));
}
