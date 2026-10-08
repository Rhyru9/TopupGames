"use client";

import { toggleGameTypeStatus } from "@/app/console/(panel)/categories/actions";

type GameTypeStatusToggleProps = {
  categoryId: string;
  isActive: boolean;
};

export function GameTypeStatusToggle({ categoryId, isActive }: GameTypeStatusToggleProps) {
  return (
    <form action={toggleGameTypeStatus} className="console-table-action">
      <input type="hidden" name="categoryId" value={categoryId} />
      <label
        className="console-toggle console-toggle--compact"
        title={isActive ? "Kategori aktif di storefront" : "Kategori nonaktif"}
      >
        <input
          type="checkbox"
          className="console-toggle__input"
          defaultChecked={isActive}
          onChange={(event) => {
            event.currentTarget.form?.requestSubmit();
          }}
          aria-label={isActive ? "Nonaktifkan kategori" : "Aktifkan kategori"}
        />
        <span className="console-toggle__track" aria-hidden />
      </label>
    </form>
  );
}
