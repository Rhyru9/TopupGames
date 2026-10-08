"use client";

import { markOrderFulfillmentManual } from "@/app/console/(panel)/orders/actions";
import { useState } from "react";

type OrderActionManualProps = {
  orderId: string;
  providerSlug: string | null;
  step: number;
};

export function OrderActionManual({ orderId, providerSlug, step }: OrderActionManualProps) {
  const [serial, setSerial] = useState("");
  const [message, setMessage] = useState("");
  const isManualProvider = providerSlug === "manual";

  return (
    <section className="console-order-actions__step console-panel console-panel--padded">
      <div className="console-order-actions__step-head">
        <span className="console-order-actions__step-num">{step}</span>
        <h2 className="console-order-actions__step-title">
          {isManualProvider ? "Selesaikan manual" : "Override manual"}
        </h2>
      </div>
      <p className="console-field__hint">
        {isManualProvider
          ? "Isi SN bila ada, lalu tandai sukses atau gagal."
          : "Hanya jika provider sudah selesai di luar sistem atau perlu koreksi status."}
      </p>
      <div className="console-provider-form-stack">
        <div className="console-field">
          <label htmlFor="manual-sn" className="console-field__label">
            SN / kode (opsional)
          </label>
          <input
            id="manual-sn"
            className="console-input w-full"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="SN voucher / serial"
          />
        </div>
        <div className="console-field">
          <label htmlFor="manual-msg" className="console-field__label">
            Catatan (opsional)
          </label>
          <input
            id="manual-msg"
            className="console-input w-full"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Catatan admin"
          />
        </div>
        <div className="console-order-actions__step-foot">
          <form action={markOrderFulfillmentManual}>
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="status" value="SUCCESS" />
            <input type="hidden" name="serial" value={serial} />
            <input type="hidden" name="message" value={message} />
            <button type="submit" className="console-btn-primary console-btn-primary--inline">
              Tandai sukses
            </button>
          </form>
          <form action={markOrderFulfillmentManual}>
            <input type="hidden" name="orderId" value={orderId} />
            <input type="hidden" name="status" value="FAILED" />
            <input type="hidden" name="serial" value={serial} />
            <input type="hidden" name="message" value={message} />
            <button type="submit" className="console-btn-secondary">
              Tandai gagal
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
