"use client";

import { useActionState } from "react";
import { saveGameType, type GameTypeFormState } from "@/app/console/(panel)/categories/actions";
import { IconifyPicker } from "@/components/console/categories/iconify-picker";

export type GameTypeFormValues = {
  name: string;
  slug: string;
  iconUrl: string;
  sortOrder: number;
  isActive: boolean;
  defaultRequiresLogin: boolean;
};

type GameTypeFormProps = {
  mode: "create" | "edit";
  categoryId?: string;
  initialValues?: Partial<GameTypeFormValues>;
};

const initialState: GameTypeFormState = {};

export function GameTypeForm({ mode, categoryId, initialValues }: GameTypeFormProps) {
  const [state, formAction, pending] = useActionState(saveGameType, initialState);

  const values: GameTypeFormValues = {
    name: "",
    slug: "",
    iconUrl: "",
    sortOrder: 0,
    isActive: true,
    defaultRequiresLogin: false,
    ...initialValues,
  };

  return (
    <form action={formAction} className="console-form">
      {mode === "edit" && categoryId ? (
        <input type="hidden" name="categoryId" value={categoryId} />
      ) : null}

      {state.error ? (
        <div className="console-alert console-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="console-form__grid">
        <div className="console-field">
          <label htmlFor="name" className="console-field__label">
            Nama Kategori *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={values.name}
            required
            className="console-input w-full"
            placeholder="Contoh: Topup Game, Voucher"
          />
          {state.fieldErrors?.name ? (
            <p className="console-field__error">{state.fieldErrors.name}</p>
          ) : null}
        </div>

        <div className="console-field">
          <label htmlFor="slug" className="console-field__label">
            Slug *
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            defaultValue={values.slug}
            required
            className="console-input w-full"
            placeholder="game, voucher, pulsa"
          />
          <p className="console-field__hint">Dipakai untuk filter/grouping di storefront.</p>
          {state.fieldErrors?.slug ? (
            <p className="console-field__error">{state.fieldErrors.slug}</p>
          ) : null}
        </div>

        <IconifyPicker
          name="iconUrl"
          label="Icon Kategori"
          initialValue={values.iconUrl}
          error={state.fieldErrors?.iconUrl}
        />

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
              name="defaultRequiresLogin"
              defaultChecked={values.defaultRequiresLogin}
              className="console-checkbox"
            />
            Default wajib login
          </label>
          <p className="console-field__hint">
            Produk baru di kategori ini otomatis dicentang &quot;Wajib login&quot; (bisa diubah per produk). Cocok untuk
            voucher / SN yang masuk riwayat member.
          </p>
        </div>

        <div className="console-field console-field--full">
          <label className="console-field__label console-field__label--inline">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={values.isActive}
              className="console-checkbox"
            />
            Aktif — tampil saat menambah game baru
          </label>
        </div>
      </div>

      <div className="console-form__actions">
        <button type="submit" disabled={pending} className="console-btn-primary console-form__submit">
          {pending ? "Menyimpan..." : mode === "create" ? "Buat Kategori" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
