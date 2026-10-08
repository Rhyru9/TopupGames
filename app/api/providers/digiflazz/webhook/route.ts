import { getFulfillmentProviderConfig } from "@/lib/providers/get-provider-config";
import { digiflazzAdapter } from "@/lib/providers/fulfillment/adapters/digiflazz-adapter";
import { applyFulfillmentUpdate } from "@/lib/orders/apply-fulfillment-update";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();

  const provider = await getFulfillmentProviderConfig("digiflazz");
  if (!provider?.isConfigured) {
    return Response.json({ error: "Provider belum dikonfigurasi" }, { status: 503 });
  }

  const secret = String(provider.config.webhookSecret ?? "").trim();
  if (!secret) {
    return Response.json({ error: "Webhook secret belum diisi" }, { status: 503 });
  }

  if (!digiflazzAdapter.verifyWebhook?.(rawBody, request.headers, secret)) {
    return Response.json({ error: "Signature tidak valid" }, { status: 401 });
  }

  const update = digiflazzAdapter.parseWebhook?.(rawBody);
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
    providerSlug: "digiflazz",
    action: "WEBHOOK",
    responsePayload: update.raw,
  });

  if (!result.ok && !result.skipped) {
    return Response.json({ error: result.reason ?? "Gagal update" }, { status: 404 });
  }

  return Response.json({ received: true });
}
