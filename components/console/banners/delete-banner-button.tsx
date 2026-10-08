"use client";

import { deleteBanner } from "@/app/console/(panel)/banners/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import { ConsoleIconButton, ConsoleIconTrash } from "@/components/console/console-icon-button";
import { useRef } from "react";

type DeleteBannerButtonProps = {
  bannerId: string;
  bannerTitle: string;
};

export function DeleteBannerButton({ bannerId, bannerTitle }: DeleteBannerButtonProps) {
  const confirm = useConsoleConfirm();
  const skipConfirmRef = useRef(false);

  return (
    <form
      action={deleteBanner}
      className="console-table-action"
      onSubmit={async (event) => {
        if (skipConfirmRef.current) return;
        event.preventDefault();

        const confirmed = await confirm({
          title: "Hapus banner?",
          description: `Banner "${bannerTitle}" akan dihapus permanen beserta file gambarnya.`,
          confirmLabel: "Hapus",
          variant: "danger",
        });
        if (!confirmed) return;

        skipConfirmRef.current = true;
        event.currentTarget.requestSubmit();
      }}
    >
      <input type="hidden" name="bannerId" value={bannerId} />
      <ConsoleIconButton type="submit" title="Hapus banner" variant="danger">
        <ConsoleIconTrash />
      </ConsoleIconButton>
    </form>
  );
}
