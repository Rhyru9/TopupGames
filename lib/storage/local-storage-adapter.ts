import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import type { LocalStorageSettings } from "@/lib/site-settings/site-settings-schemas";
import {
  buildPublicUploadPath,
  resolveLocalUploadDir,
} from "@/lib/storage/upload-config";
import type { UploadKindPreset } from "@/lib/storage/upload-kinds";
import { processImageForStorage } from "@/lib/storage/process-image";

export type StoredImage = {
  publicPath: string;
  relativePath: string;
  bytes: number;
};

function createFilename(extension: string): string {
  const stamp = Date.now().toString(36);
  const rand = randomBytes(4).toString("hex");
  return `${stamp}-${rand}${extension}`;
}

export async function storeImageLocally(
  buffer: Buffer,
  mime: string,
  preset: UploadKindPreset,
  localSettings?: LocalStorageSettings,
): Promise<StoredImage> {
  const uploadDir = resolveLocalUploadDir(localSettings);
  const targetDir = path.join(uploadDir, preset.subdir);
  await mkdir(targetDir, { recursive: true });

  const processed = await processImageForStorage(buffer, mime, preset);
  const filename = createFilename(processed.extension);
  const relativePath = path.posix.join(preset.subdir, filename);
  const absolutePath = path.join(uploadDir, relativePath);

  await writeFile(absolutePath, processed.buffer);

  return {
    publicPath: buildPublicUploadPath(relativePath, localSettings),
    relativePath,
    bytes: processed.buffer.byteLength,
  };
}

export function resolveStoredImagePath(
  relativeSegments: string[],
  localSettings?: LocalStorageSettings,
): string | null {
  const uploadDir = path.resolve(resolveLocalUploadDir(localSettings));
  const filePath = path.resolve(uploadDir, ...relativeSegments);
  const rootWithSep = uploadDir.endsWith(path.sep) ? uploadDir : `${uploadDir}${path.sep}`;

  if (filePath !== uploadDir && !filePath.startsWith(rootWithSep)) {
    return null;
  }

  return filePath;
}

export async function deleteImageLocally(
  relativePath: string,
  localSettings?: LocalStorageSettings,
): Promise<void> {
  const segments = relativePath.replace(/^\/+/, "").split("/");
  const filePath = resolveStoredImagePath(segments, localSettings);
  if (!filePath) return;

  try {
    await unlink(filePath);
  } catch {
    // File may already be removed.
  }
}
