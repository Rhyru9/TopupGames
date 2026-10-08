export type SitePopupModeValue = "IMAGE" | "TEXT";

export type PopupFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type PopupFormInput = {
  title: string;
  mode: SitePopupModeValue;
  body: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  dismissMinutes: number;
  sortOrder: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
};

export type PopupListItem = {
  id: string;
  title: string;
  mode: SitePopupModeValue;
  imageUrl: string | null;
  ctaHref: string;
  dismissMinutes: number;
  sortOrder: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  updatedAt: Date;
};

export type StorefrontPopupData = {
  id: string;
  title: string;
  mode: SitePopupModeValue;
  body: string | null;
  imageUrl: string | null;
  ctaLabel: string;
  ctaHref: string;
  dismissMinutes: number;
  updatedAt: string;
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

function parseOptionalDateTime(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatPopupDateTimeLocal(value: Date | null | undefined): string {
  if (!value) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function parsePopupForm(formData: FormData): PopupFormInput {
  const modeRaw = String(formData.get("mode") ?? "IMAGE").trim().toUpperCase();
  const mode: SitePopupModeValue = modeRaw === "TEXT" ? "TEXT" : "IMAGE";
  const sortRaw = Number.parseInt(String(formData.get("sortOrder") ?? "0"), 10);
  const dismissRaw = Number.parseInt(String(formData.get("dismissMinutes") ?? "5"), 10);

  return {
    title: String(formData.get("title") ?? "").trim(),
    mode,
    body: String(formData.get("body") ?? "").trim(),
    imageUrl: String(formData.get("imageUrl") ?? "").trim(),
    ctaLabel: String(formData.get("ctaLabel") ?? "").trim(),
    ctaHref: String(formData.get("ctaHref") ?? "").trim(),
    dismissMinutes: Number.isFinite(dismissRaw) ? Math.max(1, dismissRaw) : 5,
    sortOrder: Number.isFinite(sortRaw) ? sortRaw : 0,
    startsAt: parseOptionalDateTime(String(formData.get("startsAt") ?? "")),
    endsAt: parseOptionalDateTime(String(formData.get("endsAt") ?? "")),
    isActive: formData.get("isActive") === "on",
  };
}

export function validatePopupInput(input: PopupFormInput): PopupFormState | null {
  const fieldErrors: Record<string, string> = {};

  if (!input.title) {
    fieldErrors.title = "Judul wajib diisi.";
  } else if (input.title.length > 200) {
    fieldErrors.title = "Judul maksimal 200 karakter.";
  }

  if (input.mode === "IMAGE") {
    if (!input.imageUrl.trim()) {
      fieldErrors.imageUrl = "Gambar wajib diupload untuk mode gambar.";
    }
  } else if (!input.body) {
    fieldErrors.body = "Isi teks wajib diisi untuk mode teks.";
  }

  if (input.ctaLabel.length > 80) {
    fieldErrors.ctaLabel = "Label CTA maksimal 80 karakter.";
  }

  const hrefError = validateHref(input.ctaHref);
  if (hrefError) fieldErrors.ctaHref = hrefError;
  else if (input.ctaHref.length > 500) {
    fieldErrors.ctaHref = "Link maksimal 500 karakter.";
  }

  if (input.dismissMinutes < 1) {
    fieldErrors.dismissMinutes = "Dismiss minimal 1 menit.";
  } else if (input.dismissMinutes > 60 * 24 * 30) {
    fieldErrors.dismissMinutes = "Dismiss maksimal 30 hari.";
  }

  if (input.sortOrder < 0) {
    fieldErrors.sortOrder = "Urutan tidak boleh negatif.";
  }

  if (input.startsAt && input.endsAt && input.endsAt.getTime() < input.startsAt.getTime()) {
    fieldErrors.endsAt = "Tanggal akhir harus setelah tanggal mulai.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return null;
}

export function toPopupPersistData(input: PopupFormInput) {
  return {
    title: input.title,
    mode: input.mode,
    body: input.mode === "TEXT" ? input.body || null : null,
    imageUrl: input.mode === "IMAGE" ? input.imageUrl || null : null,
    ctaLabel: input.ctaLabel,
    ctaHref: input.ctaHref,
    dismissMinutes: input.dismissMinutes,
    sortOrder: input.sortOrder,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    isActive: input.isActive,
  };
}
