import { prisma } from "@/lib/prisma";

export type TickerFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type TickerFormInput = {
  label: string;
  detail: string;
  href: string;
  sortOrder: number;
  isActive: boolean;
};

export type TickerListItem = {
  id: string;
  label: string;
  detail: string;
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

export function parseTickerForm(formData: FormData): TickerFormInput {
  const sortRaw = Number.parseInt(String(formData.get("sortOrder") ?? "0"), 10);

  return {
    label: String(formData.get("label") ?? "").trim(),
    detail: String(formData.get("detail") ?? "").trim(),
    href: String(formData.get("href") ?? "").trim(),
    sortOrder: Number.isFinite(sortRaw) ? sortRaw : 0,
    isActive: formData.get("isActive") === "on",
  };
}

export function validateTickerInput(input: TickerFormInput): TickerFormState | null {
  const fieldErrors: Record<string, string> = {};

  if (!input.label) {
    fieldErrors.label = "Label kiri wajib diisi.";
  } else if (input.label.length > 120) {
    fieldErrors.label = "Label maksimal 120 karakter.";
  }

  if (!input.detail) {
    fieldErrors.detail = "Detail kanan wajib diisi.";
  } else if (input.detail.length > 160) {
    fieldErrors.detail = "Detail maksimal 160 karakter.";
  }

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

export async function listTickerItems(options?: {
  skip?: number;
  take?: number;
}): Promise<{ items: TickerListItem[]; total: number }> {
  const [items, total] = await Promise.all([
    prisma.tickerItem.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        label: true,
        detail: true,
        href: true,
        sortOrder: true,
        isActive: true,
        updatedAt: true,
      },
    }),
    prisma.tickerItem.count(),
  ]);

  return { items, total };
}

export async function persistTickerItem(
  input: TickerFormInput,
  tickerId?: string,
): Promise<TickerFormState | null> {
  if (tickerId) {
    const existing = await prisma.tickerItem.findUnique({ where: { id: tickerId } });
    if (!existing) {
      return { error: "Item ticker tidak ditemukan." };
    }

    await prisma.tickerItem.update({
      where: { id: tickerId },
      data: input,
    });
  } else {
    await prisma.tickerItem.create({ data: input });
  }

  return null;
}

export async function deleteTickerItemById(tickerId: string): Promise<void> {
  await prisma.tickerItem.delete({ where: { id: tickerId } }).catch(() => null);
}
