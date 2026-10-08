"use client";

import { useActionState } from "react";
import { saveTickerItem, type TickerFormState } from "@/app/console/(panel)/ticker/actions";

export type TickerFormValues = {
  label: string;
  detail: string;
  href: string;
  sortOrder: number;
  isActive: boolean;
};

type TickerFormProps = {
  mode: "create" | "edit";
  tickerId?: string;
  initialValues?: Partial<TickerFormValues>;
};

const initialState: TickerFormState = {};

export function TickerForm({ mode, tickerId, initialValues }: TickerFormProps) {
  const [state, formAction, pending] = useActionState(saveTickerItem, initialState);

  const values: TickerFormValues = {
    label: "",
    detail: "",
    href: "",
    sortOrder: 0,
    isActive: true,
    ...initialValues,
  };

  return (
    <form action={formAction} className="console-form">
      {mode === "edit" && tickerId ? (
        <input type="hidden" name="tickerId" value={tickerId} />
      ) : null}

      {state.error ? (
        <div className="console-alert console-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="console-form__grid">
        <div className="console-field">
          <label htmlFor="label" className="console-field__label">
            Label kiri *
          </label>
          <input
            id="label"
            name="label"
            type="text"
            defaultValue={values.label}
            required
            maxLength={120}
            className="console-input w-full"
            placeholder="Mobile Legends"
          />
          <p className="console-field__hint">Teks neon di ticker (biasanya nama game).</p>
          {state.fieldErrors?.label ? (
            <p className="console-field__error">{state.fieldErrors.label}</p>
          ) : null}
        </div>

        <div className="console-field">
          <label htmlFor="detail" className="console-field__label">
            Detail kanan *
          </label>
          <input
            id="detail"
            name="detail"
            type="text"
            defaultValue={values.detail}
            required
            maxLength={160}
            className="console-input w-full"
            placeholder="Flash Diamond −10%"
          />
          <p className="console-field__hint">Promo singkat, 2–5 kata ideal.</p>
          {state.fieldErrors?.detail ? (
            <p className="console-field__error">{state.fieldErrors.detail}</p>
          ) : null}
        </div>

        <div className="console-field">
          <label htmlFor="href" className="console-field__label">
            Link tujuan
          </label>
          <input
            id="href"
            name="href"
            type="text"
            defaultValue={values.href}
            className="console-input w-full"
            placeholder="#flash, /produk/slug, atau https://..."
          />
          <p className="console-field__hint">Kosongkan jika item tidak bisa diklik.</p>
          {state.fieldErrors?.href ? (
            <p className="console-field__error">{state.fieldErrors.href}</p>
          ) : null}
        </div>

        <div className="console-field">
          <label htmlFor="sortOrder" className="console-field__label">
            Urutan
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={values.sortOrder}
            className="console-input w-full"
          />
          {state.fieldErrors?.sortOrder ? (
            <p className="console-field__error">{state.fieldErrors.sortOrder}</p>
          ) : null}
        </div>

        <div className="console-field console-field--full">
          <label className="console-field__label console-field__label--inline">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={values.isActive}
              className="console-checkbox"
            />
            Aktif — tampil di ticker beranda
          </label>
        </div>
      </div>

      <div className="console-form__actions">
        <button type="submit" disabled={pending} className="console-btn-primary console-form__submit">
          {pending ? "Menyimpan..." : mode === "create" ? "Buat Item" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
