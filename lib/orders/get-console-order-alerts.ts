import {
  OrderFulfillmentStatus,
  OrderPaymentStatus,
  type Prisma,
} from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ORDER_FULFILLMENT_STATUS_LABEL,
  type OrderFulfillmentStatusValue,
} from "@/lib/orders/order-status-labels";

export type ConsoleOrderAlertKind = "failed" | "queued" | "processing";

export type ConsoleOrderAlertItem = {
  id: string;
  orderCode: string;
  productName: string;
  kind: ConsoleOrderAlertKind;
  label: string;
  createdAt: string;
};

export type ConsoleOrderAlertSummary = {
  failed: number;
  queued: number;
  processing: number;
  total: number;
  items: ConsoleOrderAlertItem[];
};

const attentionWhere: Prisma.OrderWhereInput = {
  paymentStatus: OrderPaymentStatus.PAID,
  fulfillmentStatus: {
    in: [
      OrderFulfillmentStatus.FAILED,
      OrderFulfillmentStatus.QUEUED,
      OrderFulfillmentStatus.PROCESSING,
    ],
  },
};

function kindFromStatus(status: OrderFulfillmentStatus): ConsoleOrderAlertKind {
  if (status === OrderFulfillmentStatus.FAILED) return "failed";
  if (status === OrderFulfillmentStatus.QUEUED) return "queued";
  return "processing";
}

export async function getConsoleOrderAlerts(
  recentLimit = 8,
): Promise<ConsoleOrderAlertSummary> {
  const [failed, queued, processing, recent] = await Promise.all([
    prisma.order.count({
      where: {
        paymentStatus: OrderPaymentStatus.PAID,
        fulfillmentStatus: OrderFulfillmentStatus.FAILED,
      },
    }),
    prisma.order.count({
      where: {
        paymentStatus: OrderPaymentStatus.PAID,
        fulfillmentStatus: OrderFulfillmentStatus.QUEUED,
      },
    }),
    prisma.order.count({
      where: {
        paymentStatus: OrderPaymentStatus.PAID,
        fulfillmentStatus: OrderFulfillmentStatus.PROCESSING,
      },
    }),
    prisma.order.findMany({
      where: attentionWhere,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: recentLimit,
      select: {
        id: true,
        orderCode: true,
        productNameSnapshot: true,
        fulfillmentStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const items: ConsoleOrderAlertItem[] = recent.map((row) => {
    const kind = kindFromStatus(row.fulfillmentStatus);
    const status = row.fulfillmentStatus as OrderFulfillmentStatusValue;
    return {
      id: row.id,
      orderCode: row.orderCode,
      productName: row.productNameSnapshot,
      kind,
      label: ORDER_FULFILLMENT_STATUS_LABEL[status],
      createdAt: (row.updatedAt ?? row.createdAt).toISOString(),
    };
  });

  return {
    failed,
    queued,
    processing,
    total: failed + queued + processing,
    items,
  };
}
