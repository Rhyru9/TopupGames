import { auth } from "@/lib/auth";
import { getConsoleOrderAlerts } from "@/lib/orders/get-console-order-alerts";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await getConsoleOrderAlerts();
  return NextResponse.json(alerts);
}
