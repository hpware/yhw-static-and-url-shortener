import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./components/auth";

export const config = {
  matcher: ["/((?!_next/static).*)"],
};

const ADMIN_PATHS = new Set(["", "/", "/urls", "/sites", "/api-keys", "/api-docs", "/settings"]);

function isAdminPath(pathname: string): boolean {
  if (ADMIN_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/auth/") || pathname.startsWith("/api/")) return true;
  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname =
    req.headers.get("host")?.split(":")[0] ?? req.nextUrl.hostname;
  const userHeaders = req.headers;

  const siteHostingDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN;
  const adminManagementDomain = process.env.NEXT_PUBLIC_ADMIN_DOMAIN;
  const shortenerDomain = process.env.NEXT_PUBLIC_URL_SHORTENER_DOMAIN;

  if (hostname === siteHostingDomain) {
    return NextResponse.rewrite(new URL(`/site${pathname}`, req.url));
  } else if (hostname === adminManagementDomain) {
    if (!isAdminPath(pathname)) {
      const shortenerUrl = shortenerDomain
        ? `https://${shortenerDomain}${pathname}`
        : new URL(`/shortener${pathname}`, req.url).toString();
      return NextResponse.redirect(shortenerUrl, 307);
    }

    const isApiRoute = pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/");
    if (isApiRoute) {
      const apiKey = userHeaders.get("x-api-key") || userHeaders.get("authorization")?.replace("Bearer ", "");
      if (apiKey) {
        return NextResponse.rewrite(new URL(`/admin${pathname}`, req.url));
      }
    }

    const checkUserLoginStatus = await auth.api.getSession({
      headers: userHeaders,
    });
    if (
      !pathname.startsWith("/auth/") &&
      !pathname.startsWith("/api/auth/") &&
      checkUserLoginStatus === null
    ) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    } else if (
      pathname.startsWith("/auth/") &&
      pathname !== "/auth/logout"
    ) {
      if (checkUserLoginStatus) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
    return NextResponse.rewrite(new URL(`/admin${pathname}`, req.url));
  } else if (hostname === shortenerDomain) {
    return NextResponse.rewrite(new URL(`/shortener${pathname}`, req.url));
  } else {
    return NextResponse.rewrite(new URL(`/shortener${pathname}`, req.url));
  }
}
