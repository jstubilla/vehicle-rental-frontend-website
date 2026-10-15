/**
 * Shared helpers for /src/api: the error type screens understand, and the translation of database
 * errors into it.
 */

/** Machine-readable reasons the UI knows how to explain to the visitor. */
export type ApiErrorCode =
  | "price_changed"
  | "not_found"
  | "invalid_credentials"
  | "account_inactive"
  | "forbidden"
  | "has_bookings"
  | "duplicate_email"
  | "invalid_transition"
  | "not_payable"
  | "payment_overdue"
  | "not_resubmittable"
  | "not_cancellable"
  | "invalid_price"
  | "invalid_input"
  | "last_admin"
  | "self_deactivate"
  | "unknown_booking"
  | "no_account"
  | "invalid_code"
  | "confirm_email"
  | "duplicate_name"
  | "has_users"
  | "system_role"
  | "unknown";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
    public readonly code: ApiErrorCode = "unknown",
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * The codes the database itself raises: a broken rule's error MESSAGE is the code and its DETAIL the
 * explanation (see backend/supabase/migrations/…_business_rules.sql).
 */
const DATABASE_CODES: Partial<Record<ApiErrorCode, number>> = {
  price_changed: 409,
  not_found: 404,
  has_bookings: 409,
  invalid_transition: 409,
  not_payable: 409,
  payment_overdue: 409,
  not_resubmittable: 409,
  not_cancellable: 409,
  invalid_input: 400,
  last_admin: 409,
  self_deactivate: 409,
  unknown_booking: 404,
};

/** The shape of an error from supabase-js (PostgREST and Postgres). */
interface DatabaseError {
  message: string;
  code?: string;
  details?: string | null;
}

/** Turns a database error into an ApiError the screens can explain. */
export function toApiError(error: DatabaseError): ApiError {
  const status = DATABASE_CODES[error.message as ApiErrorCode];
  if (status) return new ApiError(error.details || error.message, status, error.message as ApiErrorCode);
  // 23505 = unique violation: the only unique values staff type in are email addresses.
  if (error.code === "23505") return new ApiError("This email is already used", 409, "duplicate_email");
  // PGRST116 = .single() found no row.
  if (error.code === "PGRST116") return new ApiError("Not found", 404, "not_found");
  // 42501 = permission denied (row-level security, or not signed in).
  if (error.code === "42501") return new ApiError("You are not allowed to do this", 403, "forbidden");
  return new ApiError(error.message, 500, "unknown");
}

/** Unwraps a supabase-js result: the data, or the error as an ApiError. */
export function unwrap<T>(result: { data: T; error: DatabaseError | null }): NonNullable<T> {
  if (result.error) throw toApiError(result.error);
  if (result.data === null || result.data === undefined) throw new ApiError("Not found", 404, "not_found");
  return result.data as NonNullable<T>;
}

/** Like unwrap, for writes whose result is not needed. */
export function check(result: { error: DatabaseError | null }): void {
  if (result.error) throw toApiError(result.error);
}
