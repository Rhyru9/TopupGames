const STORAGE_KEY = "r9host-topup:order-account:v1";
const MAX_PRODUCTS = 40;

type ProductMemory = {
  values: Record<string, string>;
  updatedAt: number;
};

type OrderAccountMemory = {
  email?: string;
  whatsapp?: string;
  products: Record<string, ProductMemory>;
};

export type OrderAccountSnapshot = {
  email: string;
  whatsapp: string;
  products: Record<string, Record<string, string>>;
};

const listeners = new Set<() => void>();
let snapshotCache: OrderAccountSnapshot | null = null;

const EMPTY_SNAPSHOT: OrderAccountSnapshot = { email: "", whatsapp: "", products: {} };

function emptyMemory(): OrderAccountMemory {
  return { products: {} };
}

function readMemory(): OrderAccountMemory {
  if (typeof window === "undefined") return emptyMemory();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyMemory();
    const parsed = JSON.parse(raw) as Partial<OrderAccountMemory>;
    const products =
      parsed.products && typeof parsed.products === "object" && !Array.isArray(parsed.products)
        ? parsed.products
        : {};
    return {
      email: typeof parsed.email === "string" ? parsed.email : undefined,
      whatsapp: typeof parsed.whatsapp === "string" ? parsed.whatsapp : undefined,
      products,
    };
  } catch {
    return emptyMemory();
  }
}

function writeMemory(memory: OrderAccountMemory) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // ignore quota / private mode
  }
}

function pruneProducts(products: Record<string, ProductMemory>): Record<string, ProductMemory> {
  const entries = Object.entries(products).sort((a, b) => b[1].updatedAt - a[1].updatedAt);
  if (entries.length <= MAX_PRODUCTS) return products;
  return Object.fromEntries(entries.slice(0, MAX_PRODUCTS));
}

function buildSnapshot(): OrderAccountSnapshot {
  const memory = readMemory();
  const products: Record<string, Record<string, string>> = {};
  for (const [slug, entry] of Object.entries(memory.products)) {
    if (!entry?.values || typeof entry.values !== "object") continue;
    products[slug] = entry.values;
  }
  return {
    email: memory.email?.trim() ?? "",
    whatsapp: memory.whatsapp?.trim() ?? "",
    products,
  };
}

function emitChange() {
  snapshotCache = null;
  for (const listener of listeners) listener();
}

export function subscribeOrderAccountMemory(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function getOrderAccountSnapshot(): OrderAccountSnapshot {
  if (!snapshotCache) snapshotCache = buildSnapshot();
  return snapshotCache;
}

export function getServerOrderAccountSnapshot(): OrderAccountSnapshot {
  return EMPTY_SNAPSHOT;
}

export function loadSavedOrderAccount(
  snapshot: OrderAccountSnapshot,
  productSlug: string,
  allowedKeys: string[],
): Record<string, string> | null {
  const slug = productSlug.trim();
  if (!slug || allowedKeys.length === 0) return null;

  const saved = snapshot.products[slug];
  if (!saved || typeof saved !== "object") return null;

  const next: Record<string, string> = {};
  let hasValue = false;
  for (const key of allowedKeys) {
    const value = String(saved[key] ?? "").trim();
    next[key] = value;
    if (value) hasValue = true;
  }

  return hasValue ? next : null;
}

export function saveOrderAccountMemory(input: {
  productSlug: string;
  values: Record<string, string>;
  email?: string;
  whatsapp?: string;
}) {
  const slug = input.productSlug.trim();
  if (!slug) return;

  const cleanedValues: Record<string, string> = {};
  for (const [key, value] of Object.entries(input.values)) {
    const text = String(value ?? "").trim();
    if (text) cleanedValues[key] = text;
  }

  const memory = readMemory();
  const email = (input.email ?? memory.email ?? "").trim();
  const whatsapp = (input.whatsapp ?? memory.whatsapp ?? "").trim();

  if (Object.keys(cleanedValues).length === 0) {
    delete memory.products[slug];
  } else {
    memory.products[slug] = {
      values: cleanedValues,
      updatedAt: Date.now(),
    };
  }

  memory.products = pruneProducts(memory.products);
  if (email) memory.email = email;
  else delete memory.email;
  if (whatsapp) memory.whatsapp = whatsapp;
  else delete memory.whatsapp;

  writeMemory(memory);
  emitChange();
}
