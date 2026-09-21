import type { Permission } from "@/lib/constants";
import { SESSION_TTL_SECONDS, sessionCan, type Session } from "@/lib/session";
import { readTable } from "@/mocks/store";
import { ApiError, simulateNetwork } from "./client";

/**
 * MOCK AUTH. The demo has one shared password for every account, so no password
 * is ever stored. A real backend checks each user's own (hashed) password.
 */
export const DEMO_PASSWORD = "demo1234";

const SESSION_URL = "/api/mock-session";

/** The signed-in user, remembered so API functions can check permissions. */
let currentSession: Session | null = null;

export async function login(email: string, password: string): Promise<Session> {
  await simulateNetwork();

  const user = readTable("users").find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || password !== DEMO_PASSWORD) {
    throw new ApiError("Wrong email or password", 401, "invalid_credentials");
  }
  if (!user.active) throw new ApiError("This account is deactivated", 403, "account_inactive");

  const role = readTable("roles").find((r) => r.id === user.roleId);
  if (!role) throw new ApiError("This account has no role", 403, "account_inactive");

  const session: Session = {
    userId: user.id,
    name: user.name,
    email: user.email,
    roleName: role.name,
    // A snapshot: changes to a role apply the next time the person signs in.
    permissions: role.permissions,
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
 * Used inside admin API functions: refuses the call if the signed-in user's role
 * lacks the permission. The screens also hide what a role cannot do, but this
 * is the layer that actually stops it (and the one a real backend repeats).
 */
export function assertCan(permission: Permission): Session {
  if (!currentSession || !sessionCan(currentSession, permission)) {
    throw new ApiError("You do not have permission to do that", 403, "forbidden");
  }
  return currentSession;
}
