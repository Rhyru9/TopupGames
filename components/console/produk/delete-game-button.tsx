"use client";

import { deleteGame } from "@/app/console/(panel)/produk/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import { ConsoleIconButton, ConsoleIconTrash } from "@/components/console/console-icon-button";
import { useRef } from "react";

type DeleteGameButtonProps = {
  productId: string;
  productName: string;
};

export function DeleteGameButton({ productId, productName }: DeleteGameButtonProps) {
  const confirm = useConsoleConfirm();
  const skipConfirmRef = useRef(false);

  return (
    <form
      action={deleteGame}
      className="console-table-action"
      onSubmit={async (event) => {
        if (skipConfirmRef.current) return;
        event.preventDefault();
        const confirmed = await confirm({
          title: "Hapus produk?",
          description: `"${productName}" dan semua SKU di dalamnya akan dihapus permanen.`,
          confirmLabel: "Hapus",
          variant: "danger",
        });
        if (!confirmed) return;
        skipConfirmRef.current = true;
        event.currentTarget.requestSubmit();
      }}
    >
      <input type="hidden" name="productId" value={productId} />
      <ConsoleIconButton type="submit" title="Hapus produk" variant="danger">
        <ConsoleIconTrash />
      </ConsoleIconButton>
    </form>
  );
}
