/**
 * Hapus merek Shopee dari label channel pembayaran (tampil ke pelanggan).
 * Channel tetap aktif; hanya nama/logo yang dinetralkan.
 */

const SHOPEE_RE = /shopee/i;

export function isShopeeBrandedPayment(code: string, name?: string | null): boolean {
  return SHOPEE_RE.test(code) || SHOPEE_RE.test(String(name ?? ""));
}

/** Nama tampilan netral tanpa kata Shopee / ShopeePay. */
export function sanitizePaymentBrandLabel(label: string | null | undefined): string {
  const raw = String(label ?? "").trim();
  if (!raw) return "";
  if (!SHOPEE_RE.test(raw)) return raw;

  let out = raw
    .replace(/QRIS\s*(Custom\s*)?(by\s*)?Shopee\s*Pay/gi, "QRIS")
    .replace(/QRIS\s*(Custom\s*)?(by\s*)?ShopeePay/gi, "QRIS")
    .replace(/Shopee\s*Pay/gi, "E-Wallet")
    .replace(/ShopeePay/gi, "E-Wallet")
    .replace(/Shopee/gi, "")
    .replace(/\s*[|/·\-–—]+\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^\s*(by|via)\s+/i, "")
    .trim();

  if (!out) {
    if (/qris/i.test(raw)) return "QRIS";
    return "E-Wallet";
  }

  return out;
}

/** Hilangkan merek Shopee di teks instruksi bayar. */
export function sanitizePaymentBrandText(text: string): string {
  if (!SHOPEE_RE.test(text)) return text;
  return text
    .replace(/QRIS\s*(Custom\s*)?(by\s*)?Shopee\s*Pay/gi, "QRIS")
    .replace(/QRIS\s*(Custom\s*)?(by\s*)?ShopeePay/gi, "QRIS")
    .replace(/Shopee\s*Pay/gi, "e-wallet")
    .replace(/ShopeePay/gi, "e-wallet")
    .replace(/Shopee/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
