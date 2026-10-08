"use client";

import { toggleFlashSaleEnabled } from "@/app/console/(panel)/promo/flash-sale/actions";

type FlashSaleStatusToggleProps = {
  flashSaleId: string;
  isEnabled: boolean;
};

export function FlashSaleStatusToggle({ flashSaleId, isEnabled }: FlashSaleStatusToggleProps) {
  return (
    <form action={toggleFlashSaleEnabled} className="console-table-action">
      <input type="hidden" name="flashSaleId" value={flashSaleId} />
      <label
        className="console-toggle console-toggle--compact"
        title={isEnabled ? "Nonaktifkan campaign" : "Aktifkan campaign"}
      >
        <input
          type="checkbox"
          className="console-toggle__input"
          defaultChecked={isEnabled}
          onChange={(event) => {
            event.currentTarget.form?.requestSubmit();
          }}
          aria-label={isEnabled ? "Nonaktifkan campaign" : "Aktifkan campaign"}
        />
        <span className="console-toggle__track" aria-hidden />
      </label>
    </form>
  );
}
