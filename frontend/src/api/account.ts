import type { AccountProfile } from "@/types";
import { ApiError } from "./client";
import { db } from "./supabase";

/**
 * Website CUSTOMER accounts, with Supabase Auth (staff use /src/api/auth.ts). The details shown and
 * saved for the next booking live in the profiles table; the email lives on the auth user.
 */

export type LoginProvider = "google" | "apple";

const normalize = (email: string) => email.trim().toLowerCase();

/** Where Supabase Auth sends people back to after a provider login or an emailed link. */
function callbackUrl(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  const url = new URL("/auth/callback", window.location.origin);
  if (next) url.searchParams.set("next", next);
  return url.toString();
}

async function loadProfile(userId: string, email: string): Promise<AccountProfile> {
  const { data } = await db()
    .from("profiles")
    .select("name, phone, license_number, created_at")
    .eq("id", userId)
    .maybeSingle();
  return {
    id: userId,
    name: data?.name ?? "",
    email,
    phone: data?.phone ?? "",
    licenseNumber: data?.license_number ?? "",
    createdAt: data?.created_at ?? new Date().toISOString(),
  };
}

/** The signed-in customer, or null. */
export async function getCurrentAccount(): Promise<AccountProfile | null> {
  if (typeof window === "undefined") return null;
  const { data } = await db().auth.getSession();
  const user = data.session?.user;
  return user ? loadProfile(user.id, user.email ?? "") : null;
}

export async function signUp(input: { name: string; email: string; password: string }): Promise<AccountProfile> {
  const email = normalize(input.email);
  const { data, error } = await db().auth.signUp({
    email,
    password: input.password,
    options: { data: { name: input.name.trim() }, emailRedirectTo: callbackUrl() },
  });
  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      throw new ApiError("An account with this email already exists", 409, "duplicate_email");
    }
    throw new ApiError(error.message, 400, "unknown");
  }
  // With "Confirm email" on, Supabase hides whether the address is taken: an existing user comes back
  // with no identities.
  if (data.user && data.user.identities?.length === 0) {
    throw new ApiError("An account with this email already exists", 409, "duplicate_email");
  }
  if (!data.session || !data.user) {
    throw new ApiError("Check your email to confirm your account", 202, "confirm_email");
  }
  return loadProfile(data.user.id, email);
}

export async function loginWithPassword(email: string, password: string): Promise<AccountProfile> {
  const { data, error } = await db().auth.signInWithPassword({ email: normalize(email), password });
  if (error?.code === "email_not_confirmed") {
    throw new ApiError("Confirm your email first", 403, "confirm_email");
  }
  if (error || !data.user) throw new ApiError("Wrong email or password", 401, "invalid_credentials");
  return loadProfile(data.user.id, data.user.email ?? normalize(email));
}

/** Step 1 of "log in with an email code": Supabase emails a 6-digit code (see backend/README.md). */
export async function requestLoginCode(email: string): Promise<void> {
  const { error } = await db().auth.signInWithOtp({ email: normalize(email), options: { shouldCreateUser: false } });
  if (!error) return;
  // Supabase refuses to send a code to an address that has no account when sign-up is off for codes.
  if (error.code === "otp_disabled" || error.code === "user_not_found" || /signups? not allowed/i.test(error.message)) {
    throw new ApiError("No account with this email", 404, "no_account");
  }
  throw new ApiError(error.message, 400, "unknown");
}

/** Step 2: the code from the email. */
export async function loginWithCode(email: string, code: string): Promise<AccountProfile> {
  const { data, error } = await db().auth.verifyOtp({ email: normalize(email), token: code.trim(), type: "email" });
  if (error || !data.user) throw new ApiError("That code is not right", 401, "invalid_code");
  return loadProfile(data.user.id, data.user.email ?? normalize(email));
}

/**
 * "Continue with Google / Apple": leaves for the provider's page, which sends the visitor back to
 * /auth/callback. The returned promise never settles, because the page is replaced.
 */
export async function loginWithProvider(provider: LoginProvider): Promise<AccountProfile> {
  const { error } = await db().auth.signInWithOAuth({ provider, options: { redirectTo: callbackUrl() } });
  if (error) throw new ApiError(error.message, 400, "unknown");
  return new Promise<AccountProfile>(() => {});
}

export async function logout(): Promise<void> {
  await db().auth.signOut();
}
