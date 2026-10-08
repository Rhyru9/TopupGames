"use client";

import { useRef } from "react";
import { deleteFlashSale } from "@/app/console/(panel)/promo/flash-sale/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import {
  ConsoleIconButton,
  ConsoleIconEdit,
  ConsoleIconTrash,
} from "@/components/console/console-icon-button";

type FlashSaleRowActionsProps = {
  flashSaleId: string;
  name: string;
};

export function FlashSaleRowActions({ flashSaleId, name }: FlashSaleRowActionsProps) {
  const confirm = useConsoleConfirm();
  const skipConfirmRef = useRef(false);

  return (
    <div className="console-table__actions console-table__actions--toolbar">
      <ConsoleIconButton
        href={`/console/promo/flash-sale/${flashSaleId}/edit`}
        title="Edit flash sale"
        variant="default"
      >
        <ConsoleIconEdit />
      </ConsoleIconButton>
      <form
        action={deleteFlashSale}
        className="console-table-action"
        onSubmit={async (event) => {
          if (skipConfirmRef.current) return;
          event.preventDefault();
          const confirmed = await confirm({
            title: "Hapus flash sale?",
            description: `"${name}" beserta semua SKU di dalamnya akan dihapus.`,
            confirmLabel: "Hapus",
            variant: "danger",
          });
          if (!confirmed) return;
          skipConfirmRef.current = true;
          event.currentTarget.requestSubmit();
        }}
      >
        <input type="hidden" name="flashSaleId" value={flashSaleId} />
        <ConsoleIconButton type="submit" title="Hapus flash sale" variant="danger">
          <ConsoleIconTrash />
        </ConsoleIconButton>
      </form>
    </div>
  );
}
