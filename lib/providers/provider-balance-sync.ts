import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getFulfillmentProviderConfig } from "@/lib/providers/get-provider-config";
import {
  resolveIakCheckBalanceUrl,
  resolveProviderApiUrl,
} from "@/lib/providers/provider-api-urls";

export const PROVIDER_BALANCE_SLUGS = ["digiflazz", "melostore", "iak"] as const;

export type ProviderBalanceSlug = (typeof PROVIDER_BALANCE_SLUGS)[number];

export type ProviderBalanceSnapshot = {
  amount: number | null;
  currency: string | null;
  label: string | null;
  syncedAt: Date | null;
  syncError: string | null;
};

export type SyncProviderBalanceResult =
  | { ok: true; balance: ProviderBalanceSnapshot }
  | { ok: false; error: string; balance: ProviderBalanceSnapshot };

const BALANCE_STALE_MS = 5 * 60 * 1000;

function md5(value: string): string {
  return createHash("md5").update(value).digest("hex");
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function parseAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }
  return null;
}

function resolveDigiflazzBalanceUrl(apiUrl: string): string {
  const normalized = apiUrl.replace(/\/+$/, "");
  if (normalized.endsWith("/transaction")) {
    return normalized.replace(/\/transaction$/, "/cek-saldo");
  }
  if (normalized.includes("/v1/")) {
    return normalized.replace(/\/v1\/[^/]+$/, "/v1/cek-saldo");
  }
  return "https://api.digiflazz.com/v1/cek-saldo";
}

export function supportsProviderBalanceSync(slug: string): slug is ProviderBalanceSlug {
  return PROVIDER_BALANCE_SLUGS.includes(slug as ProviderBalanceSlug);
}

export function toProviderBalanceSnapshot(provider: {
  balanceAmount: number | null;
  balanceCurrency: string | null;
  balanceLabel: string | null;
  balanceSyncedAt: Date | null;
  balanceSyncError: string | null;
}): ProviderBalanceSnapshot {
  return {
    amount: provider.balanceAmount,
    currency: provider.balanceCurrency,
    label: provider.balanceLabel,
    syncedAt: provider.balanceSyncedAt,
    syncError: provider.balanceSyncError,
  };
}

export function shouldSyncProviderBalance(
  syncedAt: Date | null | undefined,
  force = false,
): boolean {
  if (force) return true;
  if (!syncedAt) return true;
  return Date.now() - syncedAt.getTime() > BALANCE_STALE_MS;
}

async function persistProviderBalanceSuccess(
  providerId: string,
  data: { amount: number; currency: string; label: string },
): Promise<ProviderBalanceSnapshot> {
  const updated = await prisma.fulfillmentProvider.update({
    where: { id: providerId },
    data: {
      balanceAmount: data.amount,
      balanceCurrency: data.currency,
      balanceLabel: data.label,
      balanceSyncedAt: new Date(),
      balanceSyncError: null,
    },
    select: {
      balanceAmount: true,
      balanceCurrency: true,
      balanceLabel: true,
      balanceSyncedAt: true,
      balanceSyncError: true,
    },
  });

  return toProviderBalanceSnapshot(updated);
}

async function persistProviderBalanceError(
  providerId: string,
  syncError: string,
): Promise<ProviderBalanceSnapshot> {
  const updated = await prisma.fulfillmentProvider.update({
    where: { id: providerId },
    data: { balanceSyncError: syncError },
    select: {
      balanceAmount: true,
      balanceCurrency: true,
      balanceLabel: true,
      balanceSyncedAt: true,
      balanceSyncError: true,
    },
  });

  return toProviderBalanceSnapshot(updated);
}

async function fetchDigiflazzBalance(
  config: Record<string, unknown>,
  apiUrl: string,
): Promise<{ amount: number; currency: string; label: string }> {
  const username = typeof config.username === "string" ? config.username.trim() : "";
  const apiKey = typeof config.apiKey === "string" ? config.apiKey.trim() : "";

  if (!username || !apiKey) {
    throw new Error("Username dan API Key Digiflazz wajib diisi.");
  }

  const balanceUrl = resolveDigiflazzBalanceUrl(apiUrl);
  const response = await fetch(balanceUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cmd: "deposit",
      username,
      sign: md5(`${username}${apiKey}depo`),
    }),
    cache: "no-store",
  });

  const payload = asRecord(await response.json().catch(() => ({})));
  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : `HTTP ${response.status} dari Digiflazz.`;
    throw new Error(message);
  }

  const data = asRecord(payload.data);
  const amount = parseAmount(data.deposit);
  if (amount === null) {
    throw new Error("Respons saldo Digiflazz tidak valid.");
  }

  return {
    amount,
    currency: "IDR",
    label: "Deposit Digiflazz",
  };
}

async function fetchMelostoreBalance(
  config: Record<string, unknown>,
  apiUrl: string,
): Promise<{ amount: number; currency: string; label: string }> {
  const apiKey = typeof config.apiKey === "string" ? config.apiKey.trim() : "";
  const secretKey = typeof config.secretKey === "string" ? config.secretKey.trim() : "";

  if (!apiKey || !secretKey) {
    throw new Error("API Key dan Secret Key Melostore wajib diisi.");
  }

  const headers = {
    Accept: "application/json",
    "X-API-Key": apiKey,
    "X-Secret-Key": secretKey,
  };

  const balanceUrl = `${apiUrl.replace(/\/+$/, "")}/profile/balance`;
  let response = await fetch(balanceUrl, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  let payload = asRecord(await response.json().catch(() => ({})));

  if (!response.ok) {
    const profileUrl = `${apiUrl.replace(/\/+$/, "")}/profile`;
    response = await fetch(profileUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    payload = asRecord(await response.json().catch(() => ({})));

    if (!response.ok) {
      const message =
        typeof payload.message === "string"
          ? payload.message
          : `HTTP ${response.status} dari Melostore.`;
      throw new Error(message);
    }
  }

  const data = asRecord(payload.data);
  const amount =
    parseAmount(data.balance) ??
    parseAmount(data.h2h_balance) ??
    parseAmount(data.available_balance);

  if (amount === null) {
    throw new Error("Respons saldo Melostore tidak valid.");
  }

  return {
    amount,
    currency: "MC",
    label: "Saldo H2H Melostore",
  };
}

async function fetchIakBalance(
  config: Record<string, unknown>,
  apiUrl: string,
  sandboxMode: boolean,
): Promise<{ amount: number; currency: string; label: string }> {
  const username = typeof config.username === "string" ? config.username.trim() : "";
  const apiKey = typeof config.apiKey === "string" ? config.apiKey.trim() : "";

  if (!username || !apiKey) {
    throw new Error("Username dan API Key IAK wajib diisi.");
  }

  const balanceUrl = resolveIakCheckBalanceUrl(apiUrl, sandboxMode);
  const response = await fetch(balanceUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      sign: md5(`${username}${apiKey}bl`),
    }),
    cache: "no-store",
  });

  const payload = asRecord(await response.json().catch(() => ({})));
  if (!response.ok) {
    const message =
      typeof payload.message === "string" ? payload.message : `HTTP ${response.status} dari IAK.`;
    throw new Error(message);
  }

  const data = asRecord(payload.data);
  const rc = String(data.rc ?? payload.rc ?? "").trim();
  if (rc && rc !== "00") {
    throw new Error(String(data.message ?? payload.message ?? `IAK rc ${rc}`));
  }

  const amount = parseAmount(data.balance);
  if (amount === null) {
    throw new Error("Respons saldo IAK tidak valid.");
  }

  return {
    amount,
    currency: "IDR",
    label: "Saldo wallet IAK",
  };
}

export async function syncProviderBalance(
  providerId: string,
  options: { force?: boolean } = {},
): Promise<SyncProviderBalanceResult> {
  const provider = await prisma.fulfillmentProvider.findUnique({
    where: { id: providerId },
    select: {
      id: true,
      slug: true,
      isActive: true,
      sandboxMode: true,
      config: true,
      balanceAmount: true,
      balanceCurrency: true,
      balanceLabel: true,
      balanceSyncedAt: true,
      balanceSyncError: true,
    },
  });

  if (!provider) {
    return {
      ok: false,
      error: "Provider tidak ditemukan.",
      balance: {
        amount: null,
        currency: null,
        label: null,
        syncedAt: null,
        syncError: "Provider tidak ditemukan.",
      },
    };
  }

  const current = toProviderBalanceSnapshot(provider);

  if (!supportsProviderBalanceSync(provider.slug)) {
    return { ok: false, error: "Provider ini belum mendukung sync saldo.", balance: current };
  }

  if (!shouldSyncProviderBalance(provider.balanceSyncedAt, options.force)) {
    return { ok: true, balance: current };
  }

  const runtime = await getFulfillmentProviderConfig(provider.slug);
  if (!runtime?.isConfigured) {
    const balance = await persistProviderBalanceError(
      providerId,
      "Kredensial provider belum lengkap.",
    );
    return { ok: false, error: balance.syncError ?? "Kredensial belum lengkap.", balance };
  }

  try {
    const config = asRecord(runtime.config);
    const apiUrl = resolveProviderApiUrl(provider.slug, config, provider.sandboxMode);

    let fetched: { amount: number; currency: string; label: string };
    if (provider.slug === "digiflazz") {
      fetched = await fetchDigiflazzBalance(config, apiUrl);
    } else if (provider.slug === "melostore") {
      fetched = await fetchMelostoreBalance(config, apiUrl);
    } else {
      fetched = await fetchIakBalance(config, apiUrl, provider.sandboxMode);
    }

    const balance = await persistProviderBalanceSuccess(providerId, fetched);

    return { ok: true, balance };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengambil saldo provider.";
    const balance = await persistProviderBalanceError(providerId, message);
    return { ok: false, error: message, balance };
  }
}

export async function maybeSyncProviderBalance(
  providerId: string,
): Promise<ProviderBalanceSnapshot | null> {
  const result = await syncProviderBalance(providerId);
  return result.balance;
}
