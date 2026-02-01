import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Don't rewrite or route to the catch-all for these prefixes:
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/sites")
  ) {
    return NextResponse.next();
  }

  // If you have a global rewrite to the catch-all, guard it here.
  // Otherwise let normal routing continue:
  return NextResponse.next();
}
