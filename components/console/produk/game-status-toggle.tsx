"use client";

import { toggleGameStatus } from "@/app/console/(panel)/produk/actions";

type GameStatusToggleProps = {
  productId: string;
  isActive: boolean;
};

export function GameStatusToggle({ productId, isActive }: GameStatusToggleProps) {
  return (
    <form action={toggleGameStatus} className="console-table-action">
      <input type="hidden" name="productId" value={productId} />
      <label
        className="console-toggle console-toggle--compact"
        title={isActive ? "Produk tampil di storefront" : "Produk disembunyikan"}
      >
        <input
          type="checkbox"
          className="console-toggle__input"
          defaultChecked={isActive}
          onChange={(event) => {
            event.currentTarget.form?.requestSubmit();
          }}
          aria-label={isActive ? "Sembunyikan produk" : "Aktifkan produk"}
        />
        <span className="console-toggle__track" aria-hidden />
      </label>
    </form>
  );
}
