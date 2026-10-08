import { cleanupReplacedImage } from "@/lib/storage/delete-stored-image";
import { validateIconifyIconId } from "@/lib/catalog-categories/iconify-icon";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export type CatalogCategoryFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

/** @deprecated Use CatalogCategoryFormState */
export type GameTypeFormState = CatalogCategoryFormState;

export type CatalogCategoryFormInput = {
  name: string;
  slug: string;
  iconUrl: string;
  sortOrder: number;
  isActive: boolean;
  defaultRequiresLogin: boolean;
};

/** @deprecated Use CatalogCategoryFormInput */
export type GameTypeFormInput = CatalogCategoryFormInput;

export function parseCatalogCategoryForm(formData: FormData): CatalogCategoryFormInput {
  const sortRaw = Number.parseInt(String(formData.get("sortOrder") ?? "0"), 10);

  return {
    name: String(formData.get("name") ?? "").trim(),
    slug: slugify(String(formData.get("slug") ?? "")),
    iconUrl: String(formData.get("iconUrl") ?? "").trim(),
    sortOrder: Number.isFinite(sortRaw) ? sortRaw : 0,
    isActive: formData.get("isActive") === "on",
    defaultRequiresLogin: formData.get("defaultRequiresLogin") === "on",
  };
}

/** @deprecated Use parseCatalogCategoryForm */
export const parseGameTypeForm = parseCatalogCategoryForm;

export function validateCatalogCategoryInput(input: CatalogCategoryFormInput): CatalogCategoryFormState | null {
  const fieldErrors: Record<string, string> = {};

  if (!input.name) {
    fieldErrors.name = "Nama kategori wajib diisi.";
  }

  if (!input.slug) {
    fieldErrors.slug = "Slug wajib diisi.";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    fieldErrors.slug = "Slug hanya huruf kecil, angka, dan strip.";
  }

  if (input.sortOrder < 0) {
    fieldErrors.sortOrder = "Urutan tidak boleh negatif.";
  }

  const iconError = validateIconifyIconId(input.iconUrl);
  if (iconError) fieldErrors.iconUrl = iconError;

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return null;
}

/** @deprecated Use validateCatalogCategoryInput */
export const validateGameTypeInput = validateCatalogCategoryInput;

export async function assertUniqueCatalogCategorySlug(
  slug: string,
  excludeId?: string,
): Promise<CatalogCategoryFormState | null> {
  const existing = await prisma.category.findFirst({
    where: {
      slug,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    return { fieldErrors: { slug: "Slug sudah dipakai." } };
  }

  return null;
}

/** @deprecated Use assertUniqueCatalogCategorySlug */
export const assertUniqueGameTypeSlug = assertUniqueCatalogCategorySlug;

function looksLikeStoredImageUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^https?:\/\//i.test(value) || value.startsWith("/");
}

export async function persistCatalogCategory(
  input: CatalogCategoryFormInput,
  categoryId?: string,
): Promise<CatalogCategoryFormState | null> {
  const slugError = await assertUniqueCatalogCategorySlug(input.slug, categoryId);
  if (slugError) return slugError;

  if (categoryId) {
    const existing = await prisma.category.findUnique({ where: { id: categoryId } });
    if (existing && looksLikeStoredImageUrl(existing.iconUrl)) {
      // Hapus file lama jika sebelumnya upload gambar; icon sekarang Iconify id.
      await cleanupReplacedImage(existing.iconUrl, "");
    }

    await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...input,
        iconUrl: input.iconUrl || null,
      },
    });
  } else {
    await prisma.category.create({
      data: {
        ...input,
        iconUrl: input.iconUrl || null,
      },
    });
  }

  return null;
}

/** @deprecated Use persistCatalogCategory */
export const persistGameType = persistCatalogCategory;
