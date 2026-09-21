import { NextResponse, type NextRequest } from "next/server";
import {
  decodeSession,
  encodeSession,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  sessionSchema,
} from "@/lib/session";

/**
 * MOCK session endpoint. The mock login (in the browser) posts the session here so
 * it is stored in a cookie that proxy.ts can read. A real backend replaces this:
 * it would check the password itself and set a signed session cookie.
 */
export const dynamic = "force-dynamic";

/** Who is signed in? Used by the admin area (like a real API's "/me"). */
export async function GET(request: NextRequest) {
  return NextResponse.json({ session: decodeSession(request.cookies.get(SESSION_COOKIE)?.value) });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { session?: unknown } | null;
  const parsed = sessionSchema.safeParse(body?.session);
  if (!parsed.success) return NextResponse.json({ error: "Invalid session" }, { status: 400 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, encodeSession(parsed.data), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
