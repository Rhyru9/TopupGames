import { matchesCronSecret } from "@/lib/cron/authorize-cron";
import { NextResponse } from "next/server";
import { getResolvedCronSecret } from "@/lib/cron/get-cron-secret";
import { expireUnpaidOrders } from "@/lib/orders/expire-unpaid-orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    const summary = await expireUnpaidOrders();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Expire gagal.",
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
