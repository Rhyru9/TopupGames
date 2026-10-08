/** Client-safe saldo topup constants — no Prisma / server imports. */

export const MEMBER_DEPOSIT_PAGE_SIZE = 15;

export const SALDO_TOPUP_PRESETS = [
  10_000, 25_000, 50_000, 100_000, 250_000, 500_000,
] as const;

export const SALDO_TOPUP_MIN = 10_000;
export const SALDO_TOPUP_MAX = 5_000_000;
