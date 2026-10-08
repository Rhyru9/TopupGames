"use client";

import { useActionState } from "react";
import {
  saveWebsiteStyle,
  type SiteSettingsFormState,
} from "@/app/console/(panel)/settings/website/actions";
import type {
  GridColumnCount,
  GridGapDensity,
  SiteStyleSettings,
} from "@/lib/site-settings/site-settings-schemas";

type WebsiteStyleFormProps = {
  initialValues: SiteStyleSettings;
};

const initialState: SiteSettingsFormState = {};

const COLUMN_OPTIONS: GridColumnCount[] = [2, 3, 4, 5, 6];

const GAP_OPTIONS: { value: GridGapDensity; label: string }[] = [
  { value: "tight", label: "Rapat" },
  { value: "normal", label: "Sedang" },
  { value: "relaxed", label: "Longgar" },
];

function ColumnSelect({
  id,
  name,
  label,
  defaultValue,
  error,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: GridColumnCount;
  error?: string;
}) {
  return (
    <div className="console-field">
      <label htmlFor={id} className="console-field__label">
        {label}
      </label>
      <select id={id} name={name} defaultValue={defaultValue} className="console-input w-full">
        {COLUMN_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n} kolom
          </option>
        ))}
      </select>
      {error ? <p className="console-field__error">{error}</p> : null}
    </div>
  );
}

function GapSelect({
  id,
  name,
  defaultValue,
}: {
  id: string;
  name: string;
  defaultValue: GridGapDensity;
}) {
  return (
    <div className="console-field">
      <label htmlFor={id} className="console-field__label">
        Jarak antar kartu
      </label>
      <select id={id} name={name} defaultValue={defaultValue} className="console-input w-full">
        {GAP_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <p className="console-field__hint">Atur kerapatan spasi antar kolom/baris.</p>
    </div>
  );
}

export function WebsiteStyleForm({ initialValues }: WebsiteStyleFormProps) {
  const [state, formAction, pending] = useActionState(saveWebsiteStyle, initialState);
  const pageSize =
    initialValues.catalog.columns.desktop * initialValues.catalog.pageRows;

  return (
    <form action={formAction} className="console-form console-provider-form-stack">
      {state.error ? (
        <div className="console-alert console-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Top Populer</p>
        </div>
        <div className="console-provider-card__body">
          <p className="console-field__hint" style={{ marginBottom: "0.85rem" }}>
            Jumlah kolom kartu di section Paling Ramai / TOP POPULER.
          </p>
          <div className="console-form__grid">
            <ColumnSelect
              id="popularMobile"
              name="popularMobile"
              label="Mobile"
              defaultValue={initialValues.popular.columns.mobile}
            />
            <ColumnSelect
              id="popularTablet"
              name="popularTablet"
              label="Tablet"
              defaultValue={initialValues.popular.columns.tablet}
            />
            <ColumnSelect
              id="popularDesktop"
              name="popularDesktop"
              label="Desktop"
              defaultValue={initialValues.popular.columns.desktop}
            />
            <GapSelect
              id="popularGap"
              name="popularGap"
              defaultValue={initialValues.popular.gap}
            />
          </div>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Katalog (Pilih Produk)</p>
        </div>
        <div className="console-provider-card__body">
          <p className="console-field__hint" style={{ marginBottom: "0.85rem" }}>
            Kolom grid katalog. Tombol “Tampilkan lebih banyak” memuat{" "}
            <strong>kolom desktop × baris</strong> produk berikutnya (sekarang ~{pageSize}).
          </p>
          <div className="console-form__grid">
            <ColumnSelect
              id="catalogMobile"
              name="catalogMobile"
              label="Mobile"
              defaultValue={initialValues.catalog.columns.mobile}
            />
            <ColumnSelect
              id="catalogTablet"
              name="catalogTablet"
              label="Tablet"
              defaultValue={initialValues.catalog.columns.tablet}
            />
            <ColumnSelect
              id="catalogDesktop"
              name="catalogDesktop"
              label="Desktop"
              defaultValue={initialValues.catalog.columns.desktop}
            />
            <div className="console-field">
              <label htmlFor="catalogPageRows" className="console-field__label">
                Baris per tampilan
              </label>
              <input
                id="catalogPageRows"
                name="catalogPageRows"
                type="number"
                min={1}
                max={6}
                defaultValue={initialValues.catalog.pageRows}
                className="console-input w-full"
              />
              {state.fieldErrors?.catalogPageRows ? (
                <p className="console-field__error">{state.fieldErrors.catalogPageRows}</p>
              ) : (
                <p className="console-field__hint">1–6 baris. Contoh: 6 kolom × 3 baris = 18 produk.</p>
              )}
            </div>
            <GapSelect
              id="catalogGap"
              name="catalogGap"
              defaultValue={initialValues.catalog.gap}
            />
          </div>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Flash Sale</p>
        </div>
        <div className="console-provider-card__body">
          <p className="console-field__hint" style={{ marginBottom: "0.85rem" }}>
            Berapa kartu terlihat di rail (boleh desimal untuk peek). Contoh: mobile 1.8, tablet 3.5,
            desktop 5.1.
          </p>
          <div className="console-form__grid">
            <div className="console-field">
              <label htmlFor="flashMobile" className="console-field__label">
                Mobile
              </label>
              <input
                id="flashMobile"
                name="flashMobile"
                type="number"
                min={1}
                max={8}
                step={0.1}
                defaultValue={initialValues.flashSale.slidesPerView.mobile}
                className="console-input w-full"
              />
              {state.fieldErrors?.flashMobile ? (
                <p className="console-field__error">{state.fieldErrors.flashMobile}</p>
              ) : null}
            </div>
            <div className="console-field">
              <label htmlFor="flashTablet" className="console-field__label">
                Tablet
              </label>
              <input
                id="flashTablet"
                name="flashTablet"
                type="number"
                min={1}
                max={8}
                step={0.1}
                defaultValue={initialValues.flashSale.slidesPerView.tablet}
                className="console-input w-full"
              />
              {state.fieldErrors?.flashTablet ? (
                <p className="console-field__error">{state.fieldErrors.flashTablet}</p>
              ) : null}
            </div>
            <div className="console-field">
              <label htmlFor="flashDesktop" className="console-field__label">
                Desktop
              </label>
              <input
                id="flashDesktop"
                name="flashDesktop"
                type="number"
                min={1}
                max={8}
                step={0.1}
                defaultValue={initialValues.flashSale.slidesPerView.desktop}
                className="console-input w-full"
              />
              {state.fieldErrors?.flashDesktop ? (
                <p className="console-field__error">{state.fieldErrors.flashDesktop}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="console-form__actions">
        <button type="submit" disabled={pending} className="console-btn-primary console-form__submit">
          {pending ? "Menyimpan..." : "Simpan Style"}
        </button>
      </div>
    </form>
  );
}
