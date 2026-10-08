import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type {
  CreateOrderInput,
  FulfillmentAdapter,
  FulfillmentCreateResult,
  FulfillmentStatusResult,
  GetStatusInput,
  ProviderFulfillmentStatus,
  WebhookUpdate,
} from "@/lib/providers/fulfillment/types";
import { getFulfillmentProviderConfig } from "@/lib/providers/get-provider-config";
import { extractProviderMessage } from "@/lib/providers/fulfillment/extract-provider-message";

function digiflazzSign(username: string, apiKey: string, refId: string): string {
  return createHash("md5").update(`${username}${apiKey}${refId}`).digest("hex");
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function mapDigiflazzStatus(raw: unknown): ProviderFulfillmentStatus {
  const data = asRecord(raw);
  const payload = asRecord(data.data);
  const status = String(payload.status ?? data.status ?? "")
    .trim()
    .toLowerCase();

  if (status === "sukses" || status === "success") return "SUCCESS";
  if (status === "gagal" || status === "failed" || status === "error") return "FAILED";
  return "PENDING";
}

async function postDigiflazzTransaction(body: Record<string, unknown>, apiUrl: string) {
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    json = { raw: text, httpStatus: response.status };
  }

  if (!response.ok) {
    return {
      ok: false as const,
      raw: json,
      message:
        extractProviderMessage(json, `HTTP ${response.status}`) ||
        `HTTP ${response.status}`,
      retryable: response.status >= 500 || response.status === 429,
    };
  }

  return { ok: true as const, raw: json };
}

export const digiflazzAdapter: FulfillmentAdapter = {
  slug: "digiflazz",

  mapStatus: mapDigiflazzStatus,

  async createOrder(input: CreateOrderInput): Promise<FulfillmentCreateResult> {
    const runtime = await getFulfillmentProviderConfig("digiflazz");
    if (!runtime?.isConfigured) {
      return {
        status: "FAILED",
        providerRef: input.orderCode,
        message: "Provider Digiflazz belum dikonfigurasi / tidak aktif.",
        raw: {},
        retryable: false,
      };
    }

    const username = String(runtime.config.username ?? "").trim();
    const apiKey = String(runtime.config.apiKey ?? "").trim();
    const providerSku = String(input.providerSku ?? "").trim();
    if (!providerSku) {
      return {
        status: "FAILED",
        providerRef: input.orderCode,
        message: "SKU Digiflazz (buyer_sku_code) kosong pada order.",
        raw: {},
        retryable: false,
      };
    }

    const customerNo = String(input.customerNo ?? "").trim();
    if (!customerNo) {
      return {
        status: "FAILED",
        providerRef: input.orderCode,
        message: "customer_no Digiflazz kosong pada order.",
        raw: {},
        retryable: false,
      };
    }

    const refId = input.providerRef?.trim() || input.orderCode;
    const body: Record<string, unknown> = {
      username,
      buyer_sku_code: providerSku,
      customer_no: customerNo,
      ref_id: refId,
      sign: digiflazzSign(username, apiKey, refId),
    };

    if (input.sandbox || runtime.sandboxMode) {
      body.testing = true;
    }

    const result = await postDigiflazzTransaction(body, runtime.apiUrl);
    if (!result.ok) {
      return {
        status: "FAILED",
        providerRef: refId,
        message: result.message,
        raw: result.raw,
        requestPayload: body,
        retryable: result.retryable,
      };
    }

    const status = mapDigiflazzStatus(result.raw);
    const data = asRecord(asRecord(result.raw).data);
    const message =
      extractProviderMessage(result.raw) ||
      String(data.message ?? asRecord(result.raw).message ?? "").trim() ||
      undefined;
    const serial = String(data.sn ?? "").trim() || undefined;

    return {
      status,
      providerRef: refId,
      externalId: String(data.trx_id ?? "").trim() || undefined,
      serial,
      message:
        message ||
        (status === "FAILED"
          ? "Provider Digiflazz mengembalikan gagal tanpa pesan."
          : status === "PENDING"
            ? "Menunggu konfirmasi Digiflazz."
            : undefined),
      raw: result.raw,
      requestPayload: body,
      retryable: false,
    };
  },

  async getStatus(input: GetStatusInput): Promise<FulfillmentStatusResult> {
    const runtime = await getFulfillmentProviderConfig("digiflazz");
    if (!runtime?.isConfigured) {
      return {
        status: "FAILED",
        message: "Provider Digiflazz belum dikonfigurasi / tidak aktif.",
        raw: {},
      };
    }

    const username = String(runtime.config.username ?? "").trim();
    const apiKey = String(runtime.config.apiKey ?? "").trim();
    const refId = input.providerRef || input.orderCode;
    const body: Record<string, unknown> = {
      username,
      buyer_sku_code: input.providerSku,
      customer_no: input.customerNo,
      ref_id: refId,
      sign: digiflazzSign(username, apiKey, refId),
    };

    if (input.sandbox || runtime.sandboxMode) {
      body.testing = true;
    }

    // Digiflazz: cek status = kirim ulang transaksi dengan ref_id sama (idempotent).
    const result = await postDigiflazzTransaction(body, runtime.apiUrl);
    if (!result.ok) {
      return { status: "PENDING", message: result.message, raw: result.raw };
    }

    const status = mapDigiflazzStatus(result.raw);
    const data = asRecord(asRecord(result.raw).data);

    return {
      status,
      serial: String(data.sn ?? "").trim() || undefined,
      message: String(data.message ?? "").trim() || undefined,
      raw: result.raw,
    };
  },

  verifyWebhook(rawBody: string, headers: Headers, secret: string): boolean {
    const signature = headers.get("x-hub-signature") ?? "";
    if (!signature || !secret) return false;

    const expected = `sha1=${createHmac("sha1", secret).update(rawBody).digest("hex")}`;
    try {
      const a = Buffer.from(expected, "utf8");
      const b = Buffer.from(signature.trim(), "utf8");
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  },

  parseWebhook(rawBody: string): WebhookUpdate | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody) as unknown;
    } catch {
      return null;
    }

    const root = asRecord(parsed);
    const data = asRecord(root.data);
    const refId = String(data.ref_id ?? root.ref_id ?? "").trim();
    if (!refId) return null;

    return {
      orderCode: refId,
      providerRef: refId,
      status: mapDigiflazzStatus(parsed),
      serial: String(data.sn ?? "").trim() || undefined,
      message: String(data.message ?? "").trim() || undefined,
      externalId: String(data.trx_id ?? "").trim() || undefined,
      raw: parsed,
    };
  },
};
