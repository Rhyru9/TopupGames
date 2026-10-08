"use client";

import Link from "next/link";
import { useMemo, useState, useActionState } from "react";
import {
  savePromoVoucher,
  type VoucherFormState,
} from "@/app/console/(panel)/promo/voucher-promo/actions";
import { toDatetimeLocalValue } from "@/lib/promo/voucher-shared";

export type VoucherPromoFormValues = {
  code: string;
  label: string;
  type: "GENERAL" | "SPECIAL";
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  maxDiscount: number;
  minOrderAmount: number;
  stock: number;
  perUserLimit: number;
  isEnabled: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  usedCount?: number;
};

type VoucherPromoFormProps = {
  mode: "create" | "edit";
  voucherId?: string;
  initialValues?: Partial<VoucherPromoFormValues>;
};

const initialState: VoucherFormState = {};

function stockHint(mode: VoucherPromoFormProps["mode"], usedCount?: number) {
  if (mode === "edit" && usedCount != null) {
    return `Terpakai ${usedCount} — stok tidak boleh lebih kecil.`;
  }
  return null;
}

export function VoucherPromoForm({
  mode,
  voucherId,
  initialValues,
}: VoucherPromoFormProps) {
  const [state, formAction, pending] = useActionState(savePromoVoucher, initialState);
  const [type, setType] = useState<"GENERAL" | "SPECIAL">(
    initialValues?.type ?? "GENERAL",
  );
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">(
    initialValues?.discountType ?? "PERCENT",
  );

  const isSpecial = type === "SPECIAL";
  const isPercent = discountType === "PERCENT";
  const stockUsedHint = stockHint(mode, initialValues?.usedCount);

  const defaultStarts = useMemo(() => {
    if (initialValues?.startsAt) return toDatetimeLocalValue(initialValues.startsAt);
    return toDatetimeLocalValue(new Date());
  }, [initialValues?.startsAt]);

  const defaultEnds = useMemo(() => {
    if (initialValues?.endsAt) return toDatetimeLocalValue(initialValues.endsAt);
    const end = new Date();
    end.setDate(end.getDate() + 30);
    return toDatetimeLocalValue(end);
  }, [initialValues?.endsAt]);

  return (
    <form action={formAction} className="console-form console-form--sku voucher-promo-form">
      {voucherId ? <input type="hidden" name="voucherId" value={voucherId} /> : null}

      {state.error ? (
        <div className="console-alert console-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="console-form__sections">
        <section className="console-form__section">
          <h3 className="console-form__section-title">Identitas</h3>
          <div className="console-form__grid">
            <div className="console-field">
              <label htmlFor="voucher-code" className="console-field__label">
                Kode voucher
              </label>
              <input
                id="voucher-code"
                name="code"
                className="console-input w-full voucher-promo-form__code"
                defaultValue={initialValues?.code ?? ""}
                placeholder="PROMO10"
                required
              />
              {state.fieldErrors?.code ? (
                <p className="console-field__error">{state.fieldErrors.code}</p>
              ) : (
                <p className="console-field__hint">Huruf besar, unik, maks. 40 karakter.</p>
              )}
            </div>
            <div className="console-field">
              <label htmlFor="voucher-label" className="console-field__label">
                Label internal (opsional)
              </label>
              <input
                id="voucher-label"
                name="label"
                className="console-input w-full"
                defaultValue={initialValues?.label ?? ""}
                placeholder="Promo awal bulan"
              />
            </div>
          </div>
        </section>

        <section className="console-form__section">
          <h3 className="console-form__section-title">Aturan diskon</h3>
          <div className="console-form__grid">
            <div className="console-field">
              <label htmlFor="voucher-type" className="console-field__label">
                Tipe
              </label>
              <select
                id="voucher-type"
                name="type"
                className="console-input w-full"
                value={type}
                onChange={(e) => setType(e.target.value as "GENERAL" | "SPECIAL")}
              >
                <option value="GENERAL">Umum — wajib minimal transaksi</option>
                <option value="SPECIAL">Khusus — tanpa minimal, 1× per pengguna</option>
              </select>
              {state.fieldErrors?.type ? (
                <p className="console-field__error">{state.fieldErrors.type}</p>
              ) : null}
            </div>
            <div className="console-field">
              <label htmlFor="voucher-discount-type" className="console-field__label">
                Jenis diskon
              </label>
              <select
                id="voucher-discount-type"
                name="discountType"
                className="console-input w-full"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "PERCENT" | "FIXED")}
              >
                <option value="PERCENT">Persen (%)</option>
                <option value="FIXED">Nominal tetap (Rp)</option>
              </select>
            </div>

            <div className="console-field">
              <label htmlFor="voucher-discount-value" className="console-field__label">
                {isPercent ? "Persen diskon" : "Nominal diskon (Rp)"}
              </label>
              <input
                id="voucher-discount-value"
                name="discountValue"
                type="number"
                min={1}
                className="console-input w-full"
                defaultValue={initialValues?.discountValue ?? 10}
                required
              />
              {state.fieldErrors?.discountValue ? (
                <p className="console-field__error">{state.fieldErrors.discountValue}</p>
              ) : null}
            </div>

            {isPercent ? (
              <div className="console-field">
                <label htmlFor="voucher-max-discount" className="console-field__label">
                  Max potongan (Rp)
                </label>
                <input
                  id="voucher-max-discount"
                  name="maxDiscount"
                  type="number"
                  min={0}
                  className="console-input w-full"
                  defaultValue={initialValues?.maxDiscount ?? 0}
                />
                <p className="console-field__hint">0 = tanpa batas atas potongan.</p>
                {state.fieldErrors?.maxDiscount ? (
                  <p className="console-field__error">{state.fieldErrors.maxDiscount}</p>
                ) : null}
              </div>
            ) : (
              <>
                <input type="hidden" name="maxDiscount" value={0} />
                <div className="console-field">
                  <label htmlFor="voucher-stock" className="console-field__label">
                    Stok kuota global
                  </label>
                  <input
                    id="voucher-stock"
                    name="stock"
                    type="number"
                    min={1}
                    className="console-input w-full"
                    defaultValue={initialValues?.stock ?? 100}
                    required
                  />
                  {stockUsedHint ? (
                    <p className="console-field__hint">{stockUsedHint}</p>
                  ) : null}
                  {state.fieldErrors?.stock ? (
                    <p className="console-field__error">{state.fieldErrors.stock}</p>
                  ) : null}
                </div>
              </>
            )}

            <div className="console-field">
              <label htmlFor="voucher-min-order" className="console-field__label">
                Minimal transaksi (Rp)
              </label>
              <input
                id="voucher-min-order"
                name="minOrderAmount"
                type="number"
                min={0}
                className="console-input w-full"
                defaultValue={isSpecial ? 0 : (initialValues?.minOrderAmount ?? 50000)}
                disabled={isSpecial}
                required={!isSpecial}
              />
              {isSpecial ? (
                <p className="console-field__hint">Voucher khusus — tidak ada minimal.</p>
              ) : state.fieldErrors?.minOrderAmount ? (
                <p className="console-field__error">{state.fieldErrors.minOrderAmount}</p>
              ) : (
                <p className="console-field__hint">
                  Dicek terhadap subtotal setelah flash sale.
                </p>
              )}
            </div>

            {isPercent ? (
              <div className="console-field">
                <label htmlFor="voucher-stock-percent" className="console-field__label">
                  Stok kuota global
                </label>
                <input
                  id="voucher-stock-percent"
                  name="stock"
                  type="number"
                  min={1}
                  className="console-input w-full"
                  defaultValue={initialValues?.stock ?? 100}
                  required
                />
                {stockUsedHint ? (
                  <p className="console-field__hint">{stockUsedHint}</p>
                ) : null}
                {state.fieldErrors?.stock ? (
                  <p className="console-field__error">{state.fieldErrors.stock}</p>
                ) : null}
              </div>
            ) : (
              <div className="console-field">
                <label htmlFor="voucher-per-user" className="console-field__label">
                  Batas per pengguna
                </label>
                <input
                  id="voucher-per-user"
                  name="perUserLimit"
                  type="number"
                  min={0}
                  className="console-input w-full"
                  defaultValue={isSpecial ? 1 : (initialValues?.perUserLimit ?? 0)}
                  disabled={isSpecial}
                />
                {isSpecial ? (
                  <p className="console-field__hint">Otomatis 1× per pengguna.</p>
                ) : (
                  <p className="console-field__hint">0 = tidak dibatasi.</p>
                )}
              </div>
            )}

            {isPercent ? (
              <div className="console-field console-field--full">
                <div className="console-setting-row console-setting-row--compact">
                  <div className="console-setting-row__body">
                    <p className="console-setting-row__title">Batas per pengguna</p>
                    <p className="console-setting-row__hint">
                      {isSpecial
                        ? "Voucher khusus otomatis 1× per pengguna (member atau guest)."
                        : "0 = tidak dibatasi. Dicek per email + akun tujuan top-up."}
                    </p>
                  </div>
                  <input
                    id="voucher-per-user-percent"
                    name="perUserLimit"
                    type="number"
                    min={0}
                    className="console-input voucher-promo-form__limit-input"
                    defaultValue={isSpecial ? 1 : (initialValues?.perUserLimit ?? 0)}
                    disabled={isSpecial}
                    aria-label="Batas per pengguna"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="console-form__section">
          <h3 className="console-form__section-title">Periode &amp; status</h3>
          <div className="console-form__grid">
            <div className="console-field">
              <label htmlFor="voucher-starts" className="console-field__label">
                Mulai (opsional)
              </label>
              <div className="console-input-wrap console-input-wrap--picker">
                <input
                  id="voucher-starts"
                  name="startsAt"
                  type="datetime-local"
                  className="console-input w-full"
                  defaultValue={defaultStarts}
                />
              </div>
              {state.fieldErrors?.startsAt ? (
                <p className="console-field__error">{state.fieldErrors.startsAt}</p>
              ) : null}
            </div>
            <div className="console-field">
              <label htmlFor="voucher-ends" className="console-field__label">
                Selesai (opsional)
              </label>
              <div className="console-input-wrap console-input-wrap--picker">
                <input
                  id="voucher-ends"
                  name="endsAt"
                  type="datetime-local"
                  className="console-input w-full"
                  defaultValue={defaultEnds}
                />
              </div>
              {state.fieldErrors?.endsAt ? (
                <p className="console-field__error">{state.fieldErrors.endsAt}</p>
              ) : null}
            </div>
            <div className="console-field console-field--full">
              <div className="console-setting-row console-setting-row--compact">
                <div className="console-setting-row__body">
                  <p className="console-setting-row__title">Voucher aktif</p>
                  <p className="console-setting-row__hint">
                    Nonaktifkan untuk menstop pemakaian tanpa menghapus kode.
                  </p>
                </div>
                <label className="console-toggle console-toggle--setting" title="Aktifkan voucher">
                  <input
                    type="checkbox"
                    className="console-toggle__input"
                    name="isEnabled"
                    defaultChecked={initialValues?.isEnabled ?? true}
                  />
                  <span className="console-toggle__track" aria-hidden />
                </label>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="console-form__actions console-form__actions--split">
        <Link href="/console/promo/voucher-promo" className="console-btn-secondary">
          Batal
        </Link>
        <button
          type="submit"
          className="console-btn-primary console-form__submit"
          disabled={pending}
        >
          {pending ? "Menyimpan…" : mode === "edit" ? "Simpan perubahan" : "Buat voucher"}
        </button>
      </div>
    </form>
  );
}
