import type { SiteStorageSettings } from "@/lib/site-settings/site-settings-schemas";
import { resolvePublicUploadPrefix } from "@/lib/storage/upload-config";

export type StorageBackend = "local" | "r2" | "external";

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export function resolveStorageBackend(
  imagePath: string,
  storage: SiteStorageSettings,
): StorageBackend {
  const trimmed = imagePath.trim();
  if (!trimmed) return "external";

  if (trimmed.startsWith("/")) {
    const localPrefix = normalizeBaseUrl(
      storage.local.publicUrlPrefix || resolvePublicUploadPrefix(),
    );
    if (trimmed === localPrefix || trimmed.startsWith(`${localPrefix}/`)) {
      return "local";
    }
    return "external";
  }

  try {
    const parsed = new URL(trimmed);
    const r2Base = normalizeBaseUrl(storage.cloudflareR2.publicBaseUrl);
    if (r2Base) {
      const candidate = normalizeBaseUrl(`${parsed.protocol}//${parsed.host}${parsed.pathname}`);
      if (candidate === r2Base || candidate.startsWith(`${r2Base}/`)) {
        return "r2";
      }
      if (trimmed.startsWith(`${r2Base}/`)) {
        return "r2";
      }
    }
  } catch {
    return "external";
  }

  return "external";
}

export function isManagedStoragePath(imagePath: string, storage: SiteStorageSettings): boolean {
  const backend = resolveStorageBackend(imagePath, storage);
  return backend === "local" || backend === "r2";
}

export function extractLocalRelativePath(
  imagePath: string,
  storage: SiteStorageSettings,
): string | null {
  const trimmed = imagePath.trim();
  const prefix = normalizeBaseUrl(storage.local.publicUrlPrefix || resolvePublicUploadPrefix());

  if (!trimmed.startsWith(`${prefix}/`)) return null;
  return trimmed.slice(prefix.length + 1);
}

export function extractR2ObjectKey(imagePath: string, storage: SiteStorageSettings): string | null {
  const trimmed = imagePath.trim();
  const base = normalizeBaseUrl(storage.cloudflareR2.publicBaseUrl);
  if (!base || !trimmed.startsWith(`${base}/`)) return null;
  return trimmed.slice(base.length + 1);
}
