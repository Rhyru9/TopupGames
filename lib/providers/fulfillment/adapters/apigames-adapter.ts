import { md5 } from "@/lib/providers/catalog/provider-md5";
import type {
  CreateOrderInput,
  FulfillmentAdapter,
  FulfillmentCreateResult,
  FulfillmentStatusResult,
  GetStatusInput,
  ProviderFulfillmentStatus,
} from "@/lib/providers/fulfillment/types";
import { getFulfillmentProviderConfig } from "@/lib/providers/get-provider-config";
import { extractProviderMessage } from "@/lib/providers/fulfillment/extract-provider-message";

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function mapApiGamesStatus(raw: unknown): ProviderFulfillmentStatus {
  const root = asRecord(raw);
  const data = asRecord(root.data);
  const status = String(data.status ?? root.status ?? "")
    .trim()
    .toLowerCase();

  if (["sukses", "success", "1"].includes(status)) return "SUCCESS";
  if (["gagal", "failed", "0", "2", "error"].includes(status)) return "FAILED";
  return "PENDING";
}

/** Docs v2 transaksi: md5(merchant_id:secret_key:ref_id) — pakai colon. */
function apigamesTrxSign(merchantId: string, secretKey: string, refId: string): string {
  return md5(`${merchantId}:${secretKey}:${refId}`);
}

function resolveBase(apiUrl: string): string {
  const base = apiUrl.replace(/\/+$/, "");
  if (base.endsWith("/v2")) return base;
  return `${base}/v2`;
}

/**
 * Pisah userId / zone untuk field tujuan + server_id.
 * Fallback: customerNo Digiflazz-style (`userIdzone` atau `userId|server`).
 */
function resolveTujuanAndServer(input: CreateOrderInput): {
  tujuan: string;
  serverId: string;
} {
  const values = input.playerFields ?? {};
  const userId = String(values.userId ?? "").trim();
  const zone = String(values.zone ?? values.server ?? "").trim();

  if (userId) {
    return { tujuan: userId, serverId: zone };
  }

  const customerNo = String(input.customerNo ?? "").trim();
  if (customerNo.includes("|")) {
    const [left, right = ""] = customerNo.split("|", 2);
    return { tujuan: left.trim(), serverId: right.trim() };
  }

  return { tujuan: customerNo, serverId: "" };
}

/**
 * API Games — order + status saja.
 * Nickname tetap lewat Melostore (`/api/nickname/check`).
 */
export const apigamesAdapter: FulfillmentAdapter = {
  slug: "apigames",

  mapStatus: mapApiGamesStatus,

  async createOrder(input: CreateOrderInput): Promise<FulfillmentCreateResult> {
    const runtime = await getFulfillmentProviderConfig("apigames");
    if (!runtime?.isConfigured) {
      return {
        status: "FAILED",
        providerRef: input.orderCode,
        message: "Provider API Games belum dikonfigurasi / tidak aktif.",
        raw: {},
        retryable: false,
      };
    }

    const merchantId = String(
      runtime.config.merchantId ?? runtime.config.merchant_id ?? "",
    ).trim();
    const secretKey = String(
      runtime.config.secretKey ?? runtime.config.apiKey ?? "",
    ).trim();
    if (!merchantId || !secretKey) {
      return {
        status: "FAILED",
        providerRef: input.orderCode,
        message: "Kredensial API Games belum lengkap (merchantId / secretKey).",
        raw: {},
        retryable: false,
      };
    }

    const providerSku = String(input.providerSku ?? "").trim();
    if (!providerSku) {
      return {
        status: "FAILED",
        providerRef: input.orderCode,
        message: "SKU API Games (produk) kosong pada order.",
        raw: {},
        retryable: false,
      };
    }

    const refId = String(input.providerRef ?? input.orderCode).trim() || input.orderCode;
    const { tujuan, serverId } = resolveTujuanAndServer(input);
    if (!tujuan) {
      return {
        status: "FAILED",
        providerRef: refId,
        message: "Tujuan (user ID) kosong pada order.",
        raw: {},
        retryable: false,
      };
    }

    const body = {
      ref_id: refId,
      merchant_id: merchantId,
      produk: providerSku,
      tujuan,
      server_id: serverId,
      signature: apigamesTrxSign(merchantId, secretKey, refId),
    };

    try {
      const response = await fetch(`${resolveBase(runtime.apiUrl)}/transaksi`, {
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
            extractProviderMessage(json, `API Games HTTP ${response.status}`) ||
            `API Games HTTP ${response.status}`,
          raw: json,
          requestPayload: body,
          retryable: response.status >= 500 || response.status === 429,
        };
      }

      const data = asRecord(asRecord(json).data);
      const status = mapApiGamesStatus(json);
      return {
        status,
        providerRef: refId,
        externalId: String(data.trx_id ?? data.trxid ?? data.id ?? "").trim() || undefined,
        serial: String(data.sn ?? "").trim() || undefined,
        message:
          extractProviderMessage(json) ||
          (status === "FAILED" ? "API Games mengembalikan gagal tanpa pesan." : undefined),
        raw: json,
        requestPayload: body,
        retryable: false,
      };
    } catch (error) {
      return {
        status: "FAILED",
        providerRef: refId,
        message: error instanceof Error ? error.message : "Gagal menghubungi API Games.",
        raw: {},
        requestPayload: body,
        retryable: true,
      };
    }
  },

  async getStatus(input: GetStatusInput): Promise<FulfillmentStatusResult> {
    const runtime = await getFulfillmentProviderConfig("apigames");
    if (!runtime?.isConfigured) {
      return {
        status: "FAILED",
        message: "Provider API Games belum dikonfigurasi / tidak aktif.",
        raw: {},
      };
    }

    const merchantId = String(
      runtime.config.merchantId ?? runtime.config.merchant_id ?? "",
    ).trim();
    const secretKey = String(
      runtime.config.secretKey ?? runtime.config.apiKey ?? "",
    ).trim();
    const refId = input.providerRef || input.orderCode;
    const sign = apigamesTrxSign(merchantId, secretKey, refId);
    const url = `${resolveBase(runtime.apiUrl)}/transaksi/status/${encodeURIComponent(merchantId)}/${encodeURIComponent(refId)}?signature=${encodeURIComponent(sign)}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
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
        status: mapApiGamesStatus(json),
        serial: String(data.sn ?? "").trim() || undefined,
        message: String(data.message ?? "").trim() || undefined,
        raw: json,
      };
    } catch (error) {
      return {
        status: "PENDING",
        message: error instanceof Error ? error.message : "Gagal poll API Games.",
        raw: {},
      };
    }
  },
};
