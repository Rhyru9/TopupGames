"use client";

import { deleteProductTypeForm } from "@/app/console/(panel)/produk/[id]/catalog/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import { ConsoleIconButton, ConsoleIconTrash } from "@/components/console/console-icon-button";
import { useRef } from "react";

type DeleteProductTypeButtonProps = {
  productId: string;
  typeId: string;
  typeName: string;
};

export function DeleteProductTypeButton({ productId, typeId, typeName }: DeleteProductTypeButtonProps) {
  const confirm = useConsoleConfirm();
  const skipConfirmRef = useRef(false);

  return (
    <form
      action={deleteProductTypeForm}
      className="console-table-action"
      onSubmit={async (event) => {
        if (skipConfirmRef.current) return;
        event.preventDefault();
        const confirmed = await confirm({
          title: "Hapus jenis produk?",
          description: `"${typeName}" akan dihapus. SKU yang terhubung tidak ikut terhapus, hanya lepas dari jenis ini.`,
          confirmLabel: "Hapus",
          variant: "danger",
        });
        if (!confirmed) return;
        skipConfirmRef.current = true;
        event.currentTarget.requestSubmit();
      }}
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="productTypeId" value={typeId} />
      <ConsoleIconButton type="submit" title="Hapus jenis" variant="danger">
        <ConsoleIconTrash />
      </ConsoleIconButton>
    </form>
  );
}
