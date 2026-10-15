import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { requestClient } from "@/api/server";

/**
 * Where Supabase Auth sends people back to: after "Continue with Google / Apple", and from the links
 * in its emails (confirm sign-up, log in). Starts the session, then goes to `next`.
 */
export const dynamic = "force-dynamic";

/** Only pages on this site (never another site: "//host" and "/\\host" both leave it). */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/";
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = safeNext(params.get("next"));
  const supabase = await requestClient();

  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Missing code") };

  const target = new URL(error ? "/login?error=link" : next, request.url);
  return NextResponse.redirect(target);
}
