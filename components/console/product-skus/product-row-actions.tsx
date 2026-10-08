"use client";

import { ConsoleIconButton, ConsoleIconEdit } from "@/components/console/console-icon-button";
import type { ProductSkuListFilters } from "@/lib/console-redirect";
import { DeleteProductButton } from "./delete-product-button";
import { ProductStatusToggle } from "./product-status-toggle";

type ProductRowActionsProps = {
  productSkuId: string;
  skuName: string;
  isAvailable: boolean;
  listFilters?: ProductSkuListFilters;
};

export function ProductRowActions({
  productSkuId,
  skuName,
  isAvailable,
  listFilters = {},
}: ProductRowActionsProps) {
  return (
    <div className="console-table__actions console-table__actions--toolbar">
      <ProductStatusToggle
        productSkuId={productSkuId}
        isAvailable={isAvailable}
        listFilters={listFilters}
      />
      <ConsoleIconButton
        href={`/console/product-skus/${productSkuId}/edit`}
        title="Edit SKU"
        variant="default"
      >
        <ConsoleIconEdit />
      </ConsoleIconButton>
      <DeleteProductButton
        productSkuId={productSkuId}
        skuName={skuName}
        listFilters={listFilters}
      />
    </div>
  );
}
