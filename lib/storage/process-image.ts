import sharp from "sharp";
import { UPLOAD_ACCEPT_FORMATS } from "@/lib/storage/upload-kinds";
import type { UploadKindPreset } from "@/lib/storage/upload-kinds";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export type ProcessedImage = {
  buffer: Buffer;
  mime: string;
  extension: string;
};

export function assertAllowedImageMime(mime: string): void {
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    throw new Error(`Format tidak didukung. Unggah ${UPLOAD_ACCEPT_FORMATS}.`);
  }
}

export function extensionForMime(mime: string): string {
  return MIME_EXTENSIONS[mime] ?? ".bin";
}

export async function convertImageToWebp(
  buffer: Buffer,
  preset: Pick<UploadKindPreset, "maxWidth" | "quality">,
): Promise<Buffer> {
  return sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: preset.maxWidth,
      height: preset.maxWidth,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: preset.quality })
    .toBuffer();
}

export async function convertImageToJpeg(
  buffer: Buffer,
  preset: Pick<UploadKindPreset, "maxWidth" | "quality">,
): Promise<Buffer> {
  return sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: preset.maxWidth,
      height: preset.maxWidth,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: preset.quality, mozjpeg: true })
    .toBuffer();
}

export async function processImageForStorage(
  buffer: Buffer,
  mime: string,
  preset: UploadKindPreset,
): Promise<ProcessedImage> {
  if (preset.output === "jpeg") {
    const jpegBuffer = await convertImageToJpeg(buffer, preset);
    return {
      buffer: jpegBuffer,
      mime: "image/jpeg",
      extension: ".jpg",
    };
  }

  if (!preset.preserveFormat) {
    const webpBuffer = await convertImageToWebp(buffer, preset);
    return {
      buffer: webpBuffer,
      mime: "image/webp",
      extension: ".webp",
    };
  }

  const resize = {
    width: preset.maxWidth,
    height: preset.maxWidth,
    fit: "inside" as const,
    withoutEnlargement: true,
  };

  if (mime === "image/gif") {
    const processed = await sharp(buffer, { animated: true, failOn: "none" })
      .rotate()
      .resize(resize)
      .gif()
      .toBuffer();
    return { buffer: processed, mime: "image/gif", extension: ".gif" };
  }

  if (mime === "image/png") {
    const processed = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize(resize)
      .png()
      .toBuffer();
    return { buffer: processed, mime: "image/png", extension: ".png" };
  }

  if (mime === "image/jpeg") {
    const processed = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize(resize)
      .jpeg({ quality: preset.quality })
      .toBuffer();
    return { buffer: processed, mime: "image/jpeg", extension: ".jpg" };
  }

  if (mime === "image/webp") {
    const processed = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize(resize)
      .webp({ quality: preset.quality })
      .toBuffer();
    return { buffer: processed, mime: "image/webp", extension: ".webp" };
  }

  if (mime === "image/avif") {
    const processed = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize(resize)
      .avif({ quality: preset.quality })
      .toBuffer();
    return { buffer: processed, mime: "image/avif", extension: ".avif" };
  }

  throw new Error(`Format tidak didukung. Unggah ${UPLOAD_ACCEPT_FORMATS}.`);
}
