import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { assertSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase";

/**
 * SERVER ONLY (route handlers under src/app/api and src/app/auth). Never import this from a component:
 * the service-role key below bypasses every security rule in the database.
 */

/** A client acting as whoever is signed in on this request (read from the session cookies). */
export async function requestClient(): Promise<SupabaseClient> {
  assertSupabaseConfigured();
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    },
  });
}

/** A client with full access, for the few things only the server may do (recording payments, staff accounts). */
export function adminClient(): SupabaseClient {
  assertSupabaseConfigured();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (see frontend/README.md).");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** The signed-in user's id if they are an active staff member, otherwise null. */
export async function currentStaffId(): Promise<string | null> {
  const supabase = await requestClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: staff } = await supabase.from("staff").select("active").eq("id", data.user.id).maybeSingle();
  return staff?.active ? data.user.id : null;
}
