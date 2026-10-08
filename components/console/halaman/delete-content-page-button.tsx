"use client";

import { deleteContentPage } from "@/app/console/(panel)/halaman/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import { ConsoleIconButton, ConsoleIconTrash } from "@/components/console/console-icon-button";
import { useRef } from "react";

type DeleteContentPageButtonProps = {
  pageId: string;
  pageTitle: string;
};

export function DeleteContentPageButton({ pageId, pageTitle }: DeleteContentPageButtonProps) {
  const confirm = useConsoleConfirm();
  const skipConfirmRef = useRef(false);

  return (
    <form
      action={deleteContentPage}
      className="console-table-action"
      onSubmit={async (event) => {
        if (skipConfirmRef.current) return;
        event.preventDefault();

        const confirmed = await confirm({
          title: "Hapus halaman?",
          description: `Halaman "${pageTitle}" akan dihapus permanen.`,
          confirmLabel: "Hapus",
          variant: "danger",
        });
        if (!confirmed) return;

        skipConfirmRef.current = true;
        event.currentTarget.requestSubmit();
      }}
    >
      <input type="hidden" name="pageId" value={pageId} />
      <ConsoleIconButton type="submit" title="Hapus halaman" variant="danger">
        <ConsoleIconTrash />
      </ConsoleIconButton>
    </form>
  );
}
