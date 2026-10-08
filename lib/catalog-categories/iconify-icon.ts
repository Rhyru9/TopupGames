/** Iconify icon id, e.g. `mdi:gamepad-variant`. */
const ICONIFY_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export function isIconifyIconId(value: string): boolean {
  return ICONIFY_ID_RE.test(value.trim());
}

/** Validasi field icon kategori (Iconify). Kosong = boleh. */
export function validateIconifyIconId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!isIconifyIconId(trimmed)) {
    return "Pilih icon dari daftar Iconify (format: set:nama-icon).";
  }
  if (trimmed.length > 120) {
    return "Nama icon terlalu panjang.";
  }
  return null;
}

export const CATEGORY_ICON_SUGGESTIONS = [
  "mdi:view-grid",
  "mdi:gamepad-variant",
  "mdi:cellphone",
  "mdi:ticket-confirmation-outline",
  "mdi:controller-classic",
  "mdi:shopping-outline",
  "mdi:gift-outline",
  "mdi:credit-card-outline",
  "mdi:lightning-bolt",
  "mdi:star-outline",
  "mdi:fire",
  "solar:gameboy-bold",
  "ph:game-controller",
  "lucide:gamepad-2",
  "tabler:device-gamepad-2",
  "ri:coupon-3-line",
] as const;
