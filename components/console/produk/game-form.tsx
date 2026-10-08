"use client";

import { useActionState, useRef, useState } from "react";
import { saveGame, type GameFormState } from "@/app/console/(panel)/produk/actions";
import {
  ConsoleFormUploadProvider,
  useConsoleFormUploadSubmit,
} from "@/components/console/console-form-upload";
import { ConsoleImageUpload } from "@/components/console/console-image-upload";
import { ConsoleRichTextEditor } from "@/components/console/console-rich-text-editor";
import { GameInputFieldsEditor } from "@/components/console/produk/game-input-fields-editor";
import { gameStatusOptions } from "@/lib/game-labels";
import {
  gameInputFieldPresets,
  type GameInputFieldsConfig,
} from "@/lib/catalog-products/game-input-fields";
import type { CatalogCategoryOption } from "@/lib/catalog-categories/active-catalog-categories";
import { slugify } from "@/lib/slug";

export type GameFormValues = {
  name: string;
  subtitle: string;
  slug: string;
  categoryId: string;
  isPopular: boolean;
  soldCount: number;
  requiresLogin: boolean;
  status: "ACTIVE" | "HIDDEN";
  thumbnailUrl: string;
  bannerUrl: string;
  inputFields: GameInputFieldsConfig;
  nicknameCheckCode: string;
  guideHtml: string;
  fieldHintHtml: string;
  sortOrder: number;
};

type GameFormProps = {
  mode: "create" | "edit";
  productId?: string;
  catalogCategories: CatalogCategoryOption[];
  initialValues?: Partial<GameFormValues>;
};

const initialState: GameFormState = {};

export function GameForm(props: GameFormProps) {
  return (
    <ConsoleFormUploadProvider>
      <GameFormContent {...props} />
    </ConsoleFormUploadProvider>
  );
}

function GameFormContent({ mode, productId, catalogCategories, initialValues }: GameFormProps) {
  const [state, formAction, pending] = useActionState(saveGame, initialState);
  const { onSubmit, isUploading, uploadError } = useConsoleFormUploadSubmit(formAction);
  const isSaving = pending || isUploading;

  const defaultTypeId = catalogCategories[0]?.id ?? "";
  const resolvedCategoryId = initialValues?.categoryId ?? defaultTypeId;
  const defaultRequiresLogin =
    catalogCategories.find((category) => category.id === resolvedCategoryId)?.defaultRequiresLogin ??
    false;

  const values: GameFormValues = {
    name: "",
    subtitle: "",
    slug: "",
    categoryId: resolvedCategoryId,
    isPopular: false,
    soldCount: 0,
    requiresLogin: mode === "create" ? defaultRequiresLogin : false,
    status: "ACTIVE",
    thumbnailUrl: "",
    bannerUrl: "",
    inputFields: gameInputFieldPresets.userIdOnly,
    nicknameCheckCode: "",
    guideHtml: "",
    fieldHintHtml: "",
    sortOrder: 0,
    ...initialValues,
  };

  const [slug, setSlug] = useState(values.slug);
  const slugTouchedRef = useRef(mode === "edit" || Boolean(values.slug));
  const [requiresLogin, setRequiresLogin] = useState(values.requiresLogin);
  const requiresLoginTouchedRef = useRef(mode === "edit");

  return (
    <form action={formAction} onSubmit={onSubmit} className="console-form">
      {mode === "edit" && productId ? <input type="hidden" name="productId" value={productId} /> : null}

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

      <div className="console-form__grid">
        <div className="console-field">
          <label htmlFor="name" className="console-field__label">
            Nama Produk
          </label>
          <input
            id="name"
            name="name"
            defaultValue={values.name}
            required
            className="console-input w-full"
            placeholder="Mobile Legends"
            onChange={(event) => {
              if (mode === "create" && !slugTouchedRef.current) {
                setSlug(slugify(event.target.value));
              }
            }}
          />
          {state.fieldErrors?.name ? (
            <p className="console-field__error">{state.fieldErrors.name}</p>
          ) : null}
        </div>

        <div className="console-field">
          <label htmlFor="subtitle" className="console-field__label">
            Sub Nama / Publisher singkat
          </label>
          <input
            id="subtitle"
            name="subtitle"
            defaultValue={values.subtitle}
            className="console-input w-full"
            placeholder="Moonton"
          />
        </div>

        <div className="console-field">
          <label htmlFor="slug" className="console-field__label">
            Slug URL
          </label>
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(event) => {
              slugTouchedRef.current = true;
              setSlug(event.target.value);
            }}
            required
            className="console-input w-full"
            placeholder="mobile-legends"
          />
          <p className="console-field__hint">
            {mode === "create"
              ? "Terisi otomatis dari nama produk — bisa diedit kapan saja."
              : "Ubah hanya jika perlu; URL storefront mengikuti slug ini."}
          </p>
          {state.fieldErrors?.slug ? (
            <p className="console-field__error">{state.fieldErrors.slug}</p>
          ) : null}
        </div>

        <div className="console-field">
          <label htmlFor="categoryId" className="console-field__label">
            Kategori
          </label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={values.categoryId}
            required
            className="console-input w-full"
            onChange={(event) => {
              if (mode !== "create" || requiresLoginTouchedRef.current) return;
              const next = catalogCategories.find((category) => category.id === event.target.value);
              setRequiresLogin(Boolean(next?.defaultRequiresLogin));
            }}
          >
            {catalogCategories.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          {state.fieldErrors?.categoryId ? (
            <p className="console-field__error">{state.fieldErrors.categoryId}</p>
          ) : null}
        </div>

        <div className="console-field">
          <label htmlFor="status" className="console-field__label">
            Status
          </label>
          <select id="status" name="status" defaultValue={values.status} className="console-input w-full">
            {gameStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="console-field">
          <label htmlFor="soldCount" className="console-field__label">
            Jumlah terjual (badge)
          </label>
          <input
            id="soldCount"
            name="soldCount"
            type="number"
            min={0}
            step={1}
            defaultValue={values.soldCount}
            className="console-input w-full"
          />

        </div>

        <div className="console-field console-field--full">
          <label className="console-field__label console-field__label--inline">
            <input
              type="checkbox"
              name="isPopular"
              defaultChecked={values.isPopular}
              className="console-checkbox"
            />
            Tampilkan di section Populer (homepage)
          </label>
          <p className="console-field__hint">
            Di proyek lama, ini setara memilih tipe &quot;Populer&quot;. Sekarang cukup centang tanpa mengubah tipe kategori.
          </p>
        </div>

        <div className="console-field console-field--full">
          <label className="console-field__label console-field__label--inline">
            <input
              type="checkbox"
              name="requiresLogin"
              checked={requiresLogin}
              onChange={(event) => {
                requiresLoginTouchedRef.current = true;
                setRequiresLogin(event.target.checked);
              }}
              className="console-checkbox"
            />
            Wajib login untuk order
          </label>
          <p className="console-field__hint">
            Guest tidak bisa checkout. Cocok untuk voucher / kode yang masuk riwayat member. Di form tambah, ikut
            default kategori sampai diubah manual.
          </p>
        </div>

        <ConsoleImageUpload
          name="thumbnailUrl"
          kind="game-thumbnail"
          label="Thumbnail *"
          initialValue={values.thumbnailUrl}
          required
          error={state.fieldErrors?.thumbnailUrl}
        />

        <ConsoleImageUpload
          name="bannerUrl"
          kind="game-banner"
          label="Banner"
          initialValue={values.bannerUrl}
          error={state.fieldErrors?.bannerUrl}
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
        </div>

        <div className="console-field">
          <label htmlFor="nicknameCheckCode" className="console-field__label">
            Kode Cek Nickname (Melostore)
          </label>
          <input
            id="nicknameCheckCode"
            name="nicknameCheckCode"
            defaultValue={values.nicknameCheckCode}
            className="console-input w-full"
            placeholder="MLBB"
          />
          <p className="console-field__hint">
            Isi <code>game_code</code> Melostore agar nickname dicek otomatis di halaman order (contoh: MLBB).
            Kosongkan jika produk tidak support cek nick. Juga dipakai hint operator IAK saat sync SKU.
          </p>
        </div>

        <GameInputFieldsEditor
          initialConfig={values.inputFields}
          fieldErrors={state.fieldErrors}
        />

        <ConsoleRichTextEditor
          name="guideHtml"
          label="Panduan Top-up"
          initialValue={values.guideHtml}
          placeholder="Tulis langkah-langkah top-up untuk pembeli…"
          minHeight="10rem"
        />

        <ConsoleRichTextEditor
          name="fieldHintHtml"
          label="Petunjuk Field ID"
          initialValue={values.fieldHintHtml}
          placeholder="Contoh: masukkan ID dan Server dengan benar…"
          minHeight="7rem"
        />
      </div>

      <div className="console-form__actions">
        <button type="submit" disabled={isSaving} className="console-btn-primary console-form__submit">
          {isSaving ? "Menyimpan..." : mode === "create" ? "Tambah Produk" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}
