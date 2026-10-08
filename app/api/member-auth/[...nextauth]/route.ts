import { NextRequest } from "next/server";
import { getAppUrl } from "@/lib/app-url";
import { memberAuthHandlers } from "@/lib/member-auth";

/**
 * Ngrok / reverse proxy sering membuat NextRequest.url jadi localhost.
 * Auth.js pakai origin itu untuk redirect_uri + halaman error.
 * Paksa origin = Pengaturan Website → URL Website.
 */
async function withSiteOrigin(req: NextRequest): Promise<NextRequest> {
  const siteOrigin = new URL(await getAppUrl()).origin;
  const currentOrigin = req.nextUrl.origin;
  if (currentOrigin === siteOrigin) return req;
  return new NextRequest(req.nextUrl.href.replace(currentOrigin, siteOrigin), req);
}

export async function GET(req: NextRequest) {
  return memberAuthHandlers.GET(await withSiteOrigin(req));
}

export async function POST(req: NextRequest) {
  return memberAuthHandlers.POST(await withSiteOrigin(req));
}
