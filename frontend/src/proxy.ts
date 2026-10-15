import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/admin/login";

/**
 * Guards everything under /admin (in Next.js 16 this file replaces middleware.ts): only an active staff
 * member gets in, everyone else goes to the staff login page. It also refreshes the Supabase session
 * cookies. The database enforces the same rule on every request, so this decides what the screens
 * show; it is not the only line of defence.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });
  let isStaff = false;

  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: staff } = await supabase.from("staff").select("active").eq("id", data.user.id).maybeSingle();
      isStaff = staff?.active === true;
    }
  }

  const { pathname, search } = request.nextUrl;
  if (pathname === LOGIN_PATH) {
    return isStaff ? withCookies(NextResponse.redirect(new URL("/admin", request.url)), response) : response;
  }
  if (!isStaff) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return withCookies(NextResponse.redirect(loginUrl), response);
  }
  return response;
}

/** Keeps refreshed session cookies when redirecting. */
function withCookies(redirect: NextResponse, from: NextResponse): NextResponse {
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
