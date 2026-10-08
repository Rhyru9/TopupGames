/** Status item pricelist Melostore: active = tersedia; selain itu dianggap tidak tersedia. */
export function parseMelostoreCatalogItemStatus(raw: unknown): boolean {
  const status = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!status) return false;
  return status === "active";
}
