import { NextResponse, type NextRequest } from "next/server";

const AUTH_ROUTES = ["/profile", "/subscription"];
const ADMIN_ROUTE = "/admin";

function hasPathPrefix(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("hw_session")?.value;
  const adminCookie = request.cookies.get("hw_admin")?.value;

  const needsAuth = AUTH_ROUTES.some((route) => hasPathPrefix(pathname, route));
  const needsAdmin = hasPathPrefix(pathname, ADMIN_ROUTE);

  if (needsAuth && sessionCookie !== "1") {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (needsAdmin) {
    if (sessionCookie !== "1") {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (adminCookie !== "1") {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/subscription/:path*", "/admin/:path*"],
};
