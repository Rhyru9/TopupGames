"use client";

import Image from "next/image";
import { useState } from "react";
import { ConsoleIconButton, ConsoleIconEdit } from "@/components/console/console-icon-button";
import { DeleteProductTypeButton } from "@/components/console/product-types/delete-product-type-button";
import {
  ProductTypeFormModal,
  type ProductTypeFormValues,
  type ProductTypeGameOption,
} from "@/components/console/product-types/product-type-form-modal";

export type ProductTypeRow = {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  productId: string;
  productName: string;
  skuCount: number;
};

type ProductTypesTableProps = {
  products: ProductTypeGameOption[];
  productTypes: ProductTypeRow[];
};

export function ProductTypesTable({ products, productTypes }: ProductTypesTableProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ProductTypeFormValues | null>(null);

  function openEditModal(type: ProductTypeRow) {
    setEditingType({
      id: type.id,
      productId: type.productId,
      name: type.name,
      slug: type.slug,
      iconUrl: type.iconUrl,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingType(null);
  }

  if (productTypes.length === 0) {
    return (
      <div className="console-empty">
        <div className="console-empty__icon" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M4 7h16M4 12h10M4 17h16" strokeLinecap="round" />
          </svg>
        </div>
        <p className="console-empty__title">Belum ada jenis produk</p>
        <p className="console-empty__text">
          Tambahkan section seperti Diamonds, Membership, atau Weekly Pass.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="console-table-wrap">
        <table className="console-table console-table--categories">
          <thead>
            <tr>
              <th className="console-table__name-head">Jenis</th>
              <th>Produk</th>
              <th>Slug</th>
              <th className="console-table__count-head">SKU</th>
              <th className="console-table__actions-head">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {productTypes.map((type) => (
              <tr key={type.id}>
                <td>
                  <div className="console-table__game">
                    <div className="console-table__thumb">
                      {type.iconUrl ? (
                        <Image
                          src={type.iconUrl}
                          alt=""
                          width={36}
                          height={36}
                          className="console-table__thumb-img"
                        />
                      ) : (
                        <span className="console-table__thumb-fallback" aria-hidden />
                      )}
                    </div>
                    <div className="console-table__game-meta">
                      <p className="console-table__primary">{type.name}</p>
                    </div>
                  </div>
                </td>
                <td>{type.productName}</td>
                <td>
                  <code className="console-table__code">{type.slug}</code>
                </td>
                <td className="console-table__count-cell">{type.skuCount}</td>
                <td className="console-table__actions-cell">
                  <div className="console-table__actions console-table__actions--toolbar">
                    <ConsoleIconButton
                      title="Edit jenis"
                      variant="accent"
                      onClick={() => openEditModal(type)}
                    >
                      <ConsoleIconEdit />
                    </ConsoleIconButton>
                    <DeleteProductTypeButton
                      productId={type.productId}
                      typeId={type.id}
                      typeName={type.name}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProductTypeFormModal
        open={modalOpen}
        onClose={closeModal}
        products={products}
        type={editingType}
      />
    </>
  );
}
