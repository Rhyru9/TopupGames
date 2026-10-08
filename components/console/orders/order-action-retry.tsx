"use client";

import { retryOrderFulfillment } from "@/app/console/(panel)/orders/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import type { RetryNominalOption } from "@/lib/orders/list-orders";
import { useRef, useState } from "react";

type OrderActionRetryProps = {
  orderId: string;
  productSkuId: string;
  checkoutSkuName: string;
  sentSkuName: string | null;
  nominalOptions: RetryNominalOption[];
  step: number;
};

export function OrderActionRetry({
  orderId,
  productSkuId,
  checkoutSkuName,
  sentSkuName,
  nominalOptions,
  step,
}: OrderActionRetryProps) {
  const confirm = useConsoleConfirm();
  const skipRef = useRef(false);
  const [selectedSkuId, setSelectedSkuId] = useState(productSkuId);

  return (
    <section className="console-order-actions__step console-panel console-panel--padded">
      <div className="console-order-actions__step-head">
        <span className="console-order-actions__step-num">{step}</span>
        <h2 className="console-order-actions__step-title">Kirim ulang ke provider</h2>
      </div>
      <p className="console-field__hint">
        Nominal checkout: <strong>{checkoutSkuName}</strong>
        {sentSkuName && sentSkuName !== checkoutSkuName ? (
          <> · terakhir: {sentSkuName}</>
        ) : null}
        . Total bayar tidak berubah.
      </p>
      <form
        action={retryOrderFulfillment}
        onSubmit={async (event) => {
          if (skipRef.current) return;
          event.preventDefault();
          const form = event.currentTarget;
          const ok = await confirm({
            title: "Kirim ulang fulfillment?",
            description:
              "Order diantrikan ulang. Pastikan Redis + worker berjalan (`npm run worker:fulfillment`).",
            confirmLabel: "Kirim ulang",
            variant: "default",
          });
          if (!ok) return;
          skipRef.current = true;
          form.requestSubmit();
        }}
        className="console-order-actions__retry-form"
      >
        <input type="hidden" name="orderId" value={orderId} />
        <div className="console-field">
          <label htmlFor="retry-nominal" className="console-field__label">
            SKU dikirim
          </label>
          <select
            id="retry-nominal"
            name="productSkuId"
            className="console-input w-full"
            value={selectedSkuId}
            onChange={(e) => setSelectedSkuId(e.target.value)}
            required
          >
            {nominalOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name} · {opt.providerSlug} · {opt.providerSku}
                {opt.status !== "AVAILABLE" ? " (unavailable)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="console-order-actions__step-foot">
          <button type="submit" className="console-btn-secondary">
            Kirim ulang
          </button>
        </div>
      </form>
    </section>
  );
}
