"use client";

import { createPortal } from "react-dom";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveProductType,
  type GameCatalogActionState,
} from "@/app/console/(panel)/produk/[id]/catalog/actions";
import {
  ConsoleFormUploadProvider,
  useConsoleFormUploadSubmit,
} from "@/components/console/console-form-upload";
import { ConsoleImageUpload } from "@/components/console/console-image-upload";
import { useConsoleActionToast } from "@/components/console/use-console-action-toast";
import { gameCatalogToasts } from "@/lib/catalog-products/game-catalog-toasts";
import { slugify } from "@/lib/slug";

export type ProductTypeGameOption = {
  id: string;
  name: string;
};

export type ProductTypeFormValues = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  iconUrl?: string | null;
};

type ProductTypeFormModalProps = {
  open: boolean;
  onClose: () => void;
  products: ProductTypeGameOption[];
  defaultProductId?: string;
  type?: ProductTypeFormValues | null;
};

const initialState: GameCatalogActionState = {};

export function ProductTypeFormModal(props: ProductTypeFormModalProps) {
  return (
    <ConsoleFormUploadProvider>
      <ProductTypeFormModalContent {...props} />
    </ConsoleFormUploadProvider>
  );
}

function ProductTypeFormModalContent({
  open,
  onClose,
  products,
  defaultProductId,
  type,
}: ProductTypeFormModalProps) {
  const router = useRouter();
  const { notifySuccess } = useConsoleActionToast();
  const [mounted, setMounted] = useState(false);
  const isEdit = Boolean(type);
  const [state, action, pending] = useActionState(saveProductType, initialState);
  const { onSubmit, isUploading, uploadError } = useConsoleFormUploadSubmit(action);
  const isSaving = pending || isUploading;
  const [slug, setSlug] = useState(type?.slug ?? "");
  const slugTouchedRef = useRef(isEdit || Boolean(type?.slug));
  const handledSuccessRef = useRef(false);
  const notifySuccessRef = useRef(notifySuccess);
  const onCloseRef = useRef(onClose);
  const routerRef = useRef(router);
  notifySuccessRef.current = notifySuccess;
  onCloseRef.current = onClose;
  routerRef.current = router;
  const createProductId = defaultProductId && products.some((p) => p.id === defaultProductId)
    ? defaultProductId
    : products[0]?.id ?? "";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Submit baru → izinkan toast sekali lagi (pesan sukses sering sama).
  useEffect(() => {
    if (pending) {
      handledSuccessRef.current = false;
      return;
    }
    if (!state.success || handledSuccessRef.current) return;
    handledSuccessRef.current = true;
    notifySuccessRef.current(state.success || gameCatalogToasts.typeSaved);
    onCloseRef.current();
    routerRef.current.refresh();
  }, [pending, state.success]);

  useEffect(() => {
    if (!open) return;
    setSlug(type?.slug ?? "");
    slugTouchedRef.current = isEdit || Boolean(type?.slug);
  }, [open, isEdit, type?.id, type?.slug]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="console-modal-overlay console-modal-overlay--soft" role="presentation" onClick={onClose}>
      <div
        className="console-modal console-modal--compact"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-type-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <form action={action} onSubmit={onSubmit} className="console-form console-form--modal">
          {isEdit ? <input type="hidden" name="productId" value={type!.productId} /> : null}
          {!isEdit && products.length === 1 ? (
            <input type="hidden" name="productId" value={createProductId} />
          ) : null}
          {type ? <input type="hidden" name="productTypeId" value={type.id} /> : null}

          <div className="console-modal__head console-modal__head--split">
            <div>
              <p className="console-modal__eyebrow">{isEdit ? "Edit" : "Baru"}</p>
              <h2 id="product-type-modal-title" className="console-modal__title">
                {isEdit ? type!.name : "Jenis Produk Baru"}
              </h2>
            </div>
            <button
              type="button"
              className="console-modal__close"
              onClick={onClose}
              aria-label="Tutup"
            >
              ×
            </button>
          </div>

          <div className="console-modal__body">
            {state.error ? (
              <div className="console-alert console-alert--error" role="alert">
                {state.error}
              </div>
            ) : null}

            {uploadError ? (
              <div className="console-alert console-alert--error" role="alert">
                {uploadError}
              </div>
            ) : null}

            {!isEdit ? (
              <p className="console-modal__text console-modal__intro">
                Section filter di halaman produk — contoh: Diamonds, Membership, Weekly Pass.
              </p>
            ) : null}

            {!isEdit && products.length > 1 ? (
              <div className="console-field">
                <label className="console-field__label" htmlFor="product-type-product">
                  Produk *
                </label>
                <select
                  id="product-type-product"
                  name="productId"
                  key={`product-new-${open}`}
                  defaultValue={createProductId}
                  className="console-input w-full"
                  required
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {isEdit ? (
              <p className="console-field__hint console-modal__meta">
                Produk: <strong>{products.find((p) => p.id === type!.productId)?.name ?? "—"}</strong>
              </p>
            ) : null}

            <ConsoleImageUpload
              key={`icon-${type?.id ?? "new"}-${open}`}
              name="iconUrl"
              kind="product-type-icon"
              label="Icon Jenis"
              initialValue={type?.iconUrl ?? ""}
              hint="PNG/JPG/WebP · opsional · tampil di filter storefront"
            />

            <div className="console-field">
              <label className="console-field__label" htmlFor="product-type-name">
                Nama Jenis *
              </label>
              <input
                id="product-type-name"
                name="name"
                key={`name-${type?.id ?? "new"}-${open}`}
                defaultValue={type?.name ?? ""}
                required
                className="console-input w-full"
                placeholder="Contoh: Diamonds"
                autoFocus
                onChange={(event) => {
                  if (!isEdit && !slugTouchedRef.current) {
                    setSlug(slugify(event.target.value));
                  }
                }}
              />
            </div>

            <div className="console-field">
              <label className="console-field__label" htmlFor="product-type-slug">
                Slug URL
              </label>
              <input
                id="product-type-slug"
                name="slug"
                value={slug}
                onChange={(event) => {
                  slugTouchedRef.current = true;
                  setSlug(event.target.value);
                }}
                className="console-input w-full"
                placeholder="diamonds"
              />
              <p className="console-field__hint">
                {isEdit
                  ? "Identitas internal — ubah hanya jika perlu."
                  : "Terisi otomatis dari nama — bisa diedit kapan saja."}
              </p>
            </div>
          </div>

          <div className="console-modal__actions">
            <button type="button" className="console-btn-ghost" onClick={onClose}>
              Batal
            </button>
            <button type="submit" disabled={isSaving} className="console-btn-primary console-btn-primary--inline">
              {isSaving ? "Menyimpan..." : isEdit ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
