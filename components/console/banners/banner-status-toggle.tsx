"use client";

import { toggleBannerStatus } from "@/app/console/(panel)/banners/actions";

type BannerStatusToggleProps = {
  bannerId: string;
  isActive: boolean;
};

export function BannerStatusToggle({ bannerId, isActive }: BannerStatusToggleProps) {
  return (
    <form action={toggleBannerStatus} className="console-table-action">
      <input type="hidden" name="bannerId" value={bannerId} />
      <label
        className="console-toggle console-toggle--compact"
        title={isActive ? "Banner aktif di beranda" : "Banner nonaktif"}
      >
        <input
          type="checkbox"
          className="console-toggle__input"
          defaultChecked={isActive}
          onChange={(event) => {
            event.currentTarget.form?.requestSubmit();
          }}
          aria-label={isActive ? "Nonaktifkan banner" : "Aktifkan banner"}
        />
        <span className="console-toggle__track" aria-hidden />
      </label>
    </form>
  );
}
