import { NextResponse } from "next/server";
import { searchActiveProducts } from "@/lib/catalog-products/search-products";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? searchParams.get("search") ?? "").trim();

  if (q.length < 1) {
    return NextResponse.json({ results: [] as const });
  }

  try {
    const results = await searchActiveProducts(q, 6);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("[products/search]", error);
    return NextResponse.json({ error: "Gagal mencari produk." }, { status: 500 });
  }
}
