"use client";

import { toggleTickerStatus } from "@/app/console/(panel)/ticker/actions";

type TickerStatusToggleProps = {
  tickerId: string;
  isActive: boolean;
};

export function TickerStatusToggle({ tickerId, isActive }: TickerStatusToggleProps) {
  return (
    <form action={toggleTickerStatus} className="console-table-action">
      <input type="hidden" name="tickerId" value={tickerId} />
      <label
        className="console-toggle console-toggle--compact"
        title={isActive ? "Item aktif di beranda" : "Item nonaktif"}
      >
        <input
          type="checkbox"
          className="console-toggle__input"
          defaultChecked={isActive}
          onChange={(event) => {
            event.currentTarget.form?.requestSubmit();
          }}
          aria-label={isActive ? "Nonaktifkan item" : "Aktifkan item"}
        />
        <span className="console-toggle__track" aria-hidden />
      </label>
    </form>
  );
}
