import { matchesCronSecret } from "@/lib/cron/authorize-cron";
import { NextResponse } from "next/server";
import { getResolvedCronSecret } from "@/lib/cron/get-cron-secret";
import { syncSkuAvailability } from "@/lib/providers/catalog/sync-sku-availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handle(request: Request) {
  const secret = await getResolvedCronSecret();
  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Cron secret belum diset. Generate di Console → Website → Cron jobs, atau set CRON_SECRET di .env.",
      },
      { status: 503 },
    );
  }

  if (!matchesCronSecret(request, secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await syncSkuAvailability();
    const { items: _items, ...summary } = result;
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Sync gagal.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
