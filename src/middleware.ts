import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminToken = request.cookies.get("admin_token")?.value;
  const secretToken = process.env.ADMIN_SESSION_SECRET || "mkweb_admin_session_token_key";
  const isAuthenticated = adminToken === secretToken;

  // Protect all dashboard routes
  if (pathname.startsWith("/admin/dashboard")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/admin", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already logged in, redirect /admin or / to /admin/dashboard
  if (pathname === "/admin" || pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin", "/admin/dashboard/:path*", "/admin/dashboard00/:path*"],
};
