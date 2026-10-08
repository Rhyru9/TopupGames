const STORAGE_KEY = "r9host-topup:checkout-draft:v1";

export type OrderCheckoutDraft = {
  productId: string;
  productSkuId: string;
  productSlug: string;
  accountValues: Record<string, string>;
  email: string;
  whatsapp: string;
  nickname: string | null;
  region: string | null;
  skuName: string;
  productName: string;
  savedAt: number;
  idempotencyKey: string;
};

type DraftStore = Record<string, OrderCheckoutDraft>;

function readStore(): DraftStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as DraftStore;
  } catch {
    return {};
  }
}

function writeStore(store: DraftStore) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota
  }
}

export function saveCheckoutDraft(draft: Omit<OrderCheckoutDraft, "savedAt" | "idempotencyKey">) {
  const slug = draft.productSlug.trim();
  if (!slug) return;
  const store = readStore();
  store[slug] = { ...draft, savedAt: Date.now(), idempotencyKey: crypto.randomUUID() };
  writeStore(store);
}

export function loadCheckoutDraft(productSlug: string): OrderCheckoutDraft | null {
  const slug = productSlug.trim();
  if (!slug) return null;
  const draft = readStore()[slug];
  if (!draft) return null;
  if (!draft.productId || !draft.productSkuId || !draft.email?.trim()) return null;
  // Expire after 2 hours
  if (Date.now() - draft.savedAt > 2 * 60 * 60 * 1000) {
    clearCheckoutDraft(slug);
    return null;
  }
  if (!draft.idempotencyKey) {
    draft.idempotencyKey = crypto.randomUUID();
    const store = readStore();
    store[slug] = draft;
    writeStore(store);
  }
  return {
    ...draft,
    whatsapp: typeof draft.whatsapp === "string" ? draft.whatsapp : "",
  };
}

export function clearCheckoutDraft(productSlug: string) {
  const slug = productSlug.trim();
  if (!slug) return;
  const store = readStore();
  delete store[slug];
  writeStore(store);
}

const DRAFT_TOAST_KEY = "r9host-topup:checkout-draft-toast";

/** Dipanggil sebelum redirect ke halaman order bila draft hilang/invalid. */
export function flagCheckoutDraftMissingToast() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DRAFT_TOAST_KEY, "1");
  } catch {
    // ignore
  }
}

export function consumeCheckoutDraftMissingToast(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_TOAST_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(DRAFT_TOAST_KEY);
    return "Selesaikan order dulu sebelum lanjut ke pembayaran.";
  } catch {
    return null;
  }
}
