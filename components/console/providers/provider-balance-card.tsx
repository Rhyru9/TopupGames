"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  refreshProviderBalance,
  type ProviderBalanceActionState,
} from "@/app/console/(panel)/settings/providers/actions";
import { useConsoleActionToast } from "@/components/console/use-console-action-toast";
import {
  formatProviderBalanceDisplay,
} from "@/lib/providers/provider-balance-format";
import { providerToasts } from "@/lib/providers/provider-toasts";
import type { ProviderBalanceSnapshot } from "@/lib/providers/provider-balance-sync";

type ProviderBalanceCardProps = {
  providerId: string;
  providerSlug: string;
  initialBalance: ProviderBalanceSnapshot;
};

const initialState: ProviderBalanceActionState = {};

export function ProviderBalanceCard({
  providerId,
  providerSlug,
  initialBalance,
}: ProviderBalanceCardProps) {
  const [state, formAction, pending] = useActionState(refreshProviderBalance, initialState);
  const { notifySuccess, notifyError } = useConsoleActionToast();
  const wasPendingRef = useRef(false);
  const balance = state.balance ?? initialBalance;
  const display = formatProviderBalanceDisplay(balance);
  const actionError = state.error;
  const snapshotError = !actionError && display.hasError ? display.error : null;

  useEffect(() => {
    if (wasPendingRef.current && !pending) {
      if (actionError) {
        notifyError(actionError);
      } else {
        notifySuccess(providerToasts.balanceUpdated);
      }
    }
    wasPendingRef.current = pending;
  }, [actionError, notifyError, notifySuccess, pending]);

  return (
    <div className="console-provider-card">
      <div className="console-provider-card__head console-provider-card__head--split">
        <p className="console-provider-card__title">Saldo Provider</p>
        <form action={formAction}>
          <input type="hidden" name="providerId" value={providerId} />
          <input type="hidden" name="providerSlug" value={providerSlug} />
          <button
            type="submit"
            disabled={pending}
            className="console-btn-ghost console-btn-ghost--compact"
          >
            {pending ? "Memperbarui..." : "Perbarui Saldo"}
          </button>
        </form>
      </div>
      <div className="console-provider-card__body">
        <div className="console-provider-balance">
          <div className="console-provider-balance__amount">{display.primary}</div>
          {display.secondary ? (
            <p className="console-provider-balance__secondary">{display.secondary}</p>
          ) : null}
          {display.syncedAtLabel ? (
            <p className="console-provider-balance__meta">Terakhir di-sync: {display.syncedAtLabel}</p>
          ) : null}
          {snapshotError ? (
            <p className="console-field__error console-provider-balance__error" role="alert">
              {snapshotError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
