"use client";

import { cancelOrderToSaldo } from "@/app/console/(panel)/orders/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import { useRef } from "react";

type OrderActionCancelSaldoProps = {
  orderId: string;
  orderCode: string;
  amount: number;
  step: number;
};

export function OrderActionCancelSaldo({
  orderId,
  orderCode,
  amount,
  step,
}: OrderActionCancelSaldoProps) {
  const confirm = useConsoleConfirm();
  const skipRef = useRef(false);

  return (
    <section className="console-order-actions__step console-order-actions__step--danger console-panel console-panel--padded">
      <div className="console-order-actions__step-head">
        <span className="console-order-actions__step-num">{step}</span>
        <h2 className="console-order-actions__step-title">Kembalikan saldo</h2>
      </div>
      <p className="console-field__hint">
        Kredit total bayar ke saldo member. Order menjadi <strong>Dibatalkan</strong>.
        Pelanggan bisa pesan ulang atau ganti produk. Ledger: Pengembalian dari order{" "}
        {orderCode}.
      </p>
      <form
        action={cancelOrderToSaldo}
        onSubmit={async (event) => {
          if (skipRef.current) return;
          event.preventDefault();
          const form = event.currentTarget;
          const ok = await confirm({
            title: "Kembalikan saldo & batalkan order?",
            description: `Rp ${amount.toLocaleString("id-ID")} akan dikredit ke saldo member. Order ${orderCode} menjadi Dibatalkan.`,
            confirmLabel: "Kembalikan saldo",
            variant: "danger",
          });
          if (!ok) return;
          skipRef.current = true;
          form.requestSubmit();
        }}
      >
        <input type="hidden" name="orderId" value={orderId} />
        <div className="console-order-actions__step-foot">
          <button type="submit" className="console-btn-secondary">
            Batalkan & kembalikan saldo
          </button>
        </div>
      </form>
    </section>
  );
}
