import { Queue } from "bullmq";
import { getRedisConnection } from "@/lib/queue/connection";

export const FULFILLMENT_QUEUE_NAME = "process-topup";
export const FULFILLMENT_MAINTENANCE_QUEUE_NAME = "fulfillment-maintenance";

export type ProcessTopupJobData = {
  orderId: string;
  reason?: "paid" | "retry" | "poll";
};

export type FulfillmentMaintenanceJobData = {
  type: "poll-stale";
};

let queue: Queue<ProcessTopupJobData> | null = null;
let maintenanceQueue: Queue<FulfillmentMaintenanceJobData> | null = null;

export function getFulfillmentQueue(): Queue<ProcessTopupJobData> {
  if (queue) return queue;

  queue = new Queue<ProcessTopupJobData>(FULFILLMENT_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 200,
      removeOnFail: 500,
    },
  });

  return queue;
}

export function getFulfillmentMaintenanceQueue(): Queue<FulfillmentMaintenanceJobData> {
  if (maintenanceQueue) return maintenanceQueue;

  maintenanceQueue = new Queue<FulfillmentMaintenanceJobData>(
    FULFILLMENT_MAINTENANCE_QUEUE_NAME,
    {
      connection: getRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    },
  );

  return maintenanceQueue;
}

/** Daftarkan job berulang poll order PROCESSING/QUEUED macet (setiap 2 menit). */
export async function ensureFulfillmentMaintenanceSchedule(): Promise<void> {
  const q = getFulfillmentMaintenanceQueue();
  await q.upsertJobScheduler(
    "poll-stale-fulfillment",
    { every: 2 * 60 * 1000 },
    {
      name: "poll-stale",
      data: { type: "poll-stale" },
    },
  );
}
