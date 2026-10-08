"use client";

import { toggleGamePopular } from "@/app/console/(panel)/produk/actions";
import { ConsoleIconButton, ConsoleIconFire } from "@/components/console/console-icon-button";

type GamePopularToggleProps = {
  productId: string;
  isPopular: boolean;
};

export function GamePopularToggle({ productId, isPopular }: GamePopularToggleProps) {
  return (
    <form action={toggleGamePopular} className="console-table-action">
      <input type="hidden" name="productId" value={productId} />
      <ConsoleIconButton
        type="submit"
        title={isPopular ? "Hapus dari populer" : "Tandai populer"}
        variant={isPopular ? "fire-active" : "fire"}
      >
        <ConsoleIconFire active={isPopular} />
      </ConsoleIconButton>
    </form>
  );
}
