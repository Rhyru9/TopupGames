"use client";

import { togglePopupStatus } from "@/app/console/(panel)/popup/actions";

type PopupStatusToggleProps = {
  popupId: string;
  isActive: boolean;
};

export function PopupStatusToggle({ popupId, isActive }: PopupStatusToggleProps) {
  return (
    <form action={togglePopupStatus} className="console-table-action">
      <input type="hidden" name="popupId" value={popupId} />
      <label
        className="console-toggle console-toggle--compact"
        title={isActive ? "Popup aktif" : "Popup nonaktif"}
      >
        <input
          type="checkbox"
          className="console-toggle__input"
          defaultChecked={isActive}
          onChange={(event) => {
            event.currentTarget.form?.requestSubmit();
          }}
          aria-label={isActive ? "Nonaktifkan popup" : "Aktifkan popup"}
        />
        <span className="console-toggle__track" aria-hidden />
      </label>
    </form>
  );
}
