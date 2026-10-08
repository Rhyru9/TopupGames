import { ProductStatus, Prisma } from "@/app/generated/prisma/client";
import {
  defaultGameInputFields,
  hasZoneField,
  parseInputFieldsFromForm,
  validateInputFields,
  type GameInputFieldsConfig,
} from "@/lib/catalog-products/game-input-fields";
import { cleanupReplacedImage } from "@/lib/storage/delete-stored-image";
import { validateImageUrl } from "@/lib/storage/image-url";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export type GameFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

type GameFormInput = {
  name: string;
  subtitle: string;
  slug: string;
  categoryId: string;
  isPopular: boolean;
  soldCount: number;
  requiresLogin: boolean;
  status: ProductStatus;
  thumbnailUrl: string;
  bannerUrl: string;
  inputFields: GameInputFieldsConfig;
  nicknameCheckCode: string;
  guideHtml: string;
  fieldHintHtml: string;
  sortOrder: number;
};

export function parseGameForm(formData: FormData): GameFormInput {
  const status = formData.get("status");
  const inputFields = parseInputFieldsFromForm(formData) ?? defaultGameInputFields(false);
  const soldRaw = Number(formData.get("soldCount") ?? 0);

  return {
    name: String(formData.get("name") ?? "").trim(),
    subtitle: String(formData.get("subtitle") ?? "").trim(),
    slug: slugify(String(formData.get("slug") ?? "")),
    categoryId: String(formData.get("categoryId") ?? "").trim(),
    isPopular: formData.get("isPopular") === "on",
    soldCount: Number.isFinite(soldRaw) ? Math.max(0, Math.floor(soldRaw)) : 0,
    requiresLogin: formData.get("requiresLogin") === "on",
    status: Object.values(ProductStatus).includes(status as ProductStatus)
      ? (status as ProductStatus)
      : ProductStatus.ACTIVE,
    thumbnailUrl: String(formData.get("thumbnailUrl") ?? "").trim(),
    bannerUrl: String(formData.get("bannerUrl") ?? "").trim(),
    inputFields,
    nicknameCheckCode: String(formData.get("nicknameCheckCode") ?? "").trim(),
    guideHtml: String(formData.get("guideHtml") ?? "").trim(),
    fieldHintHtml: String(formData.get("fieldHintHtml") ?? "").trim(),
    sortOrder: Number(formData.get("sortOrder") ?? 0) || 0,
  };
}

export function validateGameInput(input: GameFormInput): GameFormState | null {
  const fieldErrors: Record<string, string> = {};

  if (!input.name) fieldErrors.name = "Nama wajib diisi.";
  if (!input.slug) fieldErrors.slug = "Slug/URL wajib diisi.";
  const thumbnailError = validateImageUrl(input.thumbnailUrl, { required: true });
  if (thumbnailError) fieldErrors.thumbnailUrl = thumbnailError;

  const bannerError = validateImageUrl(input.bannerUrl);
  if (bannerError) fieldErrors.bannerUrl = bannerError;

  if (!input.categoryId) fieldErrors.categoryId = "Kategori wajib dipilih.";

  if (input.soldCount < 0) fieldErrors.soldCount = "Jumlah terjual tidak boleh negatif.";

  const inputFieldErrors = validateInputFields(input.inputFields);
  if (inputFieldErrors) {
    Object.assign(fieldErrors, inputFieldErrors);
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return null;
}

async function assertCategory(categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, isActive: true },
  });
  return Boolean(category);
}

function productPersistenceData(input: GameFormInput) {
  const requiresZone = hasZoneField(input.inputFields);

  return {
    name: input.name,
    subtitle: input.subtitle,
    slug: input.slug,
    categoryId: input.categoryId,
    isPopular: input.isPopular,
    soldCount: input.soldCount,
    requiresLogin: input.requiresLogin,
    status: input.status,
    thumbnailUrl: input.thumbnailUrl,
    bannerUrl: input.bannerUrl,
    requiresZone,
    inputFields: input.inputFields as Prisma.InputJsonValue,
    nicknameCheckCode: input.nicknameCheckCode || null,
    guideHtml: input.guideHtml || null,
    fieldHintHtml: input.fieldHintHtml || null,
    sortOrder: input.sortOrder,
  };
}

export async function persistGame(
  input: GameFormInput,
  productId?: string,
): Promise<GameFormState | null> {
  const validType = await assertCategory(input.categoryId);
  if (!validType) {
    return { fieldErrors: { categoryId: "Kategori tidak valid." } };
  }

  const data = productPersistenceData(input);

  if (productId) {
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return { error: "Produk tidak ditemukan." };
    }

    const slugTaken = await prisma.product.findFirst({
      where: { slug: input.slug, NOT: { id: productId } },
    });
    if (slugTaken) {
      return { fieldErrors: { slug: "Slug sudah dipakai produk lain." } };
    }

    await cleanupReplacedImage(existing.thumbnailUrl, input.thumbnailUrl);
    await cleanupReplacedImage(existing.bannerUrl, input.bannerUrl);

    await prisma.product.update({
      where: { id: productId },
      data,
    });

    return null;
  }

  const slugTaken = await prisma.product.findUnique({ where: { slug: input.slug } });
  if (slugTaken) {
    return { fieldErrors: { slug: "Slug sudah dipakai produk lain." } };
  }

  await prisma.product.create({ data });

  return null;
}
