import { formatRupiah } from "@/lib/format-rupiah";
import type { ProviderBalanceSnapshot } from "@/lib/providers/provider-balance-sync";

export type ProviderBalanceDisplay = {
  primary: string;
  secondary: string | null;
  syncedAtLabel: string | null;
  hasError: boolean;
  error: string | null;
  isEmpty: boolean;
};

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatProviderBalanceDisplay(
  balance: ProviderBalanceSnapshot | null | undefined,
): ProviderBalanceDisplay {
  if (!balance) {
    return {
      primary: "—",
      secondary: null,
      syncedAtLabel: null,
      hasError: false,
      error: null,
      isEmpty: true,
    };
  }

  if (balance.syncError) {
    return {
      primary: balance.amount !== null ? formatProviderBalanceAmount(balance) : "—",
      secondary: null,
      syncedAtLabel: balance.syncedAt ? formatSyncedAt(balance.syncedAt) : null,
      hasError: true,
      error: balance.syncError,
      isEmpty: balance.amount === null,
    };
  }

  if (balance.amount === null) {
    return {
      primary: "—",
      secondary: "Belum pernah di-sync",
      syncedAtLabel: null,
      hasError: false,
      error: null,
      isEmpty: true,
    };
  }

  return {
    primary: formatProviderBalanceAmount(balance),
    secondary:
      balance.currency === "MC"
        ? `≈ ${formatRupiah(balance.amount)} (1 MC ≈ Rp 1)`
        : balance.label,
    syncedAtLabel: balance.syncedAt ? formatSyncedAt(balance.syncedAt) : null,
    hasError: false,
    error: null,
    isEmpty: false,
  };
}

function formatProviderBalanceAmount(balance: ProviderBalanceSnapshot): string {
  if (balance.amount === null) return "—";

  if (balance.currency === "MC") {
    return `${balance.amount.toLocaleString("id-ID")} MC`;
  }

  return formatRupiah(balance.amount);
}

function formatSyncedAt(value: Date): string {
  return dateTimeFormatter.format(value);
}
