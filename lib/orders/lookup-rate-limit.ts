import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { getRateLimitRedisConnection } from "@/lib/queue/connection";

export function lookupClientIp(headers: Pick<Headers, "get">): string {
  // Enable only behind an ingress that OVERWRITES this header and blocks direct access.
  if (process.env.TRUST_PROXY_HEADERS !== "true") return "untrusted-ingress";
  const ip = headers.get("x-real-ip")?.trim() ?? "";
  return isIP(ip) ? ip : "untrusted-ingress";
}

export async function allowCekTransaksiAttempt(ip: string, limit = 20, windowMs = 60_000): Promise<boolean> {
  const key = `rate:invoice:${createHash("sha256").update(ip).digest("hex")}`;
  try {
    const count = await getRateLimitRedisConnection().eval(
      `local n = redis.call('INCR', KEYS[1])
       if n == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
       return n`,
      1, key, windowMs,
    );
    return Number(count) <= limit;
  } catch {
    // No per-process fallback: it would reopen the lookup endpoint during an outage.
    return false;
  }
}
