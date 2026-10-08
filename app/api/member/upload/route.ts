import { getMemberSession } from "@/lib/member-auth";
import { uploadConsoleImage } from "@/lib/storage/upload-service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getMemberSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File gambar wajib dipilih." }, { status: 400 });
    }

    const stored = await uploadConsoleImage({ kind: "member-avatar", file });

    return NextResponse.json({
      path: stored.publicPath,
      bytes: stored.bytes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload gagal.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
