import {
  assertAllowedImageMime,
  MAX_UPLOAD_BYTES,
} from "@/lib/storage/process-image";
import { storeImageLocally } from "@/lib/storage/local-storage-adapter";
import { storeImageToR2 } from "@/lib/storage/r2-storage-adapter";
import { getSiteStorageSettings } from "@/lib/site-settings/get-site-settings";
import {
  isUploadKind,
  uploadKindPresets,
  type UploadKind,
} from "@/lib/storage/upload-kinds";
import type { StoredImage } from "@/lib/storage/local-storage-adapter";

export type UploadImageInput = {
  kind: UploadKind;
  file: File;
};

export async function uploadConsoleImage(input: UploadImageInput): Promise<StoredImage> {
  if (!isUploadKind(input.kind)) {
    throw new Error("Jenis upload tidak valid.");
  }

  if (!input.file || input.file.size === 0) {
    throw new Error("File gambar wajib dipilih.");
  }

  if (input.file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Ukuran file melebihi 8 MB.");
  }

  assertAllowedImageMime(input.file.type);

  const preset = uploadKindPresets[input.kind];
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const storage = await getSiteStorageSettings();

  if (storage.driver === "cloudflare_r2") {
    const r2 = storage.cloudflareR2;
    if (
      !r2.accountId.trim() ||
      !r2.accessKeyId.trim() ||
      !r2.secretAccessKey.trim() ||
      !r2.bucket.trim() ||
      !r2.publicBaseUrl.trim()
    ) {
      throw new Error("Konfigurasi Cloudflare R2 belum lengkap. Atur di Pengaturan Website → Penyimpanan.");
    }

    return storeImageToR2(buffer, input.file.type, preset, r2);
  }

  return storeImageLocally(buffer, input.file.type, preset, storage.local);
}
