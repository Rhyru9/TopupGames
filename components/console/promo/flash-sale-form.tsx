"use client";

import Link from "next/link";
import { useMemo, useState, useActionState } from "react";
import {
  saveFlashSale,
  type FlashSaleFormState,
} from "@/app/console/(panel)/promo/flash-sale/actions";
import { formatRupiah } from "@/lib/format-rupiah";
import type { FlashSaleSkuOption } from "@/lib/promo/flash-sale-shared";
import { toDatetimeLocalValue } from "@/lib/promo/flash-sale-shared";

export type FlashSaleFormValues = {
  name: string;
  headline: string;
  headlineAccent: string;
  tagline: string;
  startsAt: string;
  endsAt: string;
  isEnabled: boolean;
  sortOrder: number;
  items: Array<{
    productSkuId: string;
    priceGuest: number;
    priceMember: number;
    quota: number;
    soldCount: number;
    sortOrder: number;
  }>;
};

type FlashSaleFormProps = {
  mode: "create" | "edit";
  flashSaleId?: string;
  skuOptions: FlashSaleSkuOption[];
  initialValues?: Partial<FlashSaleFormValues>;
};

const initialState: FlashSaleFormState = {};

type DraftItem = {
  key: string;
  productId: string;
  productSkuId: string;
  priceGuest: string;
  priceMember: string;
  quota: string;
  soldCount: string;
};

function defaultWindow(): { startsAt: string; endsAt: string } {
  const start = new Date();
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return {
    startsAt: toDatetimeLocalValue(start),
    endsAt: toDatetimeLocalValue(end),
  };
}

function suggestFlashPrice(normal: number) {
  if (normal <= 0) return "";
  const suggested = Math.max(100, Math.round(normal * 0.9));
  return String(suggested >= normal ? Math.max(100, normal - 100) : suggested);
}

function buildDraftFromSku(sku: FlashSaleSkuOption | undefined, productId = ""): Omit<DraftItem, "key"> {
  return {
    productId: sku?.productId ?? productId,
    productSkuId: sku?.id ?? "",
    priceGuest: sku ? suggestFlashPrice(sku.priceGuest) : "",
    priceMember: sku ? suggestFlashPrice(sku.priceMember) : "",
    quota: "10",
    soldCount: "0",
  };
}

export function FlashSaleForm({
  mode,
  flashSaleId,
  skuOptions,
  initialValues,
}: FlashSaleFormProps) {
  const [state, formAction, pending] = useActionState(saveFlashSale, initialState);
  const windowDefaults = defaultWindow();

  const values: FlashSaleFormValues = {
    name: "",
    headline: "",
    headlineAccent: "",
    tagline: "",
    startsAt: windowDefaults.startsAt,
    endsAt: windowDefaults.endsAt,
    isEnabled: true,
    sortOrder: 0,
    items: [],
    ...initialValues,
  };

  const products = useMemo(() => {
    const map = new Map<string, string>();
    for (const sku of skuOptions) map.set(sku.productId, sku.productName);
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [skuOptions]);

  const skuById = useMemo(() => {
    const map = new Map<string, FlashSaleSkuOption>();
    for (const sku of skuOptions) map.set(sku.id, sku);
    return map;
  }, [skuOptions]);

  const [items, setItems] = useState<DraftItem[]>(() =>
    values.items.map((item, index) => {
      const sku = skuOptions.find((option) => option.id === item.productSkuId);
      return {
        key: `${item.productSkuId}-${index}`,
        productId: sku?.productId ?? "",
        productSkuId: item.productSkuId,
        priceGuest: String(item.priceGuest),
        priceMember: String(item.priceMember),
        quota: String(item.quota),
        soldCount: String(item.soldCount),
      };
    }),
  );

  function skusForProduct(productId: string, currentKey: string) {
    const taken = new Set(
      items.filter((item) => item.key !== currentKey && item.productSkuId).map((item) => item.productSkuId),
    );
    return skuOptions.filter((sku) => sku.productId === productId && !taken.has(sku.id));
  }

  function addItem() {
    const used = new Set(items.map((item) => item.productSkuId).filter(Boolean));
    const firstFree = skuOptions.find((sku) => !used.has(sku.id));
    const draft = buildDraftFromSku(firstFree, firstFree?.productId ?? products[0]?.id ?? "");
    setItems((current) => [...current, { key: `new-${Date.now()}`, ...draft }]);
  }

  function updateItem(key: string, patch: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item) => {
        if (item.key !== key) return item;
        const next = { ...item, ...patch };

        if (patch.productId && patch.productId !== item.productId) {
          const taken = new Set(
            current
              .filter((row) => row.key !== key && row.productSkuId)
              .map((row) => row.productSkuId),
          );
          const firstSku = skuOptions.find(
            (sku) => sku.productId === patch.productId && !taken.has(sku.id),
          );
          Object.assign(next, buildDraftFromSku(firstSku, patch.productId));
        }

        if (patch.productSkuId && patch.productSkuId !== item.productSkuId) {
          const sku = skuById.get(patch.productSkuId);
          if (sku) {
            next.priceGuest = suggestFlashPrice(sku.priceGuest);
            next.priceMember = suggestFlashPrice(sku.priceMember);
          }
        }

        return next;
      }),
    );
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  function moveItem(key: string, direction: -1 | 1) {
    setItems((current) => {
      const index = current.findIndex((item) => item.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      const [row] = next.splice(index, 1);
      next.splice(target, 0, row);
      return next;
    });
  }

  const itemsJson = JSON.stringify(
    items
      .filter((item) => item.productSkuId)
      .map((item, index) => ({
        productSkuId: item.productSkuId,
        priceGuest: Number(item.priceGuest) || 0,
        priceMember: Number(item.priceMember) || 0,
        quota: Number(item.quota) || 0,
        soldCount: Number(item.soldCount) || 0,
        sortOrder: index,
      })),
  );

  return (
    <form action={formAction} className="console-form flash-sale-form">
      {mode === "edit" && flashSaleId ? (
        <input type="hidden" name="flashSaleId" value={flashSaleId} />
      ) : null}
      <input type="hidden" name="itemsJson" value={itemsJson} />

      {state.error ? (
        <div className="console-alert console-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="flash-sale-form__layout">
      <section className="console-provider-card flash-sale-form__col flash-sale-form__col--campaign">
        <div className="console-provider-card__head">
          <div>
            <p className="console-provider-card__title">Detail campaign</p>
            <p className="console-field__hint" style={{ marginTop: "0.25rem" }}>
              Nama, teks kiri landing, dan jadwal tampil saat campaign aktif.
            </p>
          </div>
        </div>
        <div className="console-provider-card__body">
          <div className="flash-sale-form__campaign">
            <div className="console-field flash-sale-form__name">
              <label htmlFor="name" className="console-field__label">
                Nama campaign *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={values.name}
                required
                className="console-input w-full"
                placeholder="Contoh: Flash Sale Weekend"
              />
              {state.fieldErrors?.name ? (
                <p className="console-field__error">{state.fieldErrors.name}</p>
              ) : null}
            </div>

            <div className="flash-sale-form__schedule">
              <div className="console-field">
                <label htmlFor="headline" className="console-field__label">
                  Judul baris 1
                </label>
                <input
                  id="headline"
                  name="headline"
                  type="text"
                  defaultValue={values.headline}
                  maxLength={60}
                  className="console-input w-full"
                  placeholder="HARGA SPESIAL"
                />
                {state.fieldErrors?.headline ? (
                  <p className="console-field__error">{state.fieldErrors.headline}</p>
                ) : null}
              </div>
              <div className="console-field">
                <label htmlFor="headlineAccent" className="console-field__label">
                  Judul baris 2 (neon)
                </label>
                <input
                  id="headlineAccent"
                  name="headlineAccent"
                  type="text"
                  defaultValue={values.headlineAccent}
                  maxLength={60}
                  className="console-input w-full"
                  placeholder="WAKTU TERBATAS!"
                />
                {state.fieldErrors?.headlineAccent ? (
                  <p className="console-field__error">{state.fieldErrors.headlineAccent}</p>
                ) : null}
              </div>
            </div>
            <p className="console-field__hint" style={{ marginTop: "-0.35rem" }}>
              Kosong = pakai teks default di atas.
            </p>

            <div className="console-field flash-sale-form__name">
              <label htmlFor="tagline" className="console-field__label">
                Teks kiri landing
              </label>
              <input
                id="tagline"
                name="tagline"
                type="text"
                defaultValue={values.tagline}
                maxLength={80}
                className="console-input w-full"
                placeholder="Contoh: Promo Minggu Ini"
              />
              <p className="console-field__hint">
                Tampil di bawah headline flash sale. Kosong = pakai nama campaign.
              </p>
              {state.fieldErrors?.tagline ? (
                <p className="console-field__error">{state.fieldErrors.tagline}</p>
              ) : null}
            </div>

            <div className="flash-sale-form__schedule">
              <div className="console-field">
                <label htmlFor="startsAt" className="console-field__label">
                  Mulai *
                </label>
                <div className="console-input-wrap console-input-wrap--picker">
                  <input
                    id="startsAt"
                    name="startsAt"
                    type="datetime-local"
                    defaultValue={values.startsAt}
                    required
                    className="console-input w-full"
                  />
                </div>
                {state.fieldErrors?.startsAt ? (
                  <p className="console-field__error">{state.fieldErrors.startsAt}</p>
                ) : null}
              </div>
              <div className="console-field">
                <label htmlFor="endsAt" className="console-field__label">
                  Selesai *
                </label>
                <div className="console-input-wrap console-input-wrap--picker">
                  <input
                    id="endsAt"
                    name="endsAt"
                    type="datetime-local"
                    defaultValue={values.endsAt}
                    required
                    className="console-input w-full"
                  />
                </div>
                {state.fieldErrors?.endsAt ? (
                  <p className="console-field__error">{state.fieldErrors.endsAt}</p>
                ) : null}
              </div>
            </div>

            <div className="flash-sale-form__meta">
              <div className="console-field">
                <label htmlFor="sortOrder" className="console-field__label">
                  Urutan
                </label>
                <input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  defaultValue={values.sortOrder}
                  className="console-input w-full"
                />
                <p className="console-field__hint">Lebih kecil = prioritas lebih tinggi.</p>
              </div>
              <div className="console-field flash-sale-form__enabled">
                <span className="console-field__label">Status</span>
                <label className="console-toggle console-toggle--setting">
                  <input
                    type="checkbox"
                    name="isEnabled"
                    defaultChecked={values.isEnabled}
                    className="console-toggle__input"
                  />
                  <span className="console-toggle__track" aria-hidden />
                  <span className="console-toggle__label">Aktifkan campaign</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="console-provider-card flash-sale-form__col flash-sale-form__col--items">
        <div className="console-provider-card__head console-provider-card__head--split">
          <div>
            <p className="console-provider-card__title">SKU flash sale</p>
            <p className="console-field__hint" style={{ marginTop: "0.25rem" }}>
              {items.length} item · harga flash harus lebih rendah dari harga normal
            </p>
          </div>
          <button
            type="button"
            className="console-btn-secondary"
            onClick={addItem}
            disabled={skuOptions.length === 0}
          >
            + Tambah SKU
          </button>
        </div>

        <div className="console-provider-card__body flash-sale-form__items">
          {state.fieldErrors?.itemsJson ? (
            <p className="console-field__error">{state.fieldErrors.itemsJson}</p>
          ) : null}

          {skuOptions.length === 0 ? (
            <div className="flash-sale-form__empty">
              <p className="console-empty__title">Belum ada SKU tersedia</p>
              <p className="console-empty__text">
                Sync atau buat SKU AVAILABLE dulu di menu SKU Produk.
              </p>
              <Link href="/console/product-skus" className="console-btn-secondary">
                Buka SKU Produk
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="flash-sale-form__empty">
              <p className="console-empty__title">Belum ada item</p>
              <p className="console-empty__text">
                Tambahkan SKU yang ikut flash sale, lalu atur harga, kuota, dan terjual.
              </p>
              <button type="button" className="console-btn-primary" onClick={addItem}>
                + Tambah SKU pertama
              </button>
            </div>
          ) : (
            items.map((item, index) => {
              const sku = skuById.get(item.productSkuId);
              const productSkus = skusForProduct(item.productId, item.key);
              const quota = Number(item.quota) || 0;
              const sold = Number(item.soldCount) || 0;
              const remaining = quota - sold;
              const guestOk = sku && Number(item.priceGuest) > 0 && Number(item.priceGuest) < sku.priceGuest;
              const memberOk =
                sku && Number(item.priceMember) > 0 && Number(item.priceMember) < sku.priceMember;

              return (
                <article key={item.key} className="flash-sale-item">
                  <header className="flash-sale-item__head">
                    <div className="flash-sale-item__title">
                      <span className="flash-sale-item__index">{index + 1}</span>
                      <div>
                        <p className="flash-sale-item__name">
                          {sku?.name ?? "Pilih SKU"}
                        </p>
                        <p className="console-field__hint">
                          {sku?.productName ?? "Belum dipilih"}
                        </p>
                      </div>
                    </div>
                    <div className="flash-sale-item__tools">
                      <button
                        type="button"
                        className="console-btn-ghost console-btn-ghost--compact"
                        onClick={() => moveItem(item.key, -1)}
                        disabled={index === 0}
                        title="Naikkan"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="console-btn-ghost console-btn-ghost--compact"
                        onClick={() => moveItem(item.key, 1)}
                        disabled={index === items.length - 1}
                        title="Turunkan"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="console-btn-ghost console-btn-ghost--danger console-btn-ghost--compact"
                        onClick={() => removeItem(item.key)}
                      >
                        Hapus
                      </button>
                    </div>
                  </header>

                  <div className="flash-sale-item__body">
                    <div className="flash-sale-item__row flash-sale-item__row--pick">
                      <div className="console-field">
                        <label className="console-field__label">Produk</label>
                        <select
                          value={item.productId}
                          onChange={(event) =>
                            updateItem(item.key, { productId: event.target.value })
                          }
                          className="console-input w-full"
                        >
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="console-field">
                        <label className="console-field__label">SKU</label>
                        <select
                          value={item.productSkuId}
                          onChange={(event) =>
                            updateItem(item.key, { productSkuId: event.target.value })
                          }
                          className="console-input w-full"
                        >
                          {productSkus.length === 0 && !item.productSkuId ? (
                            <option value="">— Tidak ada SKU —</option>
                          ) : null}
                          {item.productSkuId &&
                          !productSkus.some((option) => option.id === item.productSkuId) ? (
                            <option value={item.productSkuId}>
                              {sku?.name ?? item.productSkuId}
                            </option>
                          ) : null}
                          {productSkus.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flash-sale-item__section">
                      <p className="flash-sale-item__section-label">Harga flash</p>
                      <div className="flash-sale-item__row flash-sale-item__row--prices">
                        <div className="console-field">
                          <label className="console-field__label">Guest</label>
                          <input
                            type="number"
                            min={1}
                            value={item.priceGuest}
                            onChange={(event) =>
                              updateItem(item.key, { priceGuest: event.target.value })
                            }
                            className="console-input w-full"
                          />
                          {sku ? (
                            <p
                              className={`console-field__hint ${guestOk ? "" : "flash-sale-item__warn"}`}
                            >
                              Normal {formatRupiah(sku.priceGuest)}
                              {guestOk ? "" : " · harus lebih murah"}
                            </p>
                          ) : null}
                        </div>
                        <div className="console-field">
                          <label className="console-field__label">Member</label>
                          <input
                            type="number"
                            min={1}
                            value={item.priceMember}
                            onChange={(event) =>
                              updateItem(item.key, { priceMember: event.target.value })
                            }
                            className="console-input w-full"
                          />
                          {sku ? (
                            <p
                              className={`console-field__hint ${memberOk ? "" : "flash-sale-item__warn"}`}
                            >
                              Normal {formatRupiah(sku.priceMember)}
                              {memberOk ? "" : " · harus lebih murah"}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flash-sale-item__section">
                      <p className="flash-sale-item__section-label">Kuota checkout</p>
                      <div className="flash-sale-item__row flash-sale-item__row--quota">
                        <div className="console-field">
                          <label className="console-field__label">Kuota</label>
                          <input
                            type="number"
                            min={1}
                            value={item.quota}
                            onChange={(event) =>
                              updateItem(item.key, { quota: event.target.value })
                            }
                            className="console-input w-full"
                          />
                        </div>
                        <div className="console-field">
                          <label className="console-field__label">Terjual / direservasi</label>
                          <input
                            type="number"
                            min={0}
                            readOnly={mode === "edit" && Boolean(initialValues?.items?.some((row) => row.productSkuId === item.productSkuId))}
                            value={item.soldCount}
                            onChange={(event) =>
                              updateItem(item.key, { soldCount: event.target.value })
                            }
                            className="console-input w-full"
                          />
                        </div>
                        <div className="flash-sale-item__remain">
                          <span className="console-field__label">Sisa</span>
                          <p
                            className={`flash-sale-item__remain-value ${
                              remaining > 0 ? "flash-sale-item__remain-value--ok" : "flash-sale-item__warn"
                            }`}
                          >
                            {Number.isFinite(remaining) ? remaining : "—"}
                          </p>
                          <p className="console-field__hint">Reservasi checkout dihitung otomatis.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
      </div>

      <div className="flash-sale-form__footer">
        <Link href="/console/promo/flash-sale" className="console-btn-ghost">
          Batal
        </Link>
        <button type="submit" disabled={pending} className="console-btn-primary console-form__submit">
          {pending ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Buat Flash Sale"}
        </button>
      </div>
    </form>
  );
}
