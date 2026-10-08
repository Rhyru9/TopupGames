import { auth } from "@/lib/auth";
import {
  buildReportWorkbook,
  reportDownloadFilename,
} from "@/lib/reports/build-report-workbook";
import { resolveReportPeriod } from "@/lib/reports/report-period";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/console/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const period = resolveReportPeriod({
    preset: searchParams.get("preset"),
    from: searchParams.get("from"),
    to: searchParams.get("to"),
  });

  const buffer = await buildReportWorkbook(period);
  const filename = reportDownloadFilename(period);
  const body = Buffer.from(buffer);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
