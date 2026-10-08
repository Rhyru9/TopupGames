import { cleanupReplacedImage, deleteStoredImage } from "@/lib/storage/delete-stored-image";
import { validateImageUrl } from "@/lib/storage/image-url";
import { prisma } from "@/lib/prisma";

export type BannerFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type BannerFormInput = {
  title: string;
  imageUrl: string;
  href: string;
  sortOrder: number;
  isActive: boolean;
};

export type BannerListItem = {
  id: string;
  title: string;
  imageUrl: string;
  href: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: Date;
};

function validateHref(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("#") || trimmed.startsWith("/")) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "Link harus diawali http://, https://, /, atau #.";
    }
    return null;
  } catch {
    return "Link harus diawali http://, https://, /, atau #.";
  }
}

export function parseBannerForm(formData: FormData): BannerFormInput {
  const sortRaw = Number.parseInt(String(formData.get("sortOrder") ?? "0"), 10);

  return {
    title: String(formData.get("title") ?? "").trim(),
    imageUrl: String(formData.get("imageUrl") ?? "").trim(),
    href: String(formData.get("href") ?? "").trim(),
    sortOrder: Number.isFinite(sortRaw) ? sortRaw : 0,
    isActive: formData.get("isActive") === "on",
  };
}

export function validateBannerInput(input: BannerFormInput): BannerFormState | null {
  const fieldErrors: Record<string, string> = {};

  if (!input.title) {
    fieldErrors.title = "Judul / alt text wajib diisi.";
  } else if (input.title.length > 200) {
    fieldErrors.title = "Judul maksimal 200 karakter.";
  }

  const imageError = validateImageUrl(input.imageUrl, { required: true });
  if (imageError) fieldErrors.imageUrl = imageError;

  const hrefError = validateHref(input.href);
  if (hrefError) fieldErrors.href = hrefError;
  else if (input.href.length > 500) {
    fieldErrors.href = "Link maksimal 500 karakter.";
  }

  if (input.sortOrder < 0) {
    fieldErrors.sortOrder = "Urutan tidak boleh negatif.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return null;
}

export async function listBanners(options?: {
  skip?: number;
  take?: number;
}): Promise<{ banners: BannerListItem[]; total: number }> {
  const [banners, total] = await Promise.all([
    prisma.banner.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        imageUrl: true,
        href: true,
        sortOrder: true,
        isActive: true,
        updatedAt: true,
      },
    }),
    prisma.banner.count(),
  ]);

  return { banners, total };
}

export async function persistBanner(
  input: BannerFormInput,
  bannerId?: string,
): Promise<BannerFormState | null> {
  if (bannerId) {
    const existing = await prisma.banner.findUnique({ where: { id: bannerId } });
    if (!existing) {
      return { error: "Banner tidak ditemukan." };
    }

    await cleanupReplacedImage(existing.imageUrl, input.imageUrl);

    await prisma.banner.update({
      where: { id: bannerId },
      data: input,
    });
  } else {
    await prisma.banner.create({ data: input });
  }

  return null;
}

export async function deleteBannerById(bannerId: string): Promise<void> {
  const existing = await prisma.banner.findUnique({ where: { id: bannerId } });
  if (!existing) return;

  await prisma.banner.delete({ where: { id: bannerId } });
  await deleteStoredImage(existing.imageUrl);
}
