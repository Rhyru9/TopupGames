import { asRecord } from "@/lib/providers/catalog/catalog-types";
import { formatProviderHttpError } from "@/lib/providers/catalog/catalog-errors";
import type { MelostoreTargetPayload } from "@/lib/catalog-products/game-input-fields";

export type MelostoreNicknameCheckResult =
  | { ok: true; nickname: string; region: string | null }
  | { ok: false; error: string; errorCode?: string | number };

function pickString(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value).trim();
      if (text) return text;
    }
  }
  return null;
}

function extractRegion(
  data: Record<string, unknown>,
  payload: Record<string, unknown>,
): string | null {
  const keys = [
    "region",
    "Region",
    "country",
    "country_name",
    "countryName",
    "server_name",
    "serverName",
    "zone_name",
    "zoneName",
    "server_region",
    "serverRegion",
  ];

  const fromData = pickString(data, keys);
  if (fromData) return fromData;

  for (const nestedKey of ["player", "account", "info"]) {
    const nestedRaw = data[nestedKey];
    if (!nestedRaw || typeof nestedRaw !== "object" || Array.isArray(nestedRaw)) continue;
    const fromNested = pickString(nestedRaw as Record<string, unknown>, keys);
    if (fromNested) return fromNested;
  }

  return pickString(payload, keys);
}

export async function checkMelostoreNickname(input: {
  apiUrl: string;
  apiKey: string;
  secretKey: string;
  gameCode: string;
  target: MelostoreTargetPayload;
}): Promise<MelostoreNicknameCheckResult> {
  const gameCode = input.gameCode.trim();
  const customerTarget = input.target.customer_target.trim();

  if (!gameCode) {
    return { ok: false, error: "Kode cek nickname belum dikonfigurasi untuk produk ini." };
  }
  if (!customerTarget) {
    return { ok: false, error: "User ID wajib diisi." };
  }
  if (!input.apiKey || !input.secretKey) {
    return { ok: false, error: "Kredensial Melostore belum lengkap." };
  }

  const body: Record<string, unknown> = {
    game_code: gameCode,
    customer_target: customerTarget,
  };

  if (input.target.customer_target_zone?.trim()) {
    body.customer_target_zone = input.target.customer_target_zone.trim();
  }
  if (input.target.additional_data && Object.keys(input.target.additional_data).length > 0) {
    body.additional_data = input.target.additional_data;
  }

  const url = `${input.apiUrl.replace(/\/+$/, "")}/check-nickname`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-Key": input.apiKey,
      "X-Secret-Key": input.secretKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = asRecord(await response.json().catch(() => ({})));
  const data = asRecord(payload.data);
  const errorCode = payload.error_code ?? data.error_code ?? payload.code;

  if (!response.ok) {
    const message =
      String(payload.message ?? data.message ?? data.msg ?? "").trim() ||
      formatProviderHttpError("Melostore", response.status, payload);
    return {
      ok: false,
      error: message,
      errorCode: typeof errorCode === "string" || typeof errorCode === "number" ? errorCode : undefined,
    };
  }

  const nickname = String(
    data.nickname ?? data.username ?? data.ign ?? payload.nickname ?? payload.username ?? "",
  ).trim();

  if (!nickname) {
    const failedMessage = String(payload.message ?? data.message ?? "").trim();
    if (failedMessage) {
      return {
        ok: false,
        error: failedMessage,
        errorCode: typeof errorCode === "string" || typeof errorCode === "number" ? errorCode : undefined,
      };
    }
    return { ok: false, error: "Nickname tidak ditemukan untuk ID ini." };
  }

  return { ok: true, nickname, region: extractRegion(data, payload) };
}
