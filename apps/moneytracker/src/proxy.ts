import { NextRequest, NextResponse } from "next/server";

// Optimistic auth gate (Next.js 16 "proxy" convention, formerly middleware).
// This only checks for the presence of the session cookie to redirect early —
// the cryptographic verification happens in the server layout/data layer
// (isAuthenticated), so a forged cookie still cannot view any data.

const PUBLIC_PATHS = ["/login"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Never gate API routes (they enforce their own auth), Next internals, OAuth
  // return, or static assets.
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/oauth") ||
    pathname === "/favicon.ico" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const hasSession = req.cookies.has("mt_session");
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!hasSession && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (hasSession && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
