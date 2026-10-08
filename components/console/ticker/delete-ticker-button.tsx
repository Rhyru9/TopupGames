"use client";

import { deleteTickerItem } from "@/app/console/(panel)/ticker/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import { ConsoleIconButton, ConsoleIconTrash } from "@/components/console/console-icon-button";
import { useRef } from "react";

type DeleteTickerButtonProps = {
  tickerId: string;
  tickerLabel: string;
};

export function DeleteTickerButton({ tickerId, tickerLabel }: DeleteTickerButtonProps) {
  const confirm = useConsoleConfirm();
  const skipConfirmRef = useRef(false);

  return (
    <form
      action={deleteTickerItem}
      className="console-table-action"
      onSubmit={async (event) => {
        if (skipConfirmRef.current) return;
        event.preventDefault();

        const confirmed = await confirm({
          title: "Hapus item ticker?",
          description: `Item "${tickerLabel}" akan dihapus permanen.`,
          confirmLabel: "Hapus",
          variant: "danger",
        });
        if (!confirmed) return;

        skipConfirmRef.current = true;
        event.currentTarget.requestSubmit();
      }}
    >
      <input type="hidden" name="tickerId" value={tickerId} />
      <ConsoleIconButton type="submit" title="Hapus item" variant="danger">
        <ConsoleIconTrash />
      </ConsoleIconButton>
    </form>
  );
}
