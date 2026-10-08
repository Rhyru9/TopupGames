import { createHmac, timingSafeEqual } from "node:crypto";

export function signInvoiceAccess(orderCode: string, expiresAt: number, secret: string): string {
  return `${expiresAt}.${createHmac("sha256", secret).update(`invoice:${orderCode}:${expiresAt}`).digest("hex")}`;
}

export function verifyInvoiceAccess(orderCode: string, token: string, secret: string, now = Date.now()): boolean {
  const [expiry, signature, extra] = token.split(".");
  const expiresAt = Number(expiry);
  if (extra || !signature || !/^\d+$/.test(expiry) || !Number.isSafeInteger(expiresAt) || expiresAt <= now) return false;
  const expected = signInvoiceAccess(orderCode, expiresAt, secret);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
