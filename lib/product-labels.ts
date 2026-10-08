export const productStatusOptions = [
  { value: "AVAILABLE", label: "Tersedia" },
  { value: "UNAVAILABLE", label: "Tidak tersedia" },
] as const;

export type ProductStatusValue = (typeof productStatusOptions)[number]["value"];

export function productStatusLabel(status: string) {
  return productStatusOptions.find((item) => item.value === status)?.label ?? status;
}
