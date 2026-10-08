import {
  OrderFulfillmentStatus,
  OrderPaymentStatus,
} from "@/app/generated/prisma/client";
import { enqueueProcessTopup } from "@/lib/orders/enqueue-fulfillment";
import { pollOrderFulfillmentById } from "@/lib/orders/poll-order-fulfillment";
import { prisma } from "@/lib/prisma";

const STALE_PROCESSING_MS = 5 * 60 * 1000;
const STALE_QUEUED_MS = 2 * 60 * 1000;

/**
 * Poll order PROCESSING yang sudah lama, dan re-enqueue QUEUED yang macet.
 */
export async function pollStaleFulfillments(): Promise<{
  polled: number;
  requeued: number;
  updated: number;
}> {
  const now = Date.now();
  let polled = 0;
  let requeued = 0;
  let updated = 0;

  const staleQueued = await prisma.order.findMany({
    where: {
      paymentStatus: OrderPaymentStatus.PAID,
      fulfillmentStatus: OrderFulfillmentStatus.QUEUED,
      OR: [
        { fulfillmentAttemptedAt: null, createdAt: { lt: new Date(now - STALE_QUEUED_MS) } },
        { fulfillmentAttemptedAt: { lt: new Date(now - STALE_QUEUED_MS) } },
      ],
    },
    select: { id: true },
    take: 50,
  });

  for (const row of staleQueued) {
    const result = await enqueueProcessTopup(row.id, "poll");
    if (result.ok) requeued += 1;
  }

  const staleProcessing = await prisma.order.findMany({
    where: {
      paymentStatus: OrderPaymentStatus.PAID,
      fulfillmentStatus: OrderFulfillmentStatus.PROCESSING,
      fulfillmentAttemptedAt: { lt: new Date(now - STALE_PROCESSING_MS) },
    },
    select: { id: true },
    take: 30,
  });

  for (const order of staleProcessing) {
    polled += 1;
    try {
      const result = await pollOrderFulfillmentById(order.id);
      if (result.ok && result.updated) updated += 1;
    } catch (error) {
      console.error("[poll-stale] failed", order.id, error);
    }
  }

  return { polled, requeued, updated };
}
