export type ArticleFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type ArticleFormInput = {
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
  publishedAt: Date;
  isActive: boolean;
};

export type ArticleListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string;
  publishedAt: Date;
  isActive: boolean;
  updatedAt: Date;
};

export type PublicArticleCard = {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string;
  coverImageAlt: string;
  publishedAt: Date;
  authorName: string | null;
};

export type PublicArticleDetail = PublicArticleCard & {
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImageUrl: string | null;
  updatedAt: Date;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyArticleTitle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parsePublishedAt(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function parseArticleForm(formData: FormData): ArticleFormInput {
  const publishedRaw = String(formData.get("publishedAt") ?? "").trim();
  const parsedPublished = parsePublishedAt(publishedRaw);

  return {
    slug: String(formData.get("slug") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
    coverImageUrl: String(formData.get("coverImageUrl") ?? "").trim(),
    coverImageAlt: String(formData.get("coverImageAlt") ?? "").trim(),
    metaTitle: String(formData.get("metaTitle") ?? "").trim(),
    metaDescription: String(formData.get("metaDescription") ?? "").trim(),
    metaKeywords: String(formData.get("metaKeywords") ?? "").trim(),
    ogImageUrl: String(formData.get("ogImageUrl") ?? "").trim(),
    authorName: String(formData.get("authorName") ?? "").trim(),
    publishedAt: parsedPublished ?? new Date(),
    isActive: formData.get("isActive") === "on",
  };
}

export function validateArticleInput(
  input: ArticleFormInput,
  _options?: { excludeId?: string },
): ArticleFormState | null {
  const fieldErrors: Record<string, string> = {};

  if (!input.title) {
    fieldErrors.title = "Judul wajib diisi.";
  } else if (input.title.length > 200) {
    fieldErrors.title = "Judul maksimal 200 karakter.";
  }

  if (!input.slug) {
    fieldErrors.slug = "Slug wajib diisi.";
  } else if (input.slug.length > 120) {
    fieldErrors.slug = "Slug maksimal 120 karakter.";
  } else if (!SLUG_PATTERN.test(input.slug)) {
    fieldErrors.slug = "Slug hanya huruf kecil, angka, dan tanda hubung.";
  }

  if (!input.excerpt) {
    fieldErrors.excerpt = "Ringkasan wajib diisi.";
  } else if (input.excerpt.length > 500) {
    fieldErrors.excerpt = "Ringkasan maksimal 500 karakter.";
  }

  if (!input.content) {
    fieldErrors.content = "Konten wajib diisi.";
  }

  if (!input.coverImageUrl) {
    fieldErrors.coverImageUrl = "Gambar cover wajib diupload.";
  }

  if (!input.coverImageAlt) {
    fieldErrors.coverImageAlt = "Alt text cover wajib diisi.";
  } else if (input.coverImageAlt.length > 200) {
    fieldErrors.coverImageAlt = "Alt text maksimal 200 karakter.";
  }

  if (input.metaTitle && input.metaTitle.length > 200) {
    fieldErrors.metaTitle = "Meta title maksimal 200 karakter.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return null;
}

export function toArticlePersistData(input: ArticleFormInput) {
  return {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    coverImageUrl: input.coverImageUrl,
    coverImageAlt: input.coverImageAlt,
    metaTitle: input.metaTitle || null,
    metaDescription: input.metaDescription || null,
    metaKeywords: input.metaKeywords || null,
    ogImageUrl: input.ogImageUrl || null,
    authorName: input.authorName || null,
    publishedAt: input.publishedAt,
    isActive: input.isActive,
  };
}

export function formatPublishedAtInput(value: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}
