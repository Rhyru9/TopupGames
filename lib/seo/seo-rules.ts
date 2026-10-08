export type SeoFlagSeverity = "ok" | "warn" | "fail";

export type SeoFlag = {
  code: string;
  severity: SeoFlagSeverity;
  message: string;
};

export const SEO_TITLE_MIN = 30;
export const SEO_TITLE_MAX = 60;
export const SEO_DESC_MIN = 70;
export const SEO_DESC_MAX = 160;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function worstSeverity(flags: SeoFlag[]): SeoFlagSeverity {
  if (flags.some((f) => f.severity === "fail")) return "fail";
  if (flags.some((f) => f.severity === "warn")) return "warn";
  return "ok";
}

export function checkTitle(title: string): SeoFlag {
  const length = title.trim().length;
  if (length === 0) {
    return { code: "title.empty", severity: "fail", message: "Title kosong." };
  }
  if (length < SEO_TITLE_MIN) {
    return {
      code: "title.short",
      severity: "warn",
      message: `Title terlalu pendek (${length}/${SEO_TITLE_MIN}–${SEO_TITLE_MAX}).`,
    };
  }
  if (length > SEO_TITLE_MAX) {
    return {
      code: "title.long",
      severity: "warn",
      message: `Title terlalu panjang (${length}/${SEO_TITLE_MIN}–${SEO_TITLE_MAX}).`,
    };
  }
  return {
    code: "title.ok",
    severity: "ok",
    message: `Title OK (${length} karakter).`,
  };
}

export function checkDescription(description: string): SeoFlag {
  const length = description.trim().length;
  if (length === 0) {
    return { code: "desc.empty", severity: "fail", message: "Description kosong." };
  }
  if (length < SEO_DESC_MIN) {
    return {
      code: "desc.short",
      severity: "warn",
      message: `Description terlalu pendek (${length}/${SEO_DESC_MIN}–${SEO_DESC_MAX}).`,
    };
  }
  if (length > SEO_DESC_MAX) {
    return {
      code: "desc.long",
      severity: "warn",
      message: `Description terlalu panjang (${length}/${SEO_DESC_MIN}–${SEO_DESC_MAX}).`,
    };
  }
  return {
    code: "desc.ok",
    severity: "ok",
    message: `Description OK (${length} karakter).`,
  };
}

export function checkKeywords(keywords: string): SeoFlag {
  if (!keywords.trim()) {
    return {
      code: "keywords.empty",
      severity: "warn",
      message: "Keywords belum diisi.",
    };
  }
  return { code: "keywords.ok", severity: "ok", message: "Keywords terisi." };
}

export function checkOgImage(url: string): SeoFlag {
  if (!url.trim()) {
    return {
      code: "og.empty",
      severity: "warn",
      message: "Gambar Open Graph belum diisi.",
    };
  }
  return { code: "og.ok", severity: "ok", message: "Gambar Open Graph terisi." };
}

export function checkCoverAlt(coverUrl: string, alt: string): SeoFlag | null {
  if (!coverUrl.trim()) return null;
  if (!alt.trim()) {
    return {
      code: "alt.empty",
      severity: "warn",
      message: "Cover ada tapi alt text kosong.",
    };
  }
  return { code: "alt.ok", severity: "ok", message: "Alt cover terisi." };
}

export function checkSlug(slug: string): SeoFlag {
  const value = slug.trim();
  if (!value) {
    return { code: "slug.empty", severity: "fail", message: "Slug kosong." };
  }
  if (!SLUG_PATTERN.test(value)) {
    return {
      code: "slug.invalid",
      severity: "warn",
      message: "Slug kurang ramah URL (gunakan huruf kecil, angka, dan tanda hubung).",
    };
  }
  return { code: "slug.ok", severity: "ok", message: "Slug OK." };
}

export function checkSitemapPath(path: string, sitemapPaths: Set<string>): SeoFlag {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (sitemapPaths.has(normalized)) {
    return {
      code: "sitemap.ok",
      severity: "ok",
      message: "Termasuk di sitemap.",
    };
  }
  return {
    code: "sitemap.missing",
    severity: "warn",
    message: "Tidak ada di sitemap (cek status aktif / footer).",
  };
}

export function checkSiteUrl(siteUrl: string): SeoFlag {
  if (!siteUrl.trim()) {
    return {
      code: "siteUrl.empty",
      severity: "fail",
      message: "URL website belum diisi di Pengaturan Umum.",
    };
  }
  return { code: "siteUrl.ok", severity: "ok", message: "URL website terisi." };
}

export function checkVerification(label: string, value: string): SeoFlag {
  if (!value.trim()) {
    return {
      code: `verify.${label}.empty`,
      severity: "warn",
      message: `${label} belum diisi.`,
    };
  }
  return {
    code: `verify.${label}.ok`,
    severity: "ok",
    message: `${label} terisi.`,
  };
}
