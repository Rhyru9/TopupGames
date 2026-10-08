/** Total yang harus dibayar = amount di response create / baris payment. */
export function resolveDokuExpectedPaidAmount(payment: {
  amount: number;
  rawCreateResponse?: unknown;
}): number {
  const raw = payment.rawCreateResponse;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const createAmount = Math.trunc(Number((raw as { amount?: unknown }).amount));
    if (Number.isFinite(createAmount) && createAmount > 0) {
      return createAmount;
    }
  }
  return payment.amount;
}
