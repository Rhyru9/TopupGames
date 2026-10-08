"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  checkProductSkuProviderStatus,
  type CheckSkuProviderStatusResult,
} from "@/app/console/(panel)/product-skus/check-actions";
import { useConsoleAlert } from "@/components/console/console-confirm-provider";

type ProductProviderStatusCellProps = {
  productSkuId: string;
  providerSlug: string;
};

const CHECKABLE = new Set(["digiflazz", "iak", "melostore"]);

export function ProductProviderStatusCell({
  productSkuId,
  providerSlug,
}: ProductProviderStatusCellProps) {
  const router = useRouter();
  const alert = useConsoleAlert();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CheckSkuProviderStatusResult | null>(null);
  const canCheck = CHECKABLE.has(providerSlug);

  function handleCheck() {
    if (!canCheck || pending) return;
    startTransition(async () => {
      const next = await checkProductSkuProviderStatus(productSkuId);
      setResult(next);
      if (next.ok) {
        const title = next.statusUpdated
          ? "Status SKU diperbarui"
          : next.isAvailable
            ? "SKU tersedia"
            : "SKU tidak tersedia";
        const description =
          next.message ||
          (next.statusUpdated
            ? "Status SKU diperbarui dari provider."
            : next.isAvailable
              ? "SKU tersedia di provider."
              : "SKU tidak tersedia / gangguan di provider.");
        await alert({
          title,
          description,
          confirmLabel: "OK",
          variant: next.isAvailable ? "default" : "danger",
        });
      } else {
        await alert({
          title: "Gagal cek status",
          description: next.message || "Gagal cek status provider.",
          confirmLabel: "OK",
          variant: "danger",
        });
      }
      if (next.statusUpdated) {
        router.refresh();
      }
    });
  }

  let badge: ReactNode = (
    <span className="console-table__muted" style={{ marginTop: 0 }}>
      —
    </span>
  );

  if (result?.ok && result.isAvailable) {
    badge = <span className="console-badge console-badge--success">Tersedia</span>;
  } else if (result?.ok && !result.isAvailable) {
    badge = <span className="console-badge console-badge--danger">Gangguan</span>;
  } else if (result && !result.ok) {
    badge = <span className="console-badge console-badge--warning">Gagal cek</span>;
  }

  return (
    <div className="console-provider-status-cell">
      <div className="console-provider-status-cell__row">
        {badge}
        <button
          type="button"
          className="console-btn-secondary console-provider-status-cell__btn"
          onClick={handleCheck}
          disabled={!canCheck || pending}
          title={
            canCheck
              ? "Cek status realtime dari katalog provider"
              : providerSlug === "manual"
                ? "Provider Manual tidak punya cek katalog"
                : "Cek status belum didukung untuk provider ini"
          }
        >
          {pending ? "…" : "Cek"}
        </button>
      </div>
      {result?.message ? (
        <p className="console-provider-status-cell__hint" title={result.message}>
          {result.message}
        </p>
      ) : !canCheck ? (
        <p className="console-provider-status-cell__hint">
          {providerSlug === "manual" ? "Manual" : "Tidak didukung"}
        </p>
      ) : null}
    </div>
  );
}
