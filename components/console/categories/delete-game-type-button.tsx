"use client";

import { deleteGameType } from "@/app/console/(panel)/categories/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import { ConsoleIconButton, ConsoleIconTrash } from "@/components/console/console-icon-button";
import { useRef } from "react";

type DeleteGameTypeButtonProps = {
  categoryId: string;
  categoryName: string;
  productCount: number;
};

export function DeleteGameTypeButton({
  categoryId,
  categoryName,
  productCount,
}: DeleteGameTypeButtonProps) {
  const confirm = useConsoleConfirm();
  const skipConfirmRef = useRef(false);

  return (
    <form
      action={deleteGameType}
      className="console-table-action"
      onSubmit={async (event) => {
        if (skipConfirmRef.current) return;
        event.preventDefault();

        if (productCount > 0) {
          await confirm({
            title: "Tidak bisa dihapus",
            description: `Kategori "${categoryName}" masih dipakai ${productCount} produk. Pindahkan produk dulu atau nonaktifkan kategori.`,
            confirmLabel: "Mengerti",
            variant: "default",
          });
          return;
        }

        const confirmed = await confirm({
          title: "Hapus kategori?",
          description: `Kategori "${categoryName}" akan dihapus permanen.`,
          confirmLabel: "Hapus",
          variant: "danger",
        });
        if (!confirmed) return;

        skipConfirmRef.current = true;
        event.currentTarget.requestSubmit();
      }}
    >
      <input type="hidden" name="categoryId" value={categoryId} />
      <ConsoleIconButton type="submit" title="Hapus kategori" variant="danger">
        <ConsoleIconTrash />
      </ConsoleIconButton>
    </form>
  );
}
