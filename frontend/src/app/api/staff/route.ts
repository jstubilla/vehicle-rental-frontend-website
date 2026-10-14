import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { toApiError, type ApiErrorCode } from "@/api/client";
import { adminClient, currentStaffId, requestClient } from "@/api/server";

/**
 * Adding staff and changing their details (used by createUser / updateUser in src/api/users.ts).
 * Only an active staff member may call it. Sign-in accounts live in Supabase Auth, which only the
 * service-role key can manage; the staff row itself is written as the signed-in staff member, so the
 * database rules (no deactivating yourself, at least one active account) still apply.
 */
export const dynamic = "force-dynamic";

const userSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  active: z.boolean(),
});

function fail(message: string, status: number, code: ApiErrorCode) {
  return NextResponse.json({ error: { message, code } }, { status });
}

/** Finds an existing sign-in account by email (e.g. someone who already has a customer account). */
async function findAuthUserId(email: string): Promise<string | null> {
  const admin = adminClient().auth.admin;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.listUsers({ page, perPage: 200 });
    if (error) return null;
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

/** Adds a staff member: invites them by email (or uses their existing sign-in account) and saves the staff row. */
export async function POST(request: NextRequest) {
  if (!(await currentStaffId())) return fail("Please sign in again", 401, "forbidden");
  const parsed = userSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Invalid user", 400, "invalid_input");
  const input = parsed.data;

  const supabase = await requestClient();
  const { data: taken } = await supabase.from("staff").select("id").eq("email", input.email).maybeSingle();
  if (taken) return fail("Another user already has this email", 409, "duplicate_email");

  const origin = request.nextUrl.origin;
  const invited = await adminClient().auth.admin.inviteUserByEmail(input.email, {
    data: { name: input.name },
    redirectTo: `${origin}/auth/callback?next=/admin/set-password`,
  });
  const userId = invited.data.user?.id ?? (await findAuthUserId(input.email));
  if (!userId) return fail(invited.error?.message ?? "Could not invite this person", 500, "unknown");

  const { data, error } = await supabase
    .from("staff")
    .insert({ id: userId, name: input.name, email: input.email, active: input.active })
    .select("*")
    .single();
  if (error) {
    const apiError = toApiError(error);
    return fail(apiError.message, apiError.status, apiError.code);
  }
  return NextResponse.json({ user: data });
}

/** Saves a staff member's name, email and active state. A new email also changes their sign-in email. */
export async function PATCH(request: NextRequest) {
  if (!(await currentStaffId())) return fail("Please sign in again", 401, "forbidden");
  const parsed = userSchema.extend({ id: z.uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Invalid user", 400, "invalid_input");
  const { id, ...input } = parsed.data;

  const supabase = await requestClient();
  const { data: existing } = await supabase.from("staff").select("email").eq("id", id).maybeSingle();
  if (!existing) return fail("User not found", 404, "not_found");

  if (existing.email !== input.email) {
    const { data: taken } = await supabase.from("staff").select("id").eq("email", input.email).maybeSingle();
    if (taken) return fail("Another user already has this email", 409, "duplicate_email");
    const { error } = await adminClient().auth.admin.updateUserById(id, { email: input.email, email_confirm: true });
    if (error) {
      const code: ApiErrorCode = error.code === "email_exists" ? "duplicate_email" : "unknown";
      return fail(error.message, code === "duplicate_email" ? 409 : 500, code);
    }
  }

  const { data, error } = await supabase.from("staff").update(input).eq("id", id).select("*").single();
  if (error) {
    const apiError = toApiError(error);
    return fail(apiError.message, apiError.status, apiError.code);
  }
  return NextResponse.json({ user: data });
}
