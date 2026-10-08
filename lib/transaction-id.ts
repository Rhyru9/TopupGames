import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

/** R9xxxxx h xxxxxxxxx o xxx st — 23 karakter, dipakai semua endpoint transaksi. */
export const TRANSACTION_ID_PATTERN = /^R9[0-9a-f]{5}h[0-9a-f]{9}o[0-9a-f]{3}st$/;

export function generateTransactionId(): string {
  const hex = randomBytes(9).toString("hex");
  return `R9${hex.slice(0, 5)}h${hex.slice(5, 14)}o${hex.slice(14, 17)}st`;
}

export function normalizeTransactionId(raw: string): string {
  return raw.trim();
}

export function isTransactionId(raw: string): boolean {
  return TRANSACTION_ID_PATTERN.test(normalizeTransactionId(raw));
}

export async function allocateUniqueTransactionId(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const id = generateTransactionId();
    const [order, deposit, payment] = await Promise.all([
      prisma.order.findFirst({
        where: { OR: [{ orderCode: id }, { providerRefId: id }] },
        select: { id: true },
      }),
      prisma.memberDeposit.findUnique({
        where: { depositCode: id },
        select: { id: true },
      }),
      prisma.payment.findUnique({
        where: { reference: id },
        select: { id: true },
      }),
    ]);
    if (!order && !deposit && !payment) return id;
  }
  return generateTransactionId();
}
