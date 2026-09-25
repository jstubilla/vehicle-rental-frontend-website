import { NextResponse, type NextRequest } from "next/server";
import { decodeSession, SESSION_COOKIE } from "@/lib/session";

const LOGIN_PATH = "/admin/login";

/**
 * Guards everything under /admin. (In Next.js 16 this file replaces middleware.ts.)
 * - not signed in -> login page
 * - signed in -> in. Everyone who signs in is an admin, so there are no per-page rules.
 * The MOCK session cookie is not real security; see lib/session.ts.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === LOGIN_PATH) {
    return session ? NextResponse.redirect(new URL("/admin", request.url)) : NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
