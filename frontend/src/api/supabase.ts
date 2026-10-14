import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The connection to the Supabase database (backend/). Every function in /src/api goes through here.
 *
 * - In the browser: one client that keeps the signed-in user's session (staff or customer) in cookies,
 *   so the server (proxy.ts, route handlers) sees the same session.
 * - On the server (public pages built or rendered by Next.js): a client with only the public key and no
 *   session, so it sees exactly what an anonymous visitor may see.
 *
 * Row-level security in the database decides what each of them can read and change.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function assertSupabaseConfigured(): void {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see frontend/README.md).",
    );
  }
}

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

export function db(): SupabaseClient {
  assertSupabaseConfigured();
  if (typeof window !== "undefined") {
    browserClient ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return browserClient;
  }
  serverClient ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return serverClient;
}

/** The private bucket for the photos customers send with a booking (backend/supabase/migrations/…_storage.sql). */
export const DOCUMENTS_BUCKET = "booking-documents";
