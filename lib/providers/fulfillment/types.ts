/** Status seragam hasil adapter — worker tidak kenal detail API provider. */
export type ProviderFulfillmentStatus = "PENDING" | "SUCCESS" | "FAILED";

export type CreateOrderInput = {
  orderCode: string;
  providerSku: string;
  customerNo: string;
  sandbox: boolean;
  playerFields?: Record<string, string>;
  /** Ref unik ke provider; Digiflazz retry setelah FAILED pakai ref baru. */
  providerRef?: string;
};

export type FulfillmentCreateResult = {
  status: ProviderFulfillmentStatus;
  /** Ref di sisi kita / buyer_trx_id (biasanya orderCode). */
  providerRef: string;
  /** ID transaksi eksternal provider jika ada. */
  externalId?: string;
  serial?: string;
  message?: string;
  raw: unknown;
  /** Error transient → BullMQ boleh retry. */
  retryable?: boolean;
  /** Body/request aktual ke provider (untuk log admin). */
  requestPayload?: unknown;
};

export type GetStatusInput = {
  orderCode: string;
  providerRef: string;
  providerSku: string;
  customerNo: string;
  sandbox: boolean;
  externalId?: string;
};

export type FulfillmentStatusResult = {
  status: ProviderFulfillmentStatus;
  serial?: string;
  message?: string;
  raw: unknown;
};

export type WebhookUpdate = {
  orderCode?: string;
  providerRef?: string;
  status: ProviderFulfillmentStatus;
  serial?: string;
  message?: string;
  externalId?: string;
  raw: unknown;
};

/**
 * Kontrak adapter fulfillment.
 * checkNickname TIDAK ada di sini — semua cek nickname via Melostore
 * (`/api/nickname/check`).
 */
export type FulfillmentAdapter = {
  slug: string;
  createOrder(input: CreateOrderInput): Promise<FulfillmentCreateResult>;
  getStatus(input: GetStatusInput): Promise<FulfillmentStatusResult>;
  mapStatus(raw: unknown): ProviderFulfillmentStatus;
  verifyWebhook?(
    rawBody: string,
    headers: Headers,
    secret: string,
  ): boolean | Promise<boolean>;
  parseWebhook?(rawBody: string): WebhookUpdate | null;
};
