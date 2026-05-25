import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "apex_session";

// Admin paths
const ADMIN_PROTECTED = [
  "/dashboard",
  "/clients",
  "/kyc",
  "/accounts",
  "/deposits",
  "/withdrawals",
  "/reconciliation",
  "/reporting",
  "/commissions",
  "/webhooks",
  "/audit",
  "/security",
  "/settings",
];

const PORTAL_PROTECTED = "/portal";
const PORTAL_PUBLIC = ["/portal-login", "/portal-signup"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow API routes, static files, and login pages to pass through
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/fpg-psp-mock") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;

  // Admin guard
  const isAdminProtected = ADMIN_PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isAdminProtected) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Portal guard
  if (
    pathname.startsWith(PORTAL_PROTECTED) &&
    !PORTAL_PUBLIC.includes(pathname)
  ) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/portal-login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     *   - api routes
     *   - _next static files
     *   - favicon, robots, sitemap
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
