import {
  buildCustomerNo,
  resolveGameInputFields,
} from "@/lib/catalog-products/game-input-fields";
import { playerFieldsToRecord } from "@/lib/orders/player-fields";

/** Bangun customer_no / target dari playerFields + config produk. */
export function resolveOrderCustomerNo(input: {
  playerFields: unknown;
  productInputFields: unknown;
  requiresZone: boolean;
}): string {
  const config = resolveGameInputFields(input.productInputFields, input.requiresZone);
  const values = playerFieldsToRecord(input.playerFields);
  return buildCustomerNo(values, config);
}
