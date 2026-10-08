"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  bulkDeleteProductSkus,
  bulkUpdateProductSkus,
} from "@/app/console/(panel)/product-skus/bulk-actions";
import { useConsoleConfirm } from "@/components/console/console-confirm-provider";
import { useConsoleActionToast } from "@/components/console/use-console-action-toast";
import type { ProductSkuListFilters } from "@/lib/console-redirect";
import {
  ProductTable,
  type ProductSkuTableRow,
} from "@/components/console/product-skus/product-table";
import {
  catalogBrandFieldLabel,
  providerUsesCatalogBrand,
} from "@/lib/catalog-products/sku-catalog-brand";

type ProductSkusBulkPanelProps = {
  skus: ProductSkuTableRow[];
  hasFilters?: boolean;
  listFilters?: ProductSkuListFilters;
  providerName?: string;
};

function buildAvailabilityCheckHref(
  selected: Set<string>,
  listFilters: ProductSkuListFilters = {},
) {
  if (selected.size > 0) {
    return `/console/product-skus/check?ids=${[...selected].map(encodeURIComponent).join(",")}`;
  }
  if (listFilters.productId) {
    return `/console/product-skus/check?productId=${encodeURIComponent(listFilters.productId)}`;
  }
  if (listFilters.providerId) {
    return `/console/product-skus/check?providerId=${encodeURIComponent(listFilters.providerId)}`;
  }
  return "/console/product-skus/check";
}

export function ProductSkusBulkPanel({
  skus,
  hasFilters = false,
  listFilters = {},
  providerName,
}: ProductSkusBulkPanelProps) {
  const router = useRouter();
  const confirm = useConsoleConfirm();
  const { notifySuccess, notifyError } = useConsoleActionToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [deletePending, startDelete] = useTransition();

  const pageIds = useMemo(() => skus.map((sku) => sku.id), [skus]);
  const selectedProviderNames = useMemo(() => {
    const names = new Set<string>();
    for (const sku of skus) {
      if (selected.has(sku.id)) names.add(sku.provider.name);
    }
    return [...names];
  }, [skus, selected]);

  useEffect(() => {
    setSelected((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        if (pageIds.includes(id)) next.add(id);
      }
      return next;
    });
  }, [pageIds]);

  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const selectedCount = selected.size;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (pageIds.every((id) => prev.has(id))) return new Set();
      return new Set(pageIds);
    });
  }

  async function handleBulkDelete() {
    if (selectedCount === 0 || deletePending) return;
    const confirmed = await confirm({
      title: "Hapus SKU terpilih?",
      description: `${selectedCount} SKU akan dihapus permanen dari katalog (termasuk hasil filter saat ini).`,
      confirmLabel: "Hapus",
      variant: "danger",
    });
    if (!confirmed) return;

    const ids = [...selected];
    startDelete(async () => {
      const result = await bulkDeleteProductSkus({ ids });
      if (!result.ok) {
        notifyError(result.error);
        return;
      }
      notifySuccess(result.message);
      setSelected(new Set());
      router.refresh();
    });
  }

  const selectionLabel =
    selectedProviderNames.length === 0
      ? providerName || "SKU terpilih"
      : selectedProviderNames.length === 1
        ? selectedProviderNames[0]
        : "beberapa provider";

  return (
    <>
      <div className="console-bulk-bar">
        <div className="console-bulk-bar__left">
          <label className="console-bulk-bar__select-all">
            <input
              type="checkbox"
              className="console-checkbox"
              checked={allSelected}
              onChange={toggleAll}
              disabled={skus.length === 0}
            />
            <span>Pilih semua di halaman</span>
          </label>
          <span className="console-bulk-bar__meta">
            {selectedCount > 0 ? (
              <>
                <strong>{selectedCount}</strong> dipilih
              </>
            ) : null}
          </span>
        </div>
        <div className="console-bulk-bar__right">
          <Link
            href={buildAvailabilityCheckHref(selected, listFilters)}
            className="console-btn-secondary console-bulk-bar__btn"
            title={
              selectedCount > 0
                ? `Cek ketersediaan ${selectedCount} SKU terpilih`
                : listFilters.productId
                  ? "Buka halaman cek — filter produk dari list aktif"
                  : listFilters.providerId
                    ? "Buka halaman cek — filter provider dari list aktif"
                    : "Buka halaman cek ketersediaan (pilih lingkup dulu)"
            }
          >
            {selectedCount > 0 ? "Cek terpilih" : "Cek ketersediaan"}
          </Link>
          <button
            type="button"
            className="console-btn-secondary console-bulk-bar__btn"
            disabled={selectedCount === 0}
            onClick={() => setModalOpen(true)}
            title={selectedCount === 0 ? "Pilih minimal satu SKU" : "Edit massal SKU terpilih"}
          >
            Edit massal
          </button>
          <button
            type="button"
            className="console-btn-secondary console-bulk-bar__btn"
            disabled={selectedCount === 0 || deletePending}
            onClick={() => void handleBulkDelete()}
            title={
              selectedCount === 0
                ? "Pilih minimal satu SKU"
                : "Hapus massal SKU terpilih (bisa dari hasil filter)"
            }
          >
            {deletePending ? "Menghapus…" : "Hapus massal"}
          </button>
        </div>
      </div>

      <ProductTable
        skus={skus}
        hasFilters={hasFilters}
        listFilters={listFilters}
        selectedIds={selected}
        onToggleSelect={toggleOne}
        onToggleSelectAll={toggleAll}
        selectable
      />

      {modalOpen ? (
        <ProductBulkEditModal
          selectedSkus={skus.filter((sku) => selected.has(sku.id))}
          selectionLabel={selectionLabel}
          onClose={() => setModalOpen(false)}
          onDone={() => {
            setModalOpen(false);
            setSelected(new Set());
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}

function ProductBulkEditModal({
  selectedSkus,
  selectionLabel,
  onClose,
  onDone,
}: {
  selectedSkus: ProductSkuTableRow[];
  selectionLabel: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();
  const { notifySuccess, notifyError } = useConsoleActionToast();
  const [marginGuest, setMarginGuest] = useState("");
  const [marginMember, setMarginMember] = useState("");
  const [cashbackPoin, setCashbackPoin] = useState("");
  const [providerCatalogBrand, setProviderCatalogBrand] = useState("");

  const ids = useMemo(() => selectedSkus.map((sku) => sku.id), [selectedSkus]);
  const catalogBrandContext = useMemo(() => {
    const slugs = new Set(
      selectedSkus.map((sku) => sku.provider.slug).filter((slug) => providerUsesCatalogBrand(slug)),
    );
    if (slugs.size !== 1) {
      return { enabled: false as const, slug: null, label: "Brand provider" };
    }
    const slug = [...slugs][0]!;
    return { enabled: true as const, slug, label: catalogBrandFieldLabel(slug) };
  }, [selectedSkus]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, pending]);

  function handleSave() {
    startTransition(async () => {
      const result = await bulkUpdateProductSkus({
        ids,
        marginGuest,
        marginMember,
        cashbackPoin,
        providerCatalogBrand,
      });
      if (!result.ok) {
        notifyError(result.error);
        return;
      }
      notifySuccess(result.message);
      onDone();
    });
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="console-modal-overlay console-modal-overlay--soft"
      role="presentation"
      onClick={() => {
        if (!pending) onClose();
      }}
    >
      <div
        className="console-modal console-modal--compact console-modal--bulk-edit"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="console-form console-form--modal">
          <div className="console-modal__head console-modal__head--split">
            <div className="console-modal__head-main">
              <p className="console-modal__eyebrow">Edit massal</p>
              <h2 id={titleId} className="console-modal__title">
                {ids.length} SKU · {selectionLabel}
              </h2>
            </div>
            <button
              type="button"
              className="console-modal__close"
              onClick={onClose}
              disabled={pending}
              aria-label="Tutup"
            >
              ×
            </button>
          </div>

          <div className="console-modal__body">
            <p className="console-modal__text console-modal__intro">
              Kosongkan field yang tidak ingin diubah. Margin yang diisi{" "}
              <strong>mengganti</strong> margin SKU; harga jual dihitung ulang ={" "}
              <strong>Modal + margin baru</strong> (bukan ditambah ke harga lama).
            </p>

            <div className="console-form__grid console-form__grid--stack">
              <div className="console-field">
                <label htmlFor="bulk-margin-guest" className="console-field__label">
                  Margin Guest (Rp)
                </label>
                <input
                  id="bulk-margin-guest"
                  type="number"
                  min={0}
                  step={1}
                  value={marginGuest}
                  onChange={(e) => setMarginGuest(e.target.value)}
                  className="console-input w-full"
                  placeholder="Tidak diubah"
                  disabled={pending}
                />
              </div>
              <div className="console-field">
                <label htmlFor="bulk-margin-member" className="console-field__label">
                  Margin Member (Rp)
                </label>
                <input
                  id="bulk-margin-member"
                  type="number"
                  min={0}
                  step={1}
                  value={marginMember}
                  onChange={(e) => setMarginMember(e.target.value)}
                  className="console-input w-full"
                  placeholder="Tidak diubah"
                  disabled={pending}
                />
              </div>
              <div className="console-field console-field--full">
                <label htmlFor="bulk-cashback" className="console-field__label">
                  Cashback poin
                </label>
                <input
                  id="bulk-cashback"
                  type="number"
                  min={0}
                  step={1}
                  value={cashbackPoin}
                  onChange={(e) => setCashbackPoin(e.target.value)}
                  className="console-input w-full"
                  placeholder="Tidak diubah"
                  disabled={pending}
                />
                <p className="console-field__hint">
                  Poin dikredit ke member setelah order lunas. Isi 0 untuk menghapus cashback.
                </p>
              </div>
              {catalogBrandContext.enabled ? (
                <div className="console-field console-field--full">
                  <label htmlFor="bulk-catalog-brand" className="console-field__label">
                    {catalogBrandContext.label}
                  </label>
                  <input
                    id="bulk-catalog-brand"
                    type="text"
                    value={providerCatalogBrand}
                    onChange={(e) => setProviderCatalogBrand(e.target.value)}
                    className="console-input w-full"
                    placeholder="Tidak diubah"
                    disabled={pending}
                  />
                  <p className="console-field__hint">
                    Kosongkan jika tidak ingin mengubah brand. Isi untuk set ke semua SKU terpilih.
                  </p>
                </div>
              ) : selectedSkus.some((sku) => providerUsesCatalogBrand(sku.provider.slug)) ? (
                <p className="console-field__hint console-field__hint--warning">
                  Brand massal hanya bisa jika semua SKU terpilih dari provider yang sama
                  (Melostore, Digiflazz, atau IAK).
                </p>
              ) : null}
            </div>
          </div>

          <div className="console-modal__actions console-modal__actions--split">
            <button
              type="button"
              className="console-btn-secondary console-modal__action-btn"
              onClick={onClose}
              disabled={pending}
            >
              Batal
            </button>
            <button
              type="button"
              className="console-btn-primary console-modal__action-btn"
              onClick={handleSave}
              disabled={pending}
            >
              {pending ? "Menyimpan…" : "Simpan perubahan"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
