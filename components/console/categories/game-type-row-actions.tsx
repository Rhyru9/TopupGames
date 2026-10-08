"use client";

import { ConsoleIconButton, ConsoleIconEdit } from "@/components/console/console-icon-button";
import { DeleteGameTypeButton } from "./delete-game-type-button";
import { GameTypeStatusToggle } from "./game-type-status-toggle";

type GameTypeRowActionsProps = {
  categoryId: string;
  categoryName: string;
  productCount: number;
  isActive: boolean;
};

export function GameTypeRowActions({
  categoryId,
  categoryName,
  productCount,
  isActive,
}: GameTypeRowActionsProps) {
  return (
    <div className="console-table__actions console-table__actions--toolbar">
      <GameTypeStatusToggle categoryId={categoryId} isActive={isActive} />
      <ConsoleIconButton
        href={`/console/categories/${categoryId}/edit`}
        title="Edit kategori"
        variant="accent"
      >
        <ConsoleIconEdit />
      </ConsoleIconButton>
      <DeleteGameTypeButton
        categoryId={categoryId}
        categoryName={categoryName}
        productCount={productCount}
      />
    </div>
  );
}
