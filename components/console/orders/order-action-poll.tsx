"use client";

import { pollOrderFulfillmentStatus } from "@/app/console/(panel)/orders/actions";
import { useConsoleAlert } from "@/components/console/console-confirm-provider";
import { useRouter } from "next/navigation";
import { useState } from "react";

type OrderActionPollProps = {
  orderId: string;
  step: number;
};

export function OrderActionPoll({ orderId, step }: OrderActionPollProps) {
  const alert = useConsoleAlert();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [lastResult, setLastResult] = useState<{
    message: string;
    error: boolean;
  } | null>(null);

  async function handlePoll() {
    if (pending) return;
    setPending(true);
    try {
      const result = await pollOrderFulfillmentStatus(orderId);
      setLastResult({ message: result.message, error: !result.ok || result.variant === "danger" });
      await alert({
        title: result.title,
        description: result.message,
        confirmLabel: "OK",
        variant: result.variant,
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="console-order-actions__step console-panel console-panel--padded">
      <div className="console-order-actions__step-head">
        <span className="console-order-actions__step-num">{step}</span>
        <h2 className="console-order-actions__step-title">Cek ulang ke provider</h2>
      </div>
      <p className="console-field__hint">
        Ambil status terbaru dari provider. Hasil tampil di alert dan tetap di kartu ini.
      </p>
      {lastResult ? (
        <p
          className={`console-order-actions__poll-result${
            lastResult.error ? " console-order-actions__poll-result--error" : ""
          }`}
        >
          {lastResult.message}
        </p>
      ) : (
        <p className="console-order-actions__poll-result console-order-actions__poll-result--idle">
          Belum dicek. Klik tombol untuk mengambil respons provider.
        </p>
      )}
      <div className="console-order-actions__step-foot">
        <button
          type="button"
          className="console-btn-secondary"
          onClick={() => void handlePoll()}
          disabled={pending}
        >
          {pending ? "Mengecek…" : "Cek status provider"}
        </button>
      </div>
    </section>
  );
}
