/**
 * Shared constants. Ids only; the words people read for each id live in /src/content.
 * Keeping ids here means filters, badges, forms and reports can never drift apart.
 */

export const BUSINESS_TIME_ZONE = "Asia/Manila";
/** Manila is UTC+8 all year (no daylight saving). */
export const BUSINESS_UTC_OFFSET = "+08:00";

export const VEHICLE_CATEGORIES = ["sedan", "suv", "van", "125cc", "155cc"] as const;
export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export const VEHICLE_STATUSES = ["available", "maintenance", "inactive"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const VEHICLE_SORTS = ["price-asc", "price-desc", "name-asc", "seats-desc"] as const;
export type VehicleSort = (typeof VEHICLE_SORTS)[number];

/** Catalog filter choices. */
export const PRICE_FILTER_STEPS = [1000, 2000, 3000, 4000, 5000] as const;
export const SEAT_FILTER_OPTIONS = [4, 5, 7, 10] as const;
export const CATALOG_PAGE_SIZE = 9;

/** The lead pipeline. THE single source for stages: pipeline, filters, badges and reports all use this. */
export const LEAD_STAGES = ["new", "contacted", "qualified", "won", "lost"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_SOURCES = ["website", "phone", "walk_in", "facebook", "referral"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const ACTIVITY_TYPES = ["note", "call", "status_change"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const BOOKING_STATUSES = ["pending", "confirmed", "active", "completed", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_METHODS = ["card", "gcash", "maya", "paypal", "wise", "pay_at_pickup"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["pending", "processing", "paid", "failed"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/**
 * Everything a role can be allowed to do. Roles are just bundles of these, and the
 * whole admin area checks these ids (never role names), so custom roles work everywhere.
 */
export const PERMISSIONS = [
  "dashboard.view",
  "customers.view",
  "customers.edit",
  "leads.view",
  "leads.edit",
  "tasks.manage",
  "bookings.view",
  "bookings.edit",
  "reports.view",
  "pricing.edit",
  "reviews.manage",
  "users.manage",
  "roles.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const CONTACT_TYPES = ["phone", "email"] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const TASK_STATUSES = ["open", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
