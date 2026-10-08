"use client";

import { deleteProduct } from "@/app/console/(panel)/product-skus/actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import { ConsoleIconButton, ConsoleIconTrash } from "@/components/console/console-icon-button";
import type { ProductSkuListFilters } from "@/lib/console-redirect";
import { useRef } from "react";

type DeleteProductButtonProps = {
  productSkuId: string;
  skuName: string;
  listFilters?: ProductSkuListFilters;
};

export function DeleteProductButton({
  productSkuId,
  skuName,
  listFilters = {},
}: DeleteProductButtonProps) {
  const confirm = useConsoleConfirm();
  const formRef = useRef<HTMLFormElement>(null);
  const skipConfirmRef = useRef(false);

  return (
    <form
      ref={formRef}
      action={deleteProduct}
      className="console-table-action"
      onSubmit={async (event) => {
        if (skipConfirmRef.current) {
          skipConfirmRef.current = false;
          return;
        }
        event.preventDefault();
        const confirmed = await confirm({
          title: "Hapus SKU?",
          description: `SKU "${skuName}" akan dihapus permanen dari katalog.`,
          confirmLabel: "Hapus",
          variant: "danger",
        });
        if (!confirmed) return;
        skipConfirmRef.current = true;
        formRef.current?.requestSubmit();
      }}
    >
      <input type="hidden" name="productSkuId" value={productSkuId} />
      <input type="hidden" name="listQ" value={listFilters.q ?? ""} />
      <input type="hidden" name="listProductId" value={listFilters.productId ?? ""} />
      <input type="hidden" name="listProviderId" value={listFilters.providerId ?? ""} />
      <input type="hidden" name="listStatus" value={listFilters.status ?? ""} />
      <input type="hidden" name="listPage" value={listFilters.page ?? ""} />
      <input type="hidden" name="listPageSize" value={listFilters.pageSize ?? ""} />
      <ConsoleIconButton type="submit" title="Hapus SKU" variant="danger">
        <ConsoleIconTrash />
      </ConsoleIconButton>
    </form>
  );
}
