import { NextRequest, NextResponse } from "next/server";

/**
 * Propagate the current pathname as an `x-pathname` request header so server
 * components (layouts, pages) can read it via `headers().get("x-pathname")`.
 */
export function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
