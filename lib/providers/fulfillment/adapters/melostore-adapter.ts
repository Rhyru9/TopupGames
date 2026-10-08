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
import { mapToMelostoreTarget, resolveGameInputFields } from "@/lib/catalog-products/game-input-fields";
import { extractProviderMessage } from "@/lib/providers/fulfillment/extract-provider-message";

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function mapMelostoreStatus(raw: unknown): ProviderFulfillmentStatus {
  const root = asRecord(raw);
  const data = asRecord(root.data);
  const status = String(data.status ?? root.status ?? "")
    .trim()
    .toLowerCase();

  if (["success", "sukses", "completed", "done"].includes(status)) return "SUCCESS";
  if (["failed", "gagal", "error", "cancelled", "canceled"].includes(status)) return "FAILED";

  if (root.success === false || data.success === false) return "FAILED";
  if (root.success === true || data.success === true) {
    if (!status || status === "pending" || status === "process" || status === "processing") {
      return "PENDING";
    }
  }

  return "PENDING";
}

function melostoreHeaders(apiKey: string, secretKey: string) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-API-Key": apiKey,
    "X-Secret-Key": secretKey,
  };
}

function resolveBaseUrl(apiUrl: string): string {
  return apiUrl.replace(/\/+$/, "");
}

export const melostoreAdapter: FulfillmentAdapter = {
  slug: "melostore",

  mapStatus: mapMelostoreStatus,

  async createOrder(input: CreateOrderInput): Promise<FulfillmentCreateResult> {
    const runtime = await getFulfillmentProviderConfig("melostore");
    if (!runtime?.isConfigured) {
      return {
        status: "FAILED",
        providerRef: input.orderCode,
        message: "Provider Melostore belum dikonfigurasi / tidak aktif.",
        raw: {},
        retryable: false,
      };
    }

    const apiKey = String(runtime.config.apiKey ?? "").trim();
    const secretKey = String(runtime.config.secretKey ?? "").trim();
    const base = resolveBaseUrl(runtime.apiUrl);

    const values = input.playerFields ?? {};
    const config = resolveGameInputFields(null, Boolean(values.zone || values.server));
    const target = mapToMelostoreTarget(values, config);
    if (!target.customer_target) {
      // Fallback: customerNo dari Digiflazz-style (userId+zone digabung) — Melostore prefer pisah.
      if (values.userId) {
        target.customer_target = values.userId;
        if (values.zone) target.customer_target_zone = values.zone;
        else if (values.server) target.customer_target_zone = values.server;
      } else if (input.customerNo) {
        target.customer_target = input.customerNo;
      }
    }

    const providerSku = String(input.providerSku ?? "").trim();
    if (!providerSku) {
      return {
        status: "FAILED",
        providerRef: input.orderCode,
        message: "SKU Melostore (sku_code) kosong pada order.",
        raw: {},
        retryable: false,
      };
    }

    const buyerTrxId = String(input.providerRef ?? input.orderCode).trim() || input.orderCode;

    // sku_code setelah spread target agar tidak tertimpa field lain.
    const body: Record<string, unknown> = {
      buyer_trx_id: buyerTrxId,
      ...target,
      sku_code: providerSku,
    };

    if (input.sandbox || runtime.sandboxMode) {
      body.sandbox_mode = true;
    }

    try {
      const response = await fetch(`${base}/transaction`, {
        method: "POST",
        headers: melostoreHeaders(apiKey, secretKey),
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
          providerRef: buyerTrxId,
          message:
            extractProviderMessage(json, `Melostore HTTP ${response.status}`) ||
            `Melostore HTTP ${response.status}`,
          raw: json,
          requestPayload: body,
          retryable: response.status >= 500 || response.status === 429,
        };
      }

      const data = asRecord(asRecord(json).data);
      const status = mapMelostoreStatus(json);
      const message =
        extractProviderMessage(json) ||
        (status === "FAILED"
          ? "Melostore mengembalikan gagal tanpa pesan."
          : status === "PENDING"
            ? "Menunggu konfirmasi Melostore."
            : undefined);

      return {
        status,
        providerRef: buyerTrxId,
        externalId: String(data.id ?? data.trx_id ?? "").trim() || undefined,
        serial: String(data.sn ?? data.serial ?? data.serial_number ?? "").trim() || undefined,
        message,
        raw: json,
        requestPayload: body,
        retryable: false,
      };
    } catch (error) {
      return {
        status: "FAILED",
        providerRef: buyerTrxId,
        message: error instanceof Error ? error.message : "Gagal menghubungi Melostore.",
        raw: {},
        requestPayload: body,
        retryable: true,
      };
    }
  },

  async getStatus(input: GetStatusInput): Promise<FulfillmentStatusResult> {
    const runtime = await getFulfillmentProviderConfig("melostore");
    if (!runtime?.isConfigured) {
      return {
        status: "FAILED",
        message: "Provider Melostore belum dikonfigurasi / tidak aktif.",
        raw: {},
      };
    }

    const apiKey = String(runtime.config.apiKey ?? "").trim();
    const secretKey = String(runtime.config.secretKey ?? "").trim();
    const base = resolveBaseUrl(runtime.apiUrl);
    const trxId = input.externalId || input.providerRef;

    try {
      const response = await fetch(`${base}/transaction/${encodeURIComponent(trxId)}`, {
        method: "GET",
        headers: melostoreHeaders(apiKey, secretKey),
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
        status: mapMelostoreStatus(json),
        serial: String(data.sn ?? data.serial ?? "").trim() || undefined,
        message: String(data.message ?? "").trim() || undefined,
        raw: json,
      };
    } catch (error) {
      return {
        status: "PENDING",
        message: error instanceof Error ? error.message : "Gagal poll Melostore.",
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
    const orderCode = String(
      data.buyer_trx_id ?? root.buyer_trx_id ?? data.ref_id ?? "",
    ).trim();
    if (!orderCode) return null;

    return {
      orderCode,
      providerRef: orderCode,
      status: mapMelostoreStatus(parsed),
      serial: String(data.sn ?? data.serial ?? "").trim() || undefined,
      message: String(data.message ?? root.message ?? "").trim() || undefined,
      externalId: String(data.id ?? data.trx_id ?? "").trim() || undefined,
      raw: parsed,
    };
  },
};
