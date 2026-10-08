"use client";

import { deleteExpense } from "@/app/console/(panel)/laporan/pengeluaran/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import {
  ConsoleIconButton,
  ConsoleIconEdit,
  ConsoleIconTrash,
} from "@/components/console/console-icon-button";
import { useRef } from "react";

type ExpenseRowActionsProps = {
  expenseId: string;
  description: string;
};

export function ExpenseRowActions({ expenseId, description }: ExpenseRowActionsProps) {
  const confirm = useConsoleConfirm();
  const skipConfirmRef = useRef(false);

  return (
    <div className="console-table__actions">
      <ConsoleIconButton
        href={`/console/laporan/pengeluaran/${expenseId}/edit`}
        title="Edit pengeluaran"
      >
        <ConsoleIconEdit />
      </ConsoleIconButton>
      <form
        action={deleteExpense}
        className="console-table-action"
        onSubmit={async (event) => {
          if (skipConfirmRef.current) return;
          event.preventDefault();

          const confirmed = await confirm({
            title: "Hapus pengeluaran?",
            description: `Pengeluaran "${description.slice(0, 80)}" akan dihapus permanen.`,
            confirmLabel: "Hapus",
            variant: "danger",
          });
          if (!confirmed) return;

          skipConfirmRef.current = true;
          event.currentTarget.requestSubmit();
        }}
      >
        <input type="hidden" name="expenseId" value={expenseId} />
        <ConsoleIconButton type="submit" title="Hapus pengeluaran" variant="danger">
          <ConsoleIconTrash />
        </ConsoleIconButton>
      </form>
    </div>
  );
}
