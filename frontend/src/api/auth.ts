import { ApiError } from "./client";
import { db } from "./supabase";

/**
 * STAFF sign-in, with Supabase Auth. A staff member is an auth user with an active row in the staff
 * table (customers sign in through /src/api/account.ts). The database checks who is signed in on every
 * request (row-level security), so these functions only decide what the screens show.
 */

/** The signed-in staff member. */
export interface Session {
  userId: string;
  name: string;
  email: string;
}

async function staffSession(userId: string, email: string): Promise<Session | null> {
  const { data } = await db().from("staff").select("name, email, active").eq("id", userId).maybeSingle();
  if (!data?.active) return null;
  return { userId, name: data.name, email: data.email ?? email };
}

export async function login(email: string, password: string): Promise<Session> {
  const supabase = db();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error || !data.user) throw new ApiError("Wrong email or password", 401, "invalid_credentials");

  const { data: staff } = await supabase.from("staff").select("name, email, active").eq("id", data.user.id).maybeSingle();
  if (!staff || !staff.active) {
    // A website customer's account, or a deactivated staff member: don't stay signed in.
    await supabase.auth.signOut();
    if (!staff) throw new ApiError("Wrong email or password", 401, "invalid_credentials");
    throw new ApiError("This account is deactivated", 403, "account_inactive");
  }
  return { userId: data.user.id, name: staff.name, email: staff.email };
}

/** Who is signed in right now, if it is an active staff member; otherwise null. */
export async function getSession(): Promise<Session | null> {
  const { data } = await db().auth.getUser();
  if (!data.user) return null;
  return staffSession(data.user.id, data.user.email ?? "");
}

export async function logout(): Promise<void> {
  await db().auth.signOut();
}

/**
 * The signed-in user's id, for the staff screens (e.g. as the author of a note). The database refuses
 * anything they are not allowed to do, so this only catches a session that has expired.
 */
export async function requireStaff(): Promise<{ userId: string }> {
  const { data } = await db().auth.getSession();
  if (!data.session) throw new ApiError("Please sign in again", 401, "forbidden");
  return { userId: data.session.user.id };
}
