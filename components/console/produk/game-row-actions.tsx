"use client";

import {
  ConsoleIconButton,
  ConsoleIconEdit,
  ConsoleIconView,
} from "@/components/console/console-icon-button";
import { DeleteGameButton } from "./delete-game-button";
import { GamePopularToggle } from "./game-popular-toggle";
import { GameStatusToggle } from "./game-status-toggle";

type GameRowActionsProps = {
  productId: string;
  productName: string;
  isPopular: boolean;
  isActive: boolean;
};

export function GameRowActions({ productId, productName, isPopular, isActive }: GameRowActionsProps) {
  return (
    <div className="console-table__actions console-table__actions--toolbar">
      <GamePopularToggle productId={productId} isPopular={isPopular} />
      <GameStatusToggle productId={productId} isActive={isActive} />
      <ConsoleIconButton href={`/console/product-skus?productId=${productId}`} title="Lihat SKU" variant="default">
        <ConsoleIconView />
      </ConsoleIconButton>
      <ConsoleIconButton href={`/console/produk/${productId}/edit`} title="Edit produk" variant="accent">
        <ConsoleIconEdit />
      </ConsoleIconButton>
      <DeleteGameButton productId={productId} productName={productName} />
    </div>
  );
}
