"use client";

import { togglePaymentGatewayStatus } from "@/app/console/(panel)/settings/payment/actions";

type PaymentGatewayStatusToggleProps = {
  gatewayId: string;
  isActive: boolean;
};

export function PaymentGatewayStatusToggle({
  gatewayId,
  isActive,
}: PaymentGatewayStatusToggleProps) {
  return (
    <form action={togglePaymentGatewayStatus} className="console-provider-status">
      <input type="hidden" name="gatewayId" value={gatewayId} />

      <label
        className="console-toggle"
        title={isActive ? "Payment gateway aktif" : "Payment gateway nonaktif"}
      >
        <input
          type="checkbox"
          className="console-toggle__input"
          defaultChecked={isActive}
          onChange={(event) => {
            event.currentTarget.form?.requestSubmit();
          }}
          aria-label={isActive ? "Nonaktifkan payment gateway" : "Aktifkan payment gateway"}
        />
        <span className="console-toggle__track" aria-hidden />
        <span className="console-toggle__label">{isActive ? "Aktif" : "Nonaktif"}</span>
      </label>
    </form>
  );
}
