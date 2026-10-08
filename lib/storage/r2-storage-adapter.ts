import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { CloudflareR2Settings } from "@/lib/site-settings/site-settings-schemas";
import type { UploadKindPreset } from "@/lib/storage/upload-kinds";
import { processImageForStorage } from "@/lib/storage/process-image";
import type { StoredImage } from "@/lib/storage/local-storage-adapter";
import { randomBytes } from "crypto";

function createFilename(extension: string): string {
  const stamp = Date.now().toString(36);
  const rand = randomBytes(4).toString("hex");
  return `${stamp}-${rand}${extension}`;
}

function createR2Client(config: CloudflareR2Settings): S3Client {
  const endpoint =
    config.endpoint.trim() ||
    `https://${config.accountId.trim()}.r2.cloudflarestorage.com`;

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: config.accessKeyId.trim(),
      secretAccessKey: config.secretAccessKey.trim(),
    },
  });
}

export async function storeImageToR2(
  buffer: Buffer,
  mime: string,
  preset: UploadKindPreset,
  config: CloudflareR2Settings,
): Promise<StoredImage> {
  const processed = await processImageForStorage(buffer, mime, preset);
  const filename = createFilename(processed.extension);
  const relativePath = `${preset.subdir}/${filename}`.replace(/\\/g, "/");

  const client = createR2Client(config);
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket.trim(),
      Key: relativePath,
      Body: processed.buffer,
      ContentType: processed.mime,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  const publicBase = config.publicBaseUrl.trim().replace(/\/+$/, "");
  return {
    publicPath: `${publicBase}/${relativePath}`,
    relativePath,
    bytes: processed.buffer.byteLength,
  };
}

export async function deleteImageFromR2(
  objectKey: string,
  config: CloudflareR2Settings,
): Promise<void> {
  if (!config.bucket.trim() || !config.accessKeyId.trim() || !config.secretAccessKey.trim()) {
    return;
  }

  const client = createR2Client(config);
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket.trim(),
      Key: objectKey.replace(/^\/+/, ""),
    }),
  );
}
