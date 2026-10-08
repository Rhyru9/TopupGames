import { digiflazzAdapter } from "@/lib/providers/fulfillment/adapters/digiflazz-adapter";
import { melostoreAdapter } from "@/lib/providers/fulfillment/adapters/melostore-adapter";
import { iakAdapter } from "@/lib/providers/fulfillment/adapters/iak-adapter";
import { apigamesAdapter } from "@/lib/providers/fulfillment/adapters/apigames-adapter";
import { manualAdapter } from "@/lib/providers/fulfillment/adapters/manual-adapter";
import type { FulfillmentAdapter } from "@/lib/providers/fulfillment/types";

const adapters: Record<string, FulfillmentAdapter> = {
  digiflazz: digiflazzAdapter,
  melostore: melostoreAdapter,
  iak: iakAdapter,
  apigames: apigamesAdapter,
  manual: manualAdapter,
};

export function getFulfillmentAdapter(slug: string | null | undefined): FulfillmentAdapter | null {
  if (!slug) return null;
  return adapters[slug] ?? null;
}

export function listFulfillmentAdapterSlugs(): string[] {
  return Object.keys(adapters);
}
