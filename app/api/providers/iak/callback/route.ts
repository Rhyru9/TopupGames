import { applyFulfillmentUpdate } from "@/lib/orders/apply-fulfillment-update";
import { asRecord } from "@/lib/providers/catalog/catalog-types";
import { md5 } from "@/lib/providers/catalog/provider-md5";
import { iakAdapter } from "@/lib/providers/fulfillment/adapters/iak-adapter";
import { getFulfillmentProviderConfig } from "@/lib/providers/get-provider-config";
import { timingSafeEqual } from "node:crypto";

/**
 * Callback prepaid IAK — status akhir transaksi (success/failed).
 * Docs: https://api.iak.id/api/prepaid/callback
 * Sign: md5(username + api_key + ref_id)
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  let payload: Record<string, unknown> = {};
  try {
    payload = asRecord(JSON.parse(rawBody));
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const refId = String(payload.ref_id ?? "").trim();
  const sign = String(payload.sign ?? "").trim();

  if (!refId || !sign) {
    return Response.json({ error: "Payload callback tidak lengkap" }, { status: 400 });
  }

  const provider = await getFulfillmentProviderConfig("iak");
  if (!provider?.isConfigured) {
    return Response.json({ error: "Provider belum dikonfigurasi" }, { status: 503 });
  }

  const username = String(provider.config.username ?? "").trim();
  const apiKey = String(provider.config.apiKey ?? "").trim();
  if (!username || !apiKey) {
    return Response.json({ error: "Kredensial IAK belum lengkap" }, { status: 503 });
  }

  const expected = md5(`${username}${apiKey}${refId}`);
  const expectedBuf = Buffer.from(expected, "utf8");
  const signBuf = Buffer.from(sign, "utf8");
  if (expectedBuf.length !== signBuf.length || !timingSafeEqual(expectedBuf, signBuf)) {
    return Response.json({ error: "Signature tidak valid" }, { status: 401 });
  }

  const update = iakAdapter.parseWebhook?.(rawBody) ?? {
    orderCode: refId,
    providerRef: refId,
    status: iakAdapter.mapStatus(payload),
    serial: String(payload.sn ?? "").trim() || undefined,
    message: String(payload.message ?? "").trim() || undefined,
    raw: payload,
  };

  const result = await applyFulfillmentUpdate({
    orderCode: update.orderCode,
    providerRef: update.providerRef,
    status: update.status,
    serial: update.serial,
    message: update.message,
    externalId: update.externalId,
    providerSlug: "iak",
    action: "WEBHOOK",
    responsePayload: update.raw,
  });

  if (!result.ok && !result.skipped) {
    return Response.json({ error: result.reason ?? "Gagal update" }, { status: 404 });
  }

  return Response.json({ received: true });
}
