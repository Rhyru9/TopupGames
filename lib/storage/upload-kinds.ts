export const uploadKinds = [
  "game-thumbnail",
  "game-banner",
  "landing-banner",
  "category-icon",
  "product-type-icon",
  "site-logo",
  "site-favicon",
  "site-og-image",
  "site-pwa-icon",
  "member-avatar",
  "admin-avatar",
  "article-cover",
  "popup-image",
  "expense-receipt",
] as const;

export type UploadKind = (typeof uploadKinds)[number];

export type UploadKindPreset = {
  maxWidth: number;
  quality: number;
  subdir: string;
  label: string;
  /** Simpan format asli (GIF/PNG/JPG) — tanpa konversi WebP. */
  preserveFormat?: boolean;
  /**
   * Paksa output format.
   * JPEG dipakai untuk OG — WhatsApp/Facebook sering gagal render WebP.
   */
  output?: "webp" | "jpeg";
};

export const uploadKindPresets: Record<UploadKind, UploadKindPreset> = {
  "game-thumbnail": {
    maxWidth: 512,
    quality: 80,
    subdir: "games/thumbnails",
    label: "Thumbnail game",
  },
  "game-banner": {
    maxWidth: 1920,
    quality: 82,
    subdir: "games/banners",
    label: "Banner game",
  },
  "landing-banner": {
    maxWidth: 1920,
    quality: 82,
    subdir: "banners",
    label: "Banner landing",
  },
  "category-icon": {
    maxWidth: 256,
    quality: 80,
    subdir: "categories/icons",
    label: "Icon kategori",
  },
  "product-type-icon": {
    maxWidth: 256,
    quality: 80,
    subdir: "product-types/icons",
    label: "Icon jenis produk",
  },
  "site-logo": {
    maxWidth: 512,
    quality: 82,
    subdir: "site/logos",
    label: "Logo website",
    preserveFormat: true,
  },
  "site-favicon": {
    maxWidth: 128,
    quality: 85,
    subdir: "site/favicons",
    label: "Favicon",
  },
  "site-og-image": {
    maxWidth: 1200,
    quality: 85,
    subdir: "site/og",
    label: "Gambar OG",
    output: "jpeg",
  },
  "site-pwa-icon": {
    maxWidth: 512,
    quality: 90,
    subdir: "site/pwa",
    label: "Icon PWA",
  },
  "member-avatar": {
    maxWidth: 512,
    quality: 85,
    subdir: "members/avatars",
    label: "Foto profil member",
  },
  "admin-avatar": {
    maxWidth: 512,
    quality: 85,
    subdir: "admins/avatars",
    label: "Foto profil admin",
  },
  "article-cover": {
    maxWidth: 1200,
    quality: 82,
    subdir: "articles/covers",
    label: "Cover artikel",
  },
  "popup-image": {
    maxWidth: 1200,
    quality: 82,
    subdir: "popups",
    label: "Gambar popup",
  },
  "expense-receipt": {
    maxWidth: 1600,
    quality: 82,
    subdir: "expenses/receipts",
    label: "Bukti pengeluaran",
  },
};

export function isUploadKind(value: string): value is UploadKind {
  return (uploadKinds as readonly string[]).includes(value);
}

/** Teks UI upload — dipakai di form console & zona drop. */
export const UPLOAD_ACCEPT_FORMATS = "PNG, JPG, GIF, WebP, AVIF";
export const UPLOAD_MAX_SIZE = "8 MB";

export function getUploadFormatHint(kind?: UploadKind): string {
  const base = `${UPLOAD_ACCEPT_FORMATS} · maks. ${UPLOAD_MAX_SIZE}`;
  if (!kind) return base;
  const preset = uploadKindPresets[kind];
  if (preset?.output === "jpeg") {
    return `${base} · disimpan JPEG (cocok WhatsApp/FB) · saran 1200×630`;
  }
  if (preset?.preserveFormat) {
    return `${base} · format asli dipertahankan`;
  }
  return base;
}
