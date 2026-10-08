import { getFulfillmentQueue } from "@/lib/queue/fulfillment-queue";

/**
 * Enqueue job process-topup. jobId = orderId → idempotent (tidak double-queue).
 */
export async function enqueueProcessTopup(
  orderId: string,
  reason: "paid" | "retry" | "poll" = "paid",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = String(orderId ?? "").trim();
  if (!id) return { ok: false, error: "orderId kosong." };

  try {
    const queue = getFulfillmentQueue();
    await queue.add(
      "process-topup",
      { orderId: id, reason },
      {
        jobId:
          reason === "retry" || reason === "poll"
            ? `${reason}-${id}-${Date.now()}`
            : id,
      },
    );
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal enqueue fulfillment.";
    console.error("[enqueue-fulfillment]", id, message);
    return { ok: false, error: message };
  }
}
