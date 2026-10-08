"use client";

import { useActionState } from "react";
import { saveContentPage, type ContentPageFormState } from "@/app/console/(panel)/halaman/actions";
import { ConsoleRichTextEditor } from "@/components/console/console-rich-text-editor";
import { slugifyContentPageTitle } from "@/lib/content/content-page-form";

export type ContentPageFormValues = {
  slug: string;
  title: string;
  content: string;
  sortOrder: number;
  isActive: boolean;
  showInFooter: boolean;
};

type ContentPageFormProps = {
  mode: "create" | "edit";
  pageId?: string;
  initialValues?: Partial<ContentPageFormValues>;
};

const initialState: ContentPageFormState = {};

export function ContentPageForm({ mode, pageId, initialValues }: ContentPageFormProps) {
  const [state, formAction, pending] = useActionState(saveContentPage, initialState);

  const values: ContentPageFormValues = {
    slug: "",
    title: "",
    content: "",
    sortOrder: 0,
    isActive: true,
    showInFooter: true,
    ...initialValues,
  };

  return (
    <form action={formAction} className="console-form">
      {mode === "edit" && pageId ? <input type="hidden" name="pageId" value={pageId} /> : null}

      {state.error ? (
        <div className="console-alert console-alert--error" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="console-form__grid">
        <div className="console-field console-field--full">
          <label htmlFor="title" className="console-field__label">
            Judul *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={values.title}
            required
            maxLength={200}
            className="console-input w-full"
            placeholder="Kebijakan Privasi"
            onChange={(event) => {
              if (mode !== "create") return;
              const slugInput = document.getElementById("slug") as HTMLInputElement | null;
              if (!slugInput || slugInput.dataset.touched === "1") return;
              slugInput.value = slugifyContentPageTitle(event.currentTarget.value);
            }}
          />
          {state.fieldErrors?.title ? (
            <p className="console-field__error">{state.fieldErrors.title}</p>
          ) : null}
        </div>

        <div className="console-field console-field--full">
          <label htmlFor="slug" className="console-field__label">
            Slug URL *
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            defaultValue={values.slug}
            required
            maxLength={120}
            className="console-input w-full"
            placeholder="kebijakan-privasi"
            onInput={(event) => {
              event.currentTarget.dataset.touched = "1";
            }}
          />
          <p className="console-field__hint">
            URL publik: <code>/halaman/[slug]</code>
          </p>
          {state.fieldErrors?.slug ? (
            <p className="console-field__error">{state.fieldErrors.slug}</p>
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
          <div className="console-radio-group">
            <label className="console-field__label console-field__label--inline">
              <input
                type="checkbox"
                name="isActive"
                value="on"
                defaultChecked={values.isActive}
                className="console-checkbox"
              />
              Aktif
            </label>
            <label className="console-field__label console-field__label--inline">
              <input
                type="checkbox"
                name="showInFooter"
                value="on"
                defaultChecked={values.showInFooter}
                className="console-checkbox"
              />
              Tampilkan di footer
            </label>
          </div>
        </div>

        <div className="console-field console-field--full">
          <ConsoleRichTextEditor
            name="content"
            label="Konten *"
            initialValue={values.content}
            placeholder="Tulis isi halaman…"
            minHeight="16rem"
            error={state.fieldErrors?.content}
          />
        </div>
      </div>

      <div className="console-form__actions">
        <button type="submit" disabled={pending} className="console-btn-primary">
          {pending ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Buat Halaman"}
        </button>
      </div>
    </form>
  );
}
