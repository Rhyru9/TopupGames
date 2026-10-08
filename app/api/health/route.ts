import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRedisConnection } from "@/lib/queue/connection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: { db: boolean; redis?: boolean } = { db: false };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = true;
  } catch {
    return NextResponse.json({ ok: false, ...checks }, { status: 503 });
  }

  if (process.env.REDIS_URL?.trim()) {
    try {
      const pong = await getRedisConnection().ping();
      checks.redis = pong === "PONG";
    } catch {
      checks.redis = false;
    }
  }

  return NextResponse.json({ ok: true, ...checks });
}
