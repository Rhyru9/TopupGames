import { NextResponse } from "next/server";
import { ProductStatus } from "@/app/generated/prisma/client";
import {
  mapToMelostoreTarget,
  resolveGameInputFields,
} from "@/lib/catalog-products/game-input-fields";
import { prisma } from "@/lib/prisma";
import { checkMelostoreNickname } from "@/lib/providers/melostore/check-nickname";
import { getFulfillmentProviderConfig } from "@/lib/providers/get-provider-config";

export const runtime = "nodejs";

type CheckBody = {
  productSlug?: string;
  values?: Record<string, string>;
};

export async function POST(request: Request) {
  let body: CheckBody;
  try {
    body = (await request.json()) as CheckBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Body JSON tidak valid." }, { status: 400 });
  }

  const productSlug = String(body.productSlug ?? "").trim();
  const values = body.values && typeof body.values === "object" ? body.values : {};

  if (!productSlug) {
    return NextResponse.json({ ok: false, error: "Slug produk wajib." }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { slug: productSlug, status: ProductStatus.ACTIVE },
    select: {
      nicknameCheckCode: true,
      requiresZone: true,
      inputFields: true,
    },
  });

  if (!product) {
    return NextResponse.json({ ok: false, error: "Produk tidak ditemukan." }, { status: 404 });
  }

  const gameCode = product.nicknameCheckCode?.trim() ?? "";
  if (!gameCode) {
    return NextResponse.json(
      { ok: false, error: "Produk ini tidak mendukung cek nickname." },
      { status: 400 },
    );
  }

  const inputFields = resolveGameInputFields(product.inputFields, product.requiresZone);
  for (const field of inputFields.fields) {
    if (!field.required) continue;
    if (!String(values[field.key] ?? "").trim()) {
      return NextResponse.json(
        { ok: false, error: `${field.label} wajib diisi sebelum cek nickname.` },
        { status: 400 },
      );
    }
  }

  const runtime = await getFulfillmentProviderConfig("melostore");
  if (!runtime?.isConfigured) {
    return NextResponse.json(
      { ok: false, error: "Provider Melostore belum dikonfigurasi / tidak aktif." },
      { status: 503 },
    );
  }

  const apiKey = String(runtime.config.apiKey ?? "").trim();
  const secretKey = String(runtime.config.secretKey ?? "").trim();
  const target = mapToMelostoreTarget(
    Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, String(value ?? "")]),
    ),
    inputFields,
  );

  try {
    const result = await checkMelostoreNickname({
      apiUrl: runtime.apiUrl,
      apiKey,
      secretKey,
      gameCode,
      target,
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, errorCode: result.errorCode },
        { status: 422 },
      );
    }

    return NextResponse.json({
      ok: true,
      nickname: result.nickname,
      region: result.region,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Gagal menghubungi Melostore.",
      },
      { status: 502 },
    );
  }
}
