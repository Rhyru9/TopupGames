"use client";

import { markOrderFulfillmentCorrectionFailed } from "@/app/console/(panel)/orders/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import { useRef, useState } from "react";

type OrderActionCorrectionFailedProps = {
  orderId: string;
  step: number;
};

export function OrderActionCorrectionFailed({
  orderId,
  step,
}: OrderActionCorrectionFailedProps) {
  const confirm = useConsoleConfirm();
  const skipRef = useRef(false);
  const [note, setNote] = useState("Item tidak masuk — koreksi admin.");

  return (
    <section className="console-order-actions__step console-order-actions__step--warn console-panel console-panel--padded">
      <div className="console-order-actions__step-head">
        <span className="console-order-actions__step-num">{step}</span>
        <h2 className="console-order-actions__step-title">Tandai gagal (koreksi)</h2>
      </div>
      <p className="console-field__hint">
        Pakai jika provider bilang sukses tapi item tidak masuk ke akun player. Status
        berubah ke <strong>Gagal</strong> — setelah itu pengembalian saldo bisa dilakukan
        untuk member.
      </p>
      <form
        action={markOrderFulfillmentCorrectionFailed}
        onSubmit={async (event) => {
          if (skipRef.current) return;
          event.preventDefault();
          const form = event.currentTarget;
          const ok = await confirm({
            title: "Tandai order gagal (koreksi)?",
            description:
              "Status fulfillment menjadi Gagal. Customer akan melihat gagal di invoice. Lanjutkan hanya setelah cek provider.",
            confirmLabel: "Tandai gagal",
            variant: "danger",
          });
          if (!ok) return;
          skipRef.current = true;
          form.requestSubmit();
        }}
        className="console-provider-form-stack"
      >
        <input type="hidden" name="orderId" value={orderId} />
        <div className="console-field">
          <label htmlFor="correction-note" className="console-field__label">
            Catatan koreksi
          </label>
          <input
            id="correction-note"
            name="note"
            className="console-input w-full"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
          />
        </div>
        <div className="console-order-actions__step-foot">
          <button type="submit" className="console-btn-secondary">
            Tandai gagal
          </button>
        </div>
      </form>
    </section>
  );
}
