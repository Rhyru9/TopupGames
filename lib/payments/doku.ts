import { randomUUID } from "node:crypto";
import { buildDokuSignature } from "@/lib/payments/doku-signature";
export { buildDokuSignature, verifyDokuNotificationSignature } from "@/lib/payments/doku-signature";
import { getPaymentGatewayCallbackUrl, getPaymentGatewayConfig } from "@/lib/payments/get-payment-gateway-config";
import { getDokuChannel, listDokuPaymentChannels } from "@/lib/payments/doku-channels";
import type { PaymentPublicChannel } from "@/lib/payments/payment-channel-types";

type DokuCredentials = {
  clientId: string;
  secretKey: string;
  apiBaseUrl: string;
};

export type DokuCreatePaymentInput = {
  method: string;
  merchantRef: string;
  amount: number;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  orderItemName: string;
  returnUrl: string;
  expiredMinutes?: number;
};

export type DokuCreatePaymentData = {
  invoice_number: string;
  amount: number;
  payment_url: string;
  expired_time?: number;
  request_id: string;
  uuid?: string | null;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function loadDokuCredentials(): Promise<DokuCredentials | null> {
  const gateway = await getPaymentGatewayConfig("doku");
  if (!gateway || !gateway.isConfigured) return null;
  const clientId = asString(gateway.config.clientId);
  const secretKey = asString(gateway.config.secretKey);
  if (!clientId || !secretKey || !gateway.apiBaseUrl) return null;
  return { clientId, secretKey, apiBaseUrl: gateway.apiBaseUrl.replace(/\/$/, "") };
}

export async function listConfiguredDokuChannels(): Promise<
  { ok: true; channels: PaymentPublicChannel[] } | { ok: false; error: string }
> {
  const credentials = await loadDokuCredentials();
  if (!credentials) {
    return { ok: false, error: "Payment gateway DOKU belum aktif/dikonfigurasi." };
  }
  return { ok: true, channels: listDokuPaymentChannels() };
}

export async function createDokuCheckoutPayment(
  input: DokuCreatePaymentInput,
): Promise<{ ok: true; data: DokuCreatePaymentData } | { ok: false; error: string }> {
  const credentials = await loadDokuCredentials();
  if (!credentials) {
    return { ok: false, error: "Payment gateway DOKU belum aktif/dikonfigurasi." };
  }

  const amount = Math.trunc(input.amount);
  if (!Number.isFinite(amount) || amount < 1) {
    return { ok: false, error: "Nominal pembayaran tidak valid." };
  }

  const method = input.method.trim().toUpperCase();
  const channel = getDokuChannel(method);
  if (!channel) {
    return { ok: false, error: "Metode pembayaran tidak tersedia." };
  }

  const requestId = randomUUID();
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const requestTarget = "/checkout/v1/payment";
  const dueMinutes = Math.min(Math.max(input.expiredMinutes ?? 1440, 15), 10080);

  const bodyObject = {
    order: {
      amount,
      invoice_number: input.merchantRef.slice(0, 64),
      currency: "IDR",
      callback_url: input.returnUrl,
      line_items: [
        {
          name: input.orderItemName.slice(0, 255),
          price: amount,
          quantity: 1,
        },
      ],
    },
    payment: {
      payment_due_date: dueMinutes,
      payment_method_types: [channel.code],
    },
    customer: {
      name: input.customerName.slice(0, 120) || "Customer",
      email: input.customerEmail?.trim() || undefined,
      phone: input.customerPhone?.trim() || undefined,
      country: "ID",
    },
  };

  const body = JSON.stringify(bodyObject);
  const signature = buildDokuSignature({
    clientId: credentials.clientId,
    requestId,
    timestamp,
    requestTarget,
    secretKey: credentials.secretKey,
    body,
  });

  try {
    const response = await fetch(`${credentials.apiBaseUrl}${requestTarget}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Id": credentials.clientId,
        "Request-Id": requestId,
        "Request-Timestamp": timestamp,
        Signature: signature,
      },
      body,
      cache: "no-store",
    });

    const json = (await response.json().catch(() => null)) as {
      error?: { message?: string; code?: string };
      payment?: { url?: string };
      order?: { invoice_number?: string; amount?: number };
      uuid?: string;
    } | null;

    const paymentUrl = json?.payment?.url?.trim();
    if (!response.ok || !json || !paymentUrl) {
      const message = json?.error?.message?.trim();
      return {
        ok: false,
        error: message || "DOKU menolak permintaan pembayaran.",
      };
    }

    const invoiceNumber = json.order?.invoice_number?.trim() || input.merchantRef;
    const paidAmount = Math.trunc(Number(json.order?.amount));
    const expiredTime = Math.floor(Date.now() / 1000) + dueMinutes * 60;

    return {
      ok: true,
      data: {
        invoice_number: invoiceNumber,
        amount: Number.isFinite(paidAmount) && paidAmount > 0 ? paidAmount : amount,
        payment_url: paymentUrl,
        expired_time: expiredTime,
        request_id: requestId,
        uuid: json.uuid?.trim() || null,
      },
    };
  } catch (error) {
    console.error("[doku] create failed", error instanceof Error ? error.message : "unknown");
    return { ok: false, error: "Gagal menghubungi DOKU." };
  }
}

export async function getDokuSecretKey(): Promise<string | null> {
  const credentials = await loadDokuCredentials();
  return credentials?.secretKey ?? null;
}

export async function getDokuClientId(): Promise<string | null> {
  const credentials = await loadDokuCredentials();
  return credentials?.clientId ?? null;
}

export async function resolveDokuNotificationUrl(): Promise<string | null> {
  return getPaymentGatewayCallbackUrl("doku");
}
