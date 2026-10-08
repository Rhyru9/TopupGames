"use client";

import { useState } from "react";
import {
  ProductTypeFormModal,
  type ProductTypeGameOption,
} from "@/components/console/product-types/product-type-form-modal";

type ProductTypeAddButtonProps = {
  products: ProductTypeGameOption[];
  defaultProductId?: string;
};

export function ProductTypeAddButton({ products, defaultProductId }: ProductTypeAddButtonProps) {
  const [open, setOpen] = useState(false);

  if (products.length === 0) return null;

  return (
    <>
      <button
        type="button"
        className="console-btn-primary console-page-header__action"
        onClick={() => setOpen(true)}
      >
        + Tambah Jenis
      </button>
      <ProductTypeFormModal
        open={open}
        onClose={() => setOpen(false)}
        products={products}
        defaultProductId={defaultProductId}
      />
    </>
  );
}
