"use client";

import { togglePromoVoucherEnabled } from "@/app/console/(panel)/promo/voucher-promo/actions";

type VoucherPromoStatusToggleProps = {
  voucherId: string;
  isEnabled: boolean;
};

export function VoucherPromoStatusToggle({
  voucherId,
  isEnabled,
}: VoucherPromoStatusToggleProps) {
  return (
    <form action={togglePromoVoucherEnabled} className="console-table-action">
      <input type="hidden" name="voucherId" value={voucherId} />
      <label
        className="console-toggle console-toggle--compact"
        title={isEnabled ? "Nonaktifkan voucher" : "Aktifkan voucher"}
      >
        <input
          type="checkbox"
          className="console-toggle__input"
          defaultChecked={isEnabled}
          onChange={(event) => {
            event.currentTarget.form?.requestSubmit();
          }}
          aria-label={isEnabled ? "Nonaktifkan voucher" : "Aktifkan voucher"}
        />
        <span className="console-toggle__track" aria-hidden />
      </label>
    </form>
  );
}
