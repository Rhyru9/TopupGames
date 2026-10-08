import { md5 } from "@/lib/providers/catalog/provider-md5";
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

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

/**
 * IAK prepaid status codes:
 * 0 = process, 1 = success, 2 = failed
 */
function mapIakStatus(raw: unknown): ProviderFulfillmentStatus {
  const root = asRecord(raw);
  const data = asRecord(root.data);
  const status = String(data.status ?? root.status ?? "").trim();
  if (status === "1" || status.toLowerCase() === "success") return "SUCCESS";
  if (status === "2" || status.toLowerCase() === "failed") return "FAILED";
  return "PENDING";
}

function iakHost(sandbox: boolean): string {
  return sandbox ? "https://prepaid.iak.dev" : "https://prepaid.iak.id";
}

export const iakAdapter: FulfillmentAdapter = {
  slug: "iak",

  mapStatus: mapIakStatus,

  async createOrder(input: CreateOrderInput): Promise<FulfillmentCreateResult> {
    const runtime = await getFulfillmentProviderConfig("iak");
    if (!runtime?.isConfigured) {
      return {
        status: "FAILED",
        providerRef: input.orderCode,
        message: "Provider IAK belum dikonfigurasi / tidak aktif.",
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
        message: "SKU IAK (product_code) kosong pada order.",
        raw: {},
        retryable: false,
      };
    }

    const customerId = String(input.customerNo ?? "").trim();
    if (!customerId) {
      return {
        status: "FAILED",
        providerRef: input.orderCode,
        message: "customer_id IAK kosong pada order.",
        raw: {},
        retryable: false,
      };
    }

    // Retry setelah FAILED harus ref_id baru (sama = cek status, bukan top-up baru).
    const refId = String(input.providerRef ?? input.orderCode).trim() || input.orderCode;
    const sandbox = input.sandbox || runtime.sandboxMode;
    const url = `${iakHost(sandbox)}/api/top-up`;

    const body = {
      username,
      ref_id: refId,
      customer_id: customerId,
      product_code: providerSku,
      sign: md5(`${username}${apiKey}${refId}`),
    };

    try {
      const response = await fetch(url, {
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
          status: "FAILED",
          providerRef: refId,
          message:
            extractProviderMessage(json, `IAK HTTP ${response.status}`) ||
            `IAK HTTP ${response.status}`,
          raw: json,
          requestPayload: body,
          retryable: response.status >= 500 || response.status === 429,
        };
      }

      const data = asRecord(asRecord(json).data);
      const status = mapIakStatus(json);
      return {
        status,
        providerRef: refId,
        externalId: String(data.tr_id ?? data.trxid ?? data.trx_id ?? "").trim() || undefined,
        serial: String(data.sn ?? "").trim() || undefined,
        message:
          extractProviderMessage(json) ||
          (status === "FAILED" ? "IAK mengembalikan gagal tanpa pesan." : undefined),
        raw: json,
        requestPayload: body,
        retryable: false,
      };
    } catch (error) {
      return {
        status: "FAILED",
        providerRef: refId,
        message: error instanceof Error ? error.message : "Gagal menghubungi IAK.",
        raw: {},
        requestPayload: body,
        retryable: true,
      };
    }
  },

  async getStatus(input: GetStatusInput): Promise<FulfillmentStatusResult> {
    const runtime = await getFulfillmentProviderConfig("iak");
    if (!runtime?.isConfigured) {
      return {
        status: "FAILED",
        message: "Provider IAK belum dikonfigurasi / tidak aktif.",
        raw: {},
      };
    }

    const username = String(runtime.config.username ?? "").trim();
    const apiKey = String(runtime.config.apiKey ?? "").trim();
    const refId = input.providerRef || input.orderCode;
    const sandbox = input.sandbox || runtime.sandboxMode;
    const url = `${iakHost(sandbox)}/api/check-status`;

    const body = {
      username,
      ref_id: refId,
      sign: md5(`${username}${apiKey}${refId}`),
    };

    try {
      const response = await fetch(url, {
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
        return { status: "PENDING", message: `HTTP ${response.status}`, raw: json };
      }

      const data = asRecord(asRecord(json).data);
      return {
        status: mapIakStatus(json),
        serial: String(data.sn ?? "").trim() || undefined,
        message: String(data.message ?? "").trim() || undefined,
        raw: json,
      };
    } catch (error) {
      return {
        status: "PENDING",
        message: error instanceof Error ? error.message : "Gagal poll IAK.",
        raw: {},
      };
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
      status: mapIakStatus(parsed),
      serial: String(data.sn ?? root.sn ?? "").trim() || undefined,
      message: String(data.message ?? root.message ?? "").trim() || undefined,
      externalId: String(data.tr_id ?? data.trxid ?? data.trx_id ?? "").trim() || undefined,
      raw: parsed,
    };
  },
};
