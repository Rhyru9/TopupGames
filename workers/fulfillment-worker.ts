import "dotenv/config";
import { Worker } from "bullmq";
import { processOrderFulfillment } from "@/lib/orders/process-fulfillment";
import { pollStaleFulfillments } from "@/lib/orders/poll-stale-fulfillment";
import { getRedisConnection } from "@/lib/queue/connection";
import {
  ensureFulfillmentMaintenanceSchedule,
  FULFILLMENT_MAINTENANCE_QUEUE_NAME,
  FULFILLMENT_QUEUE_NAME,
  type FulfillmentMaintenanceJobData,
  type ProcessTopupJobData,
} from "@/lib/queue/fulfillment-queue";

const connection = getRedisConnection();

const worker = new Worker<ProcessTopupJobData>(
  FULFILLMENT_QUEUE_NAME,
  async (job) => {
    const orderId = job.data.orderId;

    const result = await processOrderFulfillment(orderId, {
      forceRetry: job.data.reason === "retry",
    });

    if (!result.ok && result.retryable) {
      throw new Error(result.error);
    }

    if (!result.ok) {
      console.error(`[fulfillment-worker] permanent fail order=${orderId}: ${result.error}`);
      return result;
    }

    return result;
  },
  {
    connection,
    concurrency: 5,
  },
);

const maintenanceWorker = new Worker<FulfillmentMaintenanceJobData>(
  FULFILLMENT_MAINTENANCE_QUEUE_NAME,
  async (job) => {
    if (job.data.type !== "poll-stale") return;
    return pollStaleFulfillments();
  },
  {
    connection,
    concurrency: 1,
  },
);

worker.on("failed", (job, err) => {
  console.error(`[fulfillment-worker] failed job=${job?.id}`, err.message);
});

void ensureFulfillmentMaintenanceSchedule().catch((err) =>
  console.error("[fulfillment-maintenance] schedule failed", err),
);

async function shutdown() {
  await Promise.all([worker.close(), maintenanceWorker.close()]);
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
