import { NextResponse, type NextRequest } from "next/server";
import { firstAllowedPath, requiredPermission } from "@/lib/permissions";
import { decodeSession, sessionCan, SESSION_COOKIE } from "@/lib/session";

const LOGIN_PATH = "/admin/login";
const FORBIDDEN_PATH = "/admin/forbidden";

/**
 * Guards everything under /admin. (In Next.js 16 this file replaces middleware.ts.)
 * - not signed in  -> login page
 * - signed in, page not allowed for their role -> "no access" page
 * The MOCK session cookie is not real security; see lib/session.ts.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = decodeSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === LOGIN_PATH) {
    if (session) {
      return NextResponse.redirect(new URL(firstAllowedPath(session.permissions) ?? FORBIDDEN_PATH, request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  const needed = requiredPermission(pathname);
  if (needed && !sessionCan(session, needed) && pathname !== FORBIDDEN_PATH) {
    // Landing on /admin without dashboard access goes to the first page they can open.
    const fallback = pathname === "/admin" ? firstAllowedPath(session.permissions) : null;
    return NextResponse.redirect(new URL(fallback ?? FORBIDDEN_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
