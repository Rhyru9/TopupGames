import type { UploadKind } from "@/lib/storage/upload-kinds";

export async function uploadImageFile(kind: UploadKind, file: File): Promise<string> {
  const body = new FormData();
  body.set("kind", kind);
  body.set("file", file);

  const response = await fetch("/api/console/upload", {
    method: "POST",
    body,
  });

  const payload = (await response.json()) as { path?: string; error?: string };

  if (!response.ok || !payload.path) {
    throw new Error(payload.error ?? "Upload gagal.");
  }

  return payload.path;
}
