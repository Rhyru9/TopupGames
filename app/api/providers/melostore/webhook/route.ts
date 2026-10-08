import { createHmac, timingSafeEqual } from "node:crypto";
import { applyFulfillmentUpdate } from "@/lib/orders/apply-fulfillment-update";
import { melostoreAdapter } from "@/lib/providers/fulfillment/adapters/melostore-adapter";
import { getFulfillmentProviderConfig } from "@/lib/providers/get-provider-config";

function verifySignature(rawBody: string, secret: string, signature: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = signature.trim();

  try {
    const expectedBuf = Buffer.from(expected, "utf8");
    const receivedBuf = Buffer.from(received, "utf8");
    if (expectedBuf.length !== receivedBuf.length) return false;
    return timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-h2h-signature") ?? "";

  const provider = await getFulfillmentProviderConfig("melostore");
  if (!provider?.isConfigured) {
    return Response.json({ error: "Provider belum dikonfigurasi" }, { status: 503 });
  }

  const webhookSecret = String(provider.config.webhookSecret ?? "").trim();
  const fallbackSecret = String(provider.config.secretKey ?? "").trim();
  const secret = webhookSecret || fallbackSecret;

  if (!secret) {
    return Response.json({ error: "Webhook secret belum diisi" }, { status: 503 });
  }

  if (!signature || !verifySignature(rawBody, secret, signature)) {
    return Response.json({ error: "Signature tidak valid" }, { status: 401 });
  }

  const update = melostoreAdapter.parseWebhook?.(rawBody);
  if (!update) {
    return Response.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const result = await applyFulfillmentUpdate({
    orderCode: update.orderCode,
    providerRef: update.providerRef,
    status: update.status,
    serial: update.serial,
    message: update.message,
    externalId: update.externalId,
    providerSlug: "melostore",
    action: "WEBHOOK",
    responsePayload: update.raw,
  });

  if (!result.ok && !result.skipped) {
    return Response.json({ error: result.reason ?? "Gagal update" }, { status: 404 });
  }

  return Response.json({ received: true });
}
