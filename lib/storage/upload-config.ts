import path from "path";
import type { LocalStorageSettings } from "@/lib/site-settings/site-settings-schemas";

export const PUBLIC_UPLOAD_PREFIX = "/uploads";

export function resolveLocalUploadDir(localSettings?: LocalStorageSettings): string {
  const configured = localSettings?.uploadDir?.trim() || process.env.UPLOAD_DIR?.trim();
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(/* turbopackIgnore: true */ process.cwd(), configured);
  }

  return path.join(/* turbopackIgnore: true */ process.cwd(), "storage", "uploads");
}

export function resolvePublicUploadPrefix(localSettings?: LocalStorageSettings): string {
  const configured = localSettings?.publicUrlPrefix?.trim() || process.env.PUBLIC_UPLOAD_URL?.trim();
  if (!configured) return PUBLIC_UPLOAD_PREFIX;

  const normalized = configured.replace(/\/+$/, "");
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

/** @deprecated Use resolveLocalUploadDir */
export function getUploadDir(): string {
  return resolveLocalUploadDir();
}

/** @deprecated Use resolvePublicUploadPrefix */
export function getPublicUploadPrefix(): string {
  return resolvePublicUploadPrefix();
}

export function buildPublicUploadPath(
  relativePath: string,
  localSettings?: LocalStorageSettings,
): string {
  const prefix = resolvePublicUploadPrefix(localSettings);
  const normalized = relativePath.replace(/^\/+/, "").replace(/\\/g, "/");
  return `${prefix}/${normalized}`;
}
