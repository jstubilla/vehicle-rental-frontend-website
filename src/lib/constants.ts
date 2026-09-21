/**
 * Shared constants. Ids only; the words people read for each id live in /src/content.
 * Keeping ids here means filters, badges, forms and reports can never drift apart.
 */

export const BUSINESS_TIME_ZONE = "Asia/Manila";
/** Manila is UTC+8 all year (no daylight saving). */
export const BUSINESS_UTC_OFFSET = "+08:00";

export const VEHICLE_CATEGORIES = ["sedan", "hatchback", "suv", "mpv", "van", "pickup"] as const;
export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export const TRANSMISSIONS = ["automatic", "manual"] as const;
export type Transmission = (typeof TRANSMISSIONS)[number];

export const FUEL_TYPES = ["gasoline", "diesel", "hybrid", "electric"] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

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
