"use client";

import { toggleContentPageStatus } from "@/app/console/(panel)/halaman/actions";

type ContentPageStatusToggleProps = {
  pageId: string;
  isActive: boolean;
};

export function ContentPageStatusToggle({ pageId, isActive }: ContentPageStatusToggleProps) {
  return (
    <form action={toggleContentPageStatus} className="console-table-action">
      <input type="hidden" name="pageId" value={pageId} />
      <label
        className="console-toggle console-toggle--compact"
        title={isActive ? "Halaman aktif" : "Halaman nonaktif"}
      >
        <input
          type="checkbox"
          className="console-toggle__input"
          defaultChecked={isActive}
          onChange={(event) => {
            event.currentTarget.form?.requestSubmit();
          }}
          aria-label={isActive ? "Nonaktifkan halaman" : "Aktifkan halaman"}
        />
        <span className="console-toggle__track" aria-hidden />
      </label>
    </form>
  );
}
