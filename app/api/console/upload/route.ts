import { auth } from "@/lib/auth";
import { uploadConsoleImage } from "@/lib/storage/upload-service";
import { isUploadKind } from "@/lib/storage/upload-kinds";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const kind = String(formData.get("kind") ?? "");
    const file = formData.get("file");

    if (!isUploadKind(kind)) {
      return NextResponse.json({ error: "Jenis upload tidak valid." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File gambar wajib dipilih." }, { status: 400 });
    }

    const stored = await uploadConsoleImage({ kind, file });

    return NextResponse.json({
      path: stored.publicPath,
      bytes: stored.bytes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload gagal.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
