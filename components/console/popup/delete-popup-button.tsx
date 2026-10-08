"use client";

import { deletePopup } from "@/app/console/(panel)/popup/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import { ConsoleIconButton, ConsoleIconTrash } from "@/components/console/console-icon-button";
import { useRef } from "react";

type DeletePopupButtonProps = {
  popupId: string;
  popupTitle: string;
};

export function DeletePopupButton({ popupId, popupTitle }: DeletePopupButtonProps) {
  const confirm = useConsoleConfirm();
  const skipConfirmRef = useRef(false);

  return (
    <form
      action={deletePopup}
      className="console-table-action"
      onSubmit={async (event) => {
        if (skipConfirmRef.current) return;
        event.preventDefault();

        const confirmed = await confirm({
          title: "Hapus popup?",
          description: `Popup "${popupTitle}" akan dihapus permanen.`,
          confirmLabel: "Hapus",
          variant: "danger",
        });
        if (!confirmed) return;

        skipConfirmRef.current = true;
        event.currentTarget.requestSubmit();
      }}
    >
      <input type="hidden" name="popupId" value={popupId} />
      <ConsoleIconButton type="submit" title="Hapus popup" variant="danger">
        <ConsoleIconTrash />
      </ConsoleIconButton>
    </form>
  );
}
