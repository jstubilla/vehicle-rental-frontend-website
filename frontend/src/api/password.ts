import { ApiError } from "./client";
import { db } from "./supabase";

/** Sets the signed-in person's password (after following a staff invitation or a password-reset link). */
export async function setOwnPassword(password: string): Promise<void> {
  const { error } = await db().auth.updateUser({ password });
  if (error) throw new ApiError(error.message, 400, "unknown");
}
