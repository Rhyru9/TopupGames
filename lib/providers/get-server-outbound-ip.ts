const IP_LOOKUP_URLS = [
  "https://api.ipify.org?format=text",
  "https://ifconfig.me/ip",
] as const;

const LOOKUP_TIMEOUT_MS = 8_000;

function isLikelyPublicIp(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed)) return true;
  if (trimmed.includes(":")) return true;
  return false;
}

export type ServerOutboundIpResult =
  | { ok: true; ip: string }
  | { ok: false; error: string };

/** IP publik yang dilihat provider saat server ini memanggil API mereka. */
export async function getServerOutboundIp(): Promise<ServerOutboundIpResult> {
  for (const url of IP_LOOKUP_URLS) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
      });
      if (!response.ok) continue;

      const text = (await response.text()).trim();
      if (!isLikelyPublicIp(text)) continue;

      return { ok: true, ip: text };
    } catch {
      /* coba endpoint berikutnya */
    }
  }

  return {
    ok: false,
    error: "Tidak bisa mendeteksi IP publik server. Cek koneksi internet atau firewall outbound.",
  };
}
