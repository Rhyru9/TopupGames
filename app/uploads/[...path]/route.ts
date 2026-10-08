import { readFile } from "fs/promises";
import path from "path";
import { resolveStoredImagePath } from "@/lib/storage/local-storage-adapter";
import { getSiteStorageSettings } from "@/lib/site-settings/get-site-settings";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const EXTENSION_MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

function contentTypeFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_MIME[ext] ?? "application/octet-stream";
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { path: segments } = await context.params;
  const storage = await getSiteStorageSettings();
  const filePath = resolveStoredImagePath(segments, storage.local);

  if (!filePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const data = await readFile(filePath);

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentTypeFromPath(filePath),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
