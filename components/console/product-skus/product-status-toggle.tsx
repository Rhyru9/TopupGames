"use client";

import { toggleProductStatus } from "@/app/console/(panel)/product-skus/actions";
import type { ProductSkuListFilters } from "@/lib/console-redirect";

type ProductStatusToggleProps = {
  productSkuId: string;
  isAvailable: boolean;
  listFilters?: ProductSkuListFilters;
};

export function ProductStatusToggle({
  productSkuId,
  isAvailable,
  listFilters = {},
}: ProductStatusToggleProps) {
  return (
    <form action={toggleProductStatus} className="console-table-action">
      <input type="hidden" name="productSkuId" value={productSkuId} />
      <input type="hidden" name="listQ" value={listFilters.q ?? ""} />
      <input type="hidden" name="listProductId" value={listFilters.productId ?? ""} />
      <input type="hidden" name="listProviderId" value={listFilters.providerId ?? ""} />
      <input type="hidden" name="listStatus" value={listFilters.status ?? ""} />
      <input type="hidden" name="listPage" value={listFilters.page ?? ""} />
      <input type="hidden" name="listPageSize" value={listFilters.pageSize ?? ""} />
      <label
        className="console-toggle console-toggle--compact"
        title={isAvailable ? "SKU tersedia di storefront" : "SKU tidak tersedia"}
      >
        <input
          type="checkbox"
          className="console-toggle__input"
          defaultChecked={isAvailable}
          onChange={(event) => {
            event.currentTarget.form?.requestSubmit();
          }}
          aria-label={isAvailable ? "Nonaktifkan SKU" : "Aktifkan SKU"}
        />
        <span className="console-toggle__track" aria-hidden />
      </label>
    </form>
  );
}
