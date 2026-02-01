import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./components/auth";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname =
    req.headers.get("host")?.split(":")[0] ?? req.nextUrl.hostname;
  const userHeaders = req.headers;

  // import these to env values later.
  const siteHostingDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN;
  const adminManagementDomain = process.env.NEXT_PUBLIC_ADMIN_DOMAIN;
  if (hostname === siteHostingDomain) {
    return NextResponse.rewrite(new URL(`/site${pathname}`, req.url));
  } else if (hostname === adminManagementDomain) {
    const checkUserLoginStatus = await auth.api.getSession({
      headers: userHeaders,
    });
    if (
      !String(pathname).startsWith("/auth/") &&
      !String(pathname).startsWith("/api/auth/") &&
      checkUserLoginStatus === null
    ) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    } else if (
      String(pathname).startsWith("/auth/") &&
      pathname !== "/auth/logout"
    ) {
      if (checkUserLoginStatus) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
    return NextResponse.rewrite(new URL(`/admin${pathname}`, req.url));
  }
  return NextResponse.rewrite(new URL(`/shortener${pathname}`, req.url));
}
