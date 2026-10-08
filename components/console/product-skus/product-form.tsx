"use client";

import { useActionState, useMemo, useState } from "react";
import { saveProduct, type ProductFormState } from "@/app/console/(panel)/product-skus/actions";
import type { ProductOption } from "@/lib/catalog-products/game-options";
import type { FulfillmentProviderOption } from "@/lib/fulfillment-providers";
import { formatRupiah } from "@/lib/format-rupiah";
import { productStatusOptions } from "@/lib/product-labels";
import { catalogBrandFieldLabel, providerUsesCatalogBrand } from "@/lib/catalog-products/sku-catalog-brand";

export type ProductFormValues = {
  productId: string;
  productTypeId: string;
  name: string;
  providerId: string;
  providerSku: string;
  costPrice: number;
  marginGuest: number;
  marginMember: number;
  cashbackPoin: number;
  status: "AVAILABLE" | "UNAVAILABLE";
  note: string;
  keepCustomName: boolean;
  providerCatalogBrand: string;
};

export type ProductTypeOption = {
  id: string;
  name: string;
  productId: string;
};

type ProductFormProps = {
  mode: "create" | "edit";
  productSkuId?: string;
  products: ProductOption[];
  providers: FulfillmentProviderOption[];
  productTypes: ProductTypeOption[];
  initialValues?: Partial<ProductFormValues>;
};

const initialState: ProductFormState = {};

export function ProductForm({
  mode,
  productSkuId,
  products,
  providers,
  productTypes,
  initialValues,
}: ProductFormProps) {
  const [state, formAction, pending] = useActionState(saveProduct, initialState);

  const defaultProductId = products[0]?.id ?? "";
  const defaultProviderId = providers[0]?.id ?? "";
  const mergedInitial: ProductFormValues = {
    productId: defaultProductId,
    productTypeId: "",
    name: "",
    providerId: defaultProviderId,
    providerSku: "",
    costPrice: 0,
    marginGuest: 0,
    marginMember: 0,
    cashbackPoin: 0,
    status: "AVAILABLE",
    note: "",
    keepCustomName: false,
    providerCatalogBrand: "",
    ...initialValues,
  };

  const [selectedProductId, setSelectedProductId] = useState(mergedInitial.productId);
  const [selectedProviderId, setSelectedProviderId] = useState(mergedInitial.providerId);
  const typesForProduct = useMemo(
    () => productTypes.filter((type) => type.productId === selectedProductId),
    [productTypes, selectedProductId],
  );
  const selectedProvider = providers.find((provider) => provider.id === selectedProviderId);
  const isManualProvider = selectedProvider?.slug === "manual";
  const showCatalogBrand = providerUsesCatalogBrand(selectedProvider?.slug ?? "");
  const values = mergedInitial;

  const previewGuest = values.costPrice + values.marginGuest;
  const previewMember = values.costPrice + values.marginMember;

  return (
    <form action={formAction} className="console-form console-form--sku">
      {mode === "edit" && productSkuId ? (
        <input type="hidden" name="productSkuId" value={productSkuId} />
      ) : null}

      {state.error ? (
        <div className="console-alert console-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="console-form__sections">
        <div className="console-form__section">
          <h3 className="console-form__section-title">Identitas SKU</h3>
          <div className="console-form__grid">
            <div className="console-field">
              <label htmlFor="productId" className="console-field__label">
                Produk
              </label>
              <select
                id="productId"
                name="productId"
                defaultValue={values.productId}
                required
                className="console-input w-full"
                onChange={(event) => setSelectedProductId(event.target.value)}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.productId ? (
                <p className="console-field__error">{state.fieldErrors.productId}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="productTypeId" className="console-field__label">
                Jenis Produk
              </label>
              <select
                id="productTypeId"
                name="productTypeId"
                defaultValue={values.productTypeId}
                className="console-input w-full"
                key={selectedProductId}
              >
                <option value="">— Tanpa jenis —</option>
                {typesForProduct.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.productTypeId ? (
                <p className="console-field__error">{state.fieldErrors.productTypeId}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="name" className="console-field__label">
                Nama SKU
              </label>
              <input
                id="name"
                name="name"
                defaultValue={values.name}
                required
                className="console-input w-full"
                placeholder="86 Diamond"
              />
              {state.fieldErrors?.name ? (
                <p className="console-field__error">{state.fieldErrors.name}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="providerId" className="console-field__label">
                Provider
              </label>
              <select
                id="providerId"
                name="providerId"
                defaultValue={values.providerId}
                required
                className="console-input w-full"
                onChange={(event) => setSelectedProviderId(event.target.value)}
              >
                {providers.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.providerId ? (
                <p className="console-field__error">{state.fieldErrors.providerId}</p>
              ) : isManualProvider ? (
                <p className="console-field__hint">
                  Provider Manual — tidak perlu API. Order diproses admin setelah customer bayar.
                </p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="providerSku" className="console-field__label">
                {isManualProvider ? "Kode SKU Internal" : "SKU Provider"}
              </label>
              <input
                id="providerSku"
                name="providerSku"
                defaultValue={values.providerSku}
                required
                className="console-input w-full"
                placeholder={isManualProvider ? "spesial-100k atau kode bebas" : "ML022"}
              />
              {state.fieldErrors?.providerSku ? (
                <p className="console-field__error">{state.fieldErrors.providerSku}</p>
              ) : isManualProvider ? (
                <p className="console-field__hint">
                  Bebas format, unik per produk. Contoh: <code>promo-lebaran</code>,{" "}
                  <code>manual-vip-500k</code>.
                </p>
              ) : null}
            </div>

            {showCatalogBrand ? (
              <div className="console-field">
                <label htmlFor="providerCatalogBrand" className="console-field__label">
                  {catalogBrandFieldLabel(selectedProvider?.slug ?? "")}
                </label>
                <input
                  id="providerCatalogBrand"
                  name="providerCatalogBrand"
                  defaultValue={values.providerCatalogBrand}
                  className="console-input w-full"
                  placeholder={
                    selectedProvider?.slug === "iak"
                      ? "mobile_legend"
                      : selectedProvider?.slug === "melostore"
                        ? "Mobile Legends (ID)"
                        : "MOBILE LEGENDS"
                  }
                />
                {state.fieldErrors?.providerCatalogBrand ? (
                  <p className="console-field__error">{state.fieldErrors.providerCatalogBrand}</p>
                ) : (
                  <p className="console-field__hint">
                    Dipakai saat cek ketersediaan katalog provider. Salin persis dari panel provider.
                  </p>
                )}
              </div>
            ) : (
              <div className="console-field">
                <label htmlFor="status" className="console-field__label">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={values.status}
                  className="console-input w-full"
                >
                  {productStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="console-form__section">
          <h3 className="console-form__section-title">Harga &amp; cashback</h3>
          <div className="console-form__grid">
            <div className="console-field">
              <label htmlFor="costPrice" className="console-field__label">
                Harga Modal (Rp)
              </label>
              <input
                id="costPrice"
                name="costPrice"
                type="number"
                min={0}
                step={1}
                defaultValue={values.costPrice}
                required
                className="console-input w-full"
              />
              {state.fieldErrors?.costPrice ? (
                <p className="console-field__error">{state.fieldErrors.costPrice}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="marginGuest" className="console-field__label">
                Margin Guest (Rp)
              </label>
              <input
                id="marginGuest"
                name="marginGuest"
                type="number"
                min={0}
                step={1}
                defaultValue={values.marginGuest}
                className="console-input w-full"
              />
              {state.fieldErrors?.marginGuest ? (
                <p className="console-field__error">{state.fieldErrors.marginGuest}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="marginMember" className="console-field__label">
                Margin Member (Rp)
              </label>
              <input
                id="marginMember"
                name="marginMember"
                type="number"
                min={0}
                step={1}
                defaultValue={values.marginMember}
                className="console-input w-full"
              />
              {state.fieldErrors?.marginMember ? (
                <p className="console-field__error">{state.fieldErrors.marginMember}</p>
              ) : null}
            </div>

            <div className="console-field">
              <label htmlFor="cashbackPoin" className="console-field__label">
                Cashback poin
              </label>
              <input
                id="cashbackPoin"
                name="cashbackPoin"
                type="number"
                min={0}
                step={1}
                defaultValue={values.cashbackPoin}
                className="console-input w-full"
              />
              {state.fieldErrors?.cashbackPoin ? (
                <p className="console-field__error">{state.fieldErrors.cashbackPoin}</p>
              ) : (
                <p className="console-field__hint">
                  Poin dikredit ke member setelah order lunas. Isi 0 jika tanpa cashback.
                </p>
              )}
            </div>

            <div className="console-field console-field--full">
              <p className="console-field__hint console-field__hint--inline">
                Harga jual dihitung otomatis: Guest {formatRupiah(previewGuest)} · Member{" "}
                {formatRupiah(previewMember)}
              </p>
            </div>
          </div>
        </div>

        <div className="console-form__section">
          <h3 className="console-form__section-title">Status &amp; opsi</h3>
          <div className="console-form__grid">
            {showCatalogBrand ? (
              <div className="console-field">
                <label htmlFor="status" className="console-field__label">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={values.status}
                  className="console-input w-full"
                >
                  {productStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div
              className={`console-field${showCatalogBrand ? "" : " console-field--full"}`}
            >
              <div className="console-setting-row console-setting-row--compact">
                <div className="console-setting-row__body">
                  <p className="console-setting-row__title">Kunci nama saat sync</p>
                  <p className="console-setting-row__hint">
                    Re-sync dari provider tidak mengubah nama tampilan SKU yang sudah kamu edit.
                  </p>
                </div>
                <label className="console-toggle console-toggle--setting">
                  <input
                    type="checkbox"
                    name="keepCustomName"
                    className="console-toggle__input"
                    defaultChecked={values.keepCustomName}
                  />
                  <span className="console-toggle__track" aria-hidden />
                </label>
              </div>
            </div>

            <div className="console-field console-field--full">
              <label htmlFor="note" className="console-field__label">
                Catatan (opsional)
              </label>
              <textarea
                id="note"
                name="note"
                rows={3}
                defaultValue={values.note}
                className="console-input console-textarea w-full"
                placeholder="Catatan internal atau info promo"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="console-form__actions">
        <button type="submit" disabled={pending} className="console-btn-primary console-form__submit">
          {pending ? "Menyimpan..." : mode === "create" ? "Tambah SKU" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
