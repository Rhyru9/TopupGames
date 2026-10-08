export type ContentPageFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type ContentPageFormInput = {
  slug: string;
  title: string;
  content: string;
  sortOrder: number;
  isActive: boolean;
  showInFooter: boolean;
};

export type ContentPageListItem = {
  id: string;
  slug: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  showInFooter: boolean;
  updatedAt: Date;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyContentPageTitle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseContentPageForm(formData: FormData): ContentPageFormInput {
  const sortRaw = Number.parseInt(String(formData.get("sortOrder") ?? "0"), 10);

  return {
    slug: String(formData.get("slug") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
    sortOrder: Number.isFinite(sortRaw) ? sortRaw : 0,
    isActive: formData.get("isActive") === "on",
    showInFooter: formData.get("showInFooter") === "on",
  };
}

export function validateContentPageInput(
  input: ContentPageFormInput,
  _options?: { excludeId?: string },
): ContentPageFormState | null {
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

  if (!input.content) {
    fieldErrors.content = "Konten wajib diisi.";
  }

  if (input.sortOrder < 0) {
    fieldErrors.sortOrder = "Urutan tidak boleh negatif.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return null;
}
