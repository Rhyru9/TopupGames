"use client";

import { toggleProviderStatus } from "@/app/console/(panel)/settings/providers/actions";

type ProviderStatusToggleProps = {
  providerId: string;
  isActive: boolean;
  skuCount: number;
};

export function ProviderStatusToggle({
  providerId,
  isActive,
  skuCount,
}: ProviderStatusToggleProps) {
  const disableOff = isActive && skuCount > 0;

  return (
    <form action={toggleProviderStatus} className="console-provider-status">
      <input type="hidden" name="providerId" value={providerId} />

      <label
        className={`console-toggle ${disableOff ? "console-toggle--disabled" : ""}`}
        title={
          disableOff
            ? "Nonaktifkan SKU produk yang memakai provider ini terlebih dahulu."
            : isActive
              ? "Provider aktif"
              : "Provider nonaktif"
        }
      >
        <input
          type="checkbox"
          className="console-toggle__input"
          defaultChecked={isActive}
          disabled={disableOff}
          onChange={(event) => {
            event.currentTarget.form?.requestSubmit();
          }}
          aria-label={isActive ? "Nonaktifkan provider" : "Aktifkan provider"}
        />
        <span className="console-toggle__track" aria-hidden />
        <span className="console-toggle__label">{isActive ? "Aktif" : "Nonaktif"}</span>
      </label>
    </form>
  );
}
