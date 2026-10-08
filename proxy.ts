import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const PUBLIC_CONSOLE_PATHS = new Set(["/console/login", "/console/clear-session"]);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isPublic = PUBLIC_CONSOLE_PATHS.has(pathname);

  if (pathname.startsWith("/console") && !isPublic && !isLoggedIn) {
    return NextResponse.redirect(new URL("/console/login", req.url));
  }

  // Layout root skip storefront chrome pada /console
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-r9host-pathname", pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  matcher: ["/console/:path*"],
};
