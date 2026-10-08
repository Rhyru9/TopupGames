"use client";

import { useActionState } from "react";
import { saveArticle, type ArticleFormState } from "@/app/console/(panel)/artikel/actions";
import {
  ConsoleFormUploadProvider,
  useConsoleFormUploadSubmit,
} from "@/components/console/console-form-upload";
import { ConsoleImageUpload } from "@/components/console/console-image-upload";
import { ConsoleRichTextEditor } from "@/components/console/console-rich-text-editor";
import { formatPublishedAtInput, slugifyArticleTitle } from "@/lib/article/article-form";

export type ArticleFormValues = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  coverImageAlt: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImageUrl: string;
  authorName: string;
  publishedAt: string;
  isActive: boolean;
};

type ArticleFormProps = {
  mode: "create" | "edit";
  articleId?: string;
  initialValues?: Partial<ArticleFormValues>;
};

const initialState: ArticleFormState = {};

export function ArticleForm(props: ArticleFormProps) {
  return (
    <ConsoleFormUploadProvider>
      <ArticleFormContent {...props} />
    </ConsoleFormUploadProvider>
  );
}

function ArticleFormContent({ mode, articleId, initialValues }: ArticleFormProps) {
  const [state, formAction, pending] = useActionState(saveArticle, initialState);
  const { onSubmit, isUploading, uploadError } = useConsoleFormUploadSubmit(formAction);
  const isSaving = pending || isUploading;

  const values: ArticleFormValues = {
    slug: "",
    title: "",
    excerpt: "",
    content: "",
    coverImageUrl: "",
    coverImageAlt: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogImageUrl: "",
    authorName: "",
    publishedAt: formatPublishedAtInput(new Date()),
    isActive: true,
    ...initialValues,
  };

  return (
    <form action={formAction} onSubmit={onSubmit} className="console-form">
      {mode === "edit" && articleId ? (
        <input type="hidden" name="articleId" value={articleId} />
      ) : null}

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

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Konten Artikel</p>
        </div>
        <div className="console-provider-card__body">
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
                placeholder="Cara Top Up Mobile Legends dengan Aman"
                onChange={(event) => {
                  if (mode !== "create") return;
                  const slugInput = document.getElementById("slug") as HTMLInputElement | null;
                  if (!slugInput || slugInput.dataset.touched === "1") return;
                  slugInput.value = slugifyArticleTitle(event.currentTarget.value);
                  const altInput = document.getElementById("coverImageAlt") as HTMLInputElement | null;
                  if (altInput && !altInput.dataset.touched) {
                    altInput.value = event.currentTarget.value;
                  }
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
                placeholder="cara-top-up-mobile-legends-dengan-aman"
                onInput={(event) => {
                  event.currentTarget.dataset.touched = "1";
                }}
              />
              <p className="console-field__hint">
                URL publik: <code>/artikel/[slug]</code>
              </p>
              {state.fieldErrors?.slug ? (
                <p className="console-field__error">{state.fieldErrors.slug}</p>
              ) : null}
            </div>

            <div className="console-field console-field--full">
              <label htmlFor="excerpt" className="console-field__label">
                Ringkasan *
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                rows={3}
                defaultValue={values.excerpt}
                required
                maxLength={500}
                className="console-input console-textarea w-full"
                placeholder="Ringkasan singkat untuk kartu listing dan fallback meta description."
              />
              {state.fieldErrors?.excerpt ? (
                <p className="console-field__error">{state.fieldErrors.excerpt}</p>
              ) : null}
            </div>

            <div className="console-field console-field--full">
              <ConsoleRichTextEditor
                name="content"
                label="Konten *"
                initialValue={values.content}
                placeholder="Tulis isi artikel…"
                minHeight="18rem"
                error={state.fieldErrors?.content}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Gambar Cover</p>
        </div>
        <div className="console-provider-card__body">
          <div className="console-form__grid">
            <div className="console-field console-field--full">
              <ConsoleImageUpload
                name="coverImageUrl"
                kind="article-cover"
                label="Cover artikel *"
                initialValue={values.coverImageUrl}
                required
                hint="Rekomendasi 1200×630 px — dipakai di listing, detail, dan OG image default."
                error={state.fieldErrors?.coverImageUrl}
              />
            </div>

            <div className="console-field console-field--full">
              <label htmlFor="coverImageAlt" className="console-field__label">
                Alt text cover *
              </label>
              <input
                id="coverImageAlt"
                name="coverImageAlt"
                type="text"
                defaultValue={values.coverImageAlt}
                required
                maxLength={200}
                className="console-input w-full"
                placeholder="Ilustrasi top up Mobile Legends"
                onInput={(event) => {
                  event.currentTarget.dataset.touched = "1";
                }}
              />
              {state.fieldErrors?.coverImageAlt ? (
                <p className="console-field__error">{state.fieldErrors.coverImageAlt}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">SEO & Meta</p>
        </div>
        <div className="console-provider-card__body">
          <div className="console-form__grid">
            <div className="console-field console-field--full">
              <label htmlFor="metaTitle" className="console-field__label">
                Meta Title
              </label>
              <input
                id="metaTitle"
                name="metaTitle"
                type="text"
                defaultValue={values.metaTitle}
                maxLength={200}
                className="console-input w-full"
                placeholder="Kosongkan untuk pakai judul artikel"
              />
              {state.fieldErrors?.metaTitle ? (
                <p className="console-field__error">{state.fieldErrors.metaTitle}</p>
              ) : null}
            </div>

            <div className="console-field console-field--full">
              <label htmlFor="metaDescription" className="console-field__label">
                Meta Description
              </label>
              <textarea
                id="metaDescription"
                name="metaDescription"
                rows={3}
                defaultValue={values.metaDescription}
                className="console-input console-textarea w-full"
                placeholder="Kosongkan untuk pakai ringkasan artikel"
              />
            </div>

            <div className="console-field console-field--full">
              <label htmlFor="metaKeywords" className="console-field__label">
                Meta Keywords
              </label>
              <textarea
                id="metaKeywords"
                name="metaKeywords"
                rows={2}
                defaultValue={values.metaKeywords}
                className="console-input console-textarea w-full"
                placeholder="top up mobile legends, diamond ml, r9host"
              />
            </div>

            <div className="console-field console-field--full">
              <ConsoleImageUpload
                name="ogImageUrl"
                kind="site-og-image"
                label="Gambar OG (opsional)"
                initialValue={values.ogImageUrl}
                hint="Kosongkan untuk pakai cover artikel."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="console-provider-card">
        <div className="console-provider-card__head">
          <p className="console-provider-card__title">Publikasi</p>
        </div>
        <div className="console-provider-card__body">
          <div className="console-form__grid">
            <div className="console-field">
              <label htmlFor="authorName" className="console-field__label">
                Penulis
              </label>
              <input
                id="authorName"
                name="authorName"
                type="text"
                defaultValue={values.authorName}
                maxLength={120}
                className="console-input w-full"
                placeholder="R9host"
              />
            </div>

            <div className="console-field">
              <label htmlFor="publishedAt" className="console-field__label">
                Tanggal publikasi *
              </label>
              <input
                id="publishedAt"
                name="publishedAt"
                type="datetime-local"
                defaultValue={values.publishedAt}
                required
                className="console-input w-full"
              />
            </div>

            <div className="console-field console-field--full">
              <label className="console-field__label console-field__label--inline">
                <input
                  type="checkbox"
                  name="isActive"
                  value="on"
                  defaultChecked={values.isActive}
                  className="console-checkbox"
                />
                Aktif (tampil di publik jika tanggal publikasi sudah lewat)
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="console-form__actions">
        <button type="submit" disabled={isSaving} className="console-btn-primary">
          {isSaving ? "Menyimpan..." : mode === "edit" ? "Simpan Perubahan" : "Buat Artikel"}
        </button>
      </div>
    </form>
  );
}
