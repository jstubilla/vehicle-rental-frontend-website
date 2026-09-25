import { SESSION_TTL_SECONDS, type Session } from "@/lib/session";
import { readTable } from "@/mocks/store";
import { ApiError, simulateNetwork } from "./client";

/**
 * MOCK AUTH. The demo has one shared password for every account, so no password
 * is ever stored. A real backend checks each user's own (hashed) password.
 */
export const DEMO_PASSWORD = "demo1234";

const SESSION_URL = "/api/mock-session";

/** The signed-in user, remembered so API functions can check that someone is signed in. */
let currentSession: Session | null = null;

export async function login(email: string, password: string): Promise<Session> {
  await simulateNetwork();

  const user = readTable("users").find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || password !== DEMO_PASSWORD) {
    throw new ApiError("Wrong email or password", 401, "invalid_credentials");
  }
  if (!user.active) throw new ApiError("This account is deactivated", 403, "account_inactive");

  const session: Session = {
    userId: user.id,
    name: user.name,
    email: user.email,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  };

  const response = await fetch(SESSION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session }),
  });
  if (!response.ok) throw new ApiError("Could not start the session", 500);

  currentSession = session;
  return session;
}

/** Who is signed in right now? null if nobody (or the session expired). */
export async function getSession(): Promise<Session | null> {
  const response = await fetch(SESSION_URL, { cache: "no-store" });
  const { session } = (await response.json()) as { session: Session | null };
  currentSession = session;
  return session;
}

export async function logout(): Promise<void> {
  await fetch(SESSION_URL, { method: "DELETE" });
  currentSession = null;
}

/**
 * Used inside admin API functions: refuses the call if nobody is signed in. Every
 * signed-in staff member is an admin and may do everything. The route guard in
 * proxy.ts is the first line; a real backend repeats this check on every request.
 */
export function assertAdmin(): Session {
  if (!currentSession) throw new ApiError("Please sign in", 401, "forbidden");
  return currentSession;
}
