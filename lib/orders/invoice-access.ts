import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { signInvoiceAccess, verifyInvoiceAccess } from "@/lib/orders/invoice-access-token";

const lifetime = 24 * 60 * 60 * 1000;
function cookieName(orderCode: string) {
  return `invoice-${createHash("sha256").update(orderCode).digest("hex").slice(0, 24)}`;
}
function accessSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for invoice access");
  return secret;
}

// Only call after successful checkout or a server-side contact check.
export async function grantInvoiceAccess(orderCode: string) {
  (await cookies()).set(cookieName(orderCode), signInvoiceAccess(orderCode, Date.now() + lifetime, accessSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/invoice/${orderCode}`,
    maxAge: lifetime / 1000,
  });
}

export async function hasInvoiceAccess(orderCode: string) {
  const token = (await cookies()).get(cookieName(orderCode))?.value;
  return Boolean(token && verifyInvoiceAccess(orderCode, token, accessSecret()));
}
