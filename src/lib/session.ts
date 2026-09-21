import { z } from "zod";
import { PERMISSIONS, type Permission } from "./constants";

/**
 * MOCK LOGIN SESSION. A real backend would issue a signed, tamper-proof session.
 * Here the session is a plain cookie the mock login sets, which is enough to demo
 * route protection and roles. Never rely on this for real security.
 */
export const SESSION_COOKIE = "car-rental-session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export const sessionSchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  roleName: z.string(),
  permissions: z.array(z.enum(PERMISSIONS)),
  /** Milliseconds since 1970. */
  expiresAt: z.number(),
});

export type Session = z.infer<typeof sessionSchema>;

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

export function encodeSession(session: Session): string {
  return toBase64Url(JSON.stringify(session));
}

/** Returns the session, or null if the cookie is missing, damaged or expired. */
export function decodeSession(value: string | undefined): Session | null {
  if (!value) return null;
  try {
    const parsed = sessionSchema.safeParse(JSON.parse(fromBase64Url(value)));
    if (!parsed.success || parsed.data.expiresAt < Date.now()) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function sessionCan(session: Pick<Session, "permissions"> | null | undefined, permission: Permission): boolean {
  return session?.permissions.includes(permission) ?? false;
}
