import type { User } from "@/types";
import { requireStaff } from "./auth";
import { ApiError, toApiError, unwrap, type ApiErrorCode } from "./client";
import { toUser, type StaffRow } from "./rows";
import { db } from "./supabase";

/**
 * Staff accounts. Reading and switching accounts on or off happen directly in the database, which
 * also refuses to deactivate yourself or the last active account. Adding someone (an email
 * invitation) and changing a sign-in email need the service-role key, so they go through the server
 * (src/app/api/staff/route.ts).
 */

/** Staff list, used for "assigned to" pickers and to show who wrote an activity. */
export async function listUsers(): Promise<User[]> {
  await requireStaff();
  return (unwrap(await db().from("staff").select("*")) as StaffRow[]).map(toUser);
}

/* ---------- Staff accounts (Users screen) ---------- */

export async function listStaff(): Promise<User[]> {
  await requireStaff();
  return (unwrap(await db().from("staff").select("*").order("name")) as StaffRow[]).map(toUser);
}

export interface UserInput {
  name: string;
  email: string;
  active: boolean;
}

async function callStaffRoute(method: "POST" | "PATCH", body: object): Promise<User> {
  const response = await fetch("/api/staff", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json().catch(() => null)) as
    | { user: StaffRow }
    | { error: { message: string; code: ApiErrorCode } }
    | null;
  if (!result || "error" in result) {
    throw new ApiError(result?.error.message ?? "Could not save the user", response.status, result?.error.code ?? "unknown");
  }
  return toUser(result.user);
}

/** Adds a staff member and emails them an invitation to choose their password. */
export async function createUser(input: UserInput): Promise<User> {
  return callStaffRoute("POST", input);
}

export async function updateUser(id: string, input: UserInput): Promise<User> {
  return callStaffRoute("PATCH", { id, ...input });
}

/** Turns an account off or back on. Deactivated people cannot sign in; their records stay. */
export async function setUserActive(id: string, active: boolean): Promise<User> {
  await requireStaff();
  const { data, error } = await db().from("staff").update({ active }).eq("id", id).select("*").maybeSingle();
  if (error) throw toApiError(error);
  if (!data) throw new ApiError("User not found", 404, "not_found");
  return toUser(data as StaffRow);
}
