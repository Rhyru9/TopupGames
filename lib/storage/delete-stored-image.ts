import { getSiteStorageSettings } from "@/lib/site-settings/get-site-settings";
import { deleteImageFromR2 } from "@/lib/storage/r2-storage-adapter";
import { deleteImageLocally } from "@/lib/storage/local-storage-adapter";
import {
  extractLocalRelativePath,
  extractR2ObjectKey,
  isManagedStoragePath,
  resolveStorageBackend,
} from "@/lib/storage/storage-resolver";

export async function deleteStoredImage(imagePath: string): Promise<void> {
  const trimmed = imagePath.trim();
  if (!trimmed) return;

  const storage = await getSiteStorageSettings();
  if (!isManagedStoragePath(trimmed, storage)) return;

  const backend = resolveStorageBackend(trimmed, storage);

  try {
    if (backend === "local") {
      const relativePath = extractLocalRelativePath(trimmed, storage);
      if (relativePath) {
        await deleteImageLocally(relativePath, storage.local);
      }
      return;
    }

    if (backend === "r2") {
      const objectKey = extractR2ObjectKey(trimmed, storage);
      if (objectKey) {
        await deleteImageFromR2(objectKey, storage.cloudflareR2);
      }
    }
  } catch {
    // Abaikan jika file sudah tidak ada — jangan blokir simpan form.
  }
}

export async function cleanupReplacedImage(
  oldPath: string | null | undefined,
  newPath: string,
): Promise<void> {
  const previous = (oldPath ?? "").trim();
  const next = newPath.trim();
  if (!previous || previous === next) return;
  await deleteStoredImage(previous);
}
