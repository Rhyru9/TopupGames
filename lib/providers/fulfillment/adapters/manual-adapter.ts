import type {
  CreateOrderInput,
  FulfillmentAdapter,
  FulfillmentCreateResult,
  FulfillmentStatusResult,
  GetStatusInput,
} from "@/lib/providers/fulfillment/types";

/**
 * Provider manual — tidak memanggil API.
 * Order tetap PROCESSING sampai admin tandai sukses/gagal di console.
 */
export const manualAdapter: FulfillmentAdapter = {
  slug: "manual",

  mapStatus() {
    return "PENDING";
  },

  async createOrder(input: CreateOrderInput): Promise<FulfillmentCreateResult> {
    return {
      status: "PENDING",
      providerRef: input.providerRef || input.orderCode,
      message: "Menunggu proses manual oleh admin.",
      raw: { mode: "manual" },
      retryable: false,
    };
  },

  async getStatus(input: GetStatusInput): Promise<FulfillmentStatusResult> {
    return {
      status: "PENDING",
      message: "Menunggu proses manual oleh admin.",
      raw: { providerRef: input.providerRef },
    };
  },
};
