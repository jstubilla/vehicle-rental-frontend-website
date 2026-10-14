import type { ImageAsset } from "@/assets/config";
import type {
  ActivityType,
  BookingStatus,
  ContactType,
  DocumentStatus,
  LeadSource,
  LeadStage,
  OnlinePaymentMethod,
  PaymentMethod,
  PaymentStatus,
  TaskStatus,
  VehicleCategory,
  VehicleStatus,
} from "@/lib/constants";
import type { Activity, Booking, ContactDetail, Customer, Lead, Payment, Review, Task, User, Vehicle } from "@/types";

/**
 * Database rows (snake_case, as in backend/supabase/migrations) and their conversion into the types the
 * screens use (src/types). Only /src/api uses this file.
 */

export interface VehicleRow {
  id: string;
  slug: string;
  name: string;
  category: VehicleCategory;
  examples: string;
  seats: number | null;
  price_per_day: number;
  status: VehicleStatus;
  featured: boolean;
  images: ImageAsset[];
  sort_order: number;
}

export const toVehicle = (row: VehicleRow): Vehicle => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  category: row.category,
  examples: row.examples,
  ...(row.seats !== null && { seats: row.seats }),
  pricePerDay: row.price_per_day,
  status: row.status,
  featured: row.featured,
  images: row.images,
});

export interface ContactDetailRow {
  id: string;
  type: ContactType;
  value: string;
  label: string;
  created_at: string;
}

const toContactDetails = (rows: ContactDetailRow[] | null | undefined): ContactDetail[] =>
  [...(rows ?? [])]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(({ id, type, value, label }) => ({ id, type, value, label }));

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  license_number: string | null;
  notes: string;
  created_at: string;
  contact_details?: ContactDetailRow[];
}

export const toCustomer = (row: CustomerRow): Customer => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  licenseNumber: row.license_number,
  notes: row.notes,
  additionalContacts: toContactDetails(row.contact_details),
  createdAt: row.created_at,
});

export interface LeadRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  stage: LeadStage;
  vehicle_interest: string | null;
  message: string;
  assignee_id: string | null;
  customer_id: string | null;
  created_at: string;
  updated_at: string;
  contact_details?: ContactDetailRow[];
}

export const toLead = (row: LeadRow): Lead => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  source: row.source,
  stage: row.stage,
  vehicleInterest: row.vehicle_interest,
  message: row.message,
  additionalContacts: toContactDetails(row.contact_details),
  assigneeId: row.assignee_id,
  customerId: row.customer_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export interface ActivityRow {
  id: string;
  type: ActivityType;
  body: string;
  customer_id: string | null;
  lead_id: string | null;
  author_id: string | null;
  created_at: string;
}

export const toActivity = (row: ActivityRow): Activity => ({
  id: row.id,
  type: row.type,
  body: row.body,
  entityType: row.lead_id ? "lead" : "customer",
  entityId: (row.lead_id ?? row.customer_id)!,
  authorId: row.author_id,
  createdAt: row.created_at,
});

/** Where an activity goes: exactly one of the two columns is set. */
export const activitySubject = (entityType: Activity["entityType"], entityId: string) =>
  entityType === "lead" ? { lead_id: entityId, customer_id: null } : { customer_id: entityId, lead_id: null };

export interface PaymentRow {
  id: string;
  booking_id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  provider_ref: string | null;
  down_payment_method: OnlinePaymentMethod | null;
  down_payment_amount: number | null;
  created_at: string;
}

export const toPayment = (row: PaymentRow): Payment => ({
  id: row.id,
  bookingId: row.booking_id,
  method: row.method,
  amount: row.amount,
  status: row.status,
  providerRef: row.provider_ref,
  downPayment:
    row.down_payment_method && row.down_payment_amount !== null
      ? { method: row.down_payment_method, amount: row.down_payment_amount }
      : null,
  createdAt: row.created_at,
});

/** A one-to-one embed comes back as an object, but older PostgREST versions return a one-item array. */
export const one = <T>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

export interface BookingRow {
  id: string;
  reference: string;
  customer_id: string;
  vehicle_id: string;
  pickup_location: string;
  return_location: string;
  pickup_date: string;
  pickup_time: string;
  return_date: string;
  return_time: string;
  days: number;
  daily_rate: number;
  vehicle_total: number;
  with_driver: boolean;
  driver_rate: number;
  driver_total: number;
  total: number;
  status: BookingStatus;
  documents_status: DocumentStatus | null;
  rejection_reason: string | null;
  approved_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

/** "10:00:00" -> "10:00" (the screens use HH:mm). */
const hhmm = (time: string) => time.slice(0, 5);

/**
 * paymentId comes from the booking's payment (a separate table). Document photos are added by the
 * functions that may show them (staff only), so they are left out here.
 */
export const toBooking = (row: BookingRow, paymentId: string | null): Booking => ({
  id: row.id,
  reference: row.reference,
  customerId: row.customer_id,
  vehicleId: row.vehicle_id,
  pickupLocation: row.pickup_location,
  returnLocation: row.return_location,
  pickupDate: row.pickup_date,
  pickupTime: hhmm(row.pickup_time),
  returnDate: row.return_date,
  returnTime: hhmm(row.return_time),
  days: row.days,
  dailyRate: row.daily_rate,
  vehicleTotal: row.vehicle_total,
  withDriver: row.with_driver,
  driverRate: row.driver_rate,
  driverTotal: row.driver_total,
  total: row.total,
  status: row.status,
  documents: null,
  documentsStatus: row.documents_status,
  rejectionReason: row.rejection_reason,
  approvedAt: row.approved_at,
  cancellation:
    row.cancelled_by === "customer" && row.cancelled_at
      ? { by: "customer", reason: row.cancellation_reason ?? "", at: row.cancelled_at }
      : null,
  paymentId,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export interface TaskRow {
  id: string;
  title: string;
  notes: string;
  due_date: string;
  assignee_id: string | null;
  status: TaskStatus;
  lead_id: string | null;
  customer_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export const toTask = (row: TaskRow): Task => ({
  id: row.id,
  title: row.title,
  notes: row.notes,
  dueDate: row.due_date,
  assigneeId: row.assignee_id,
  status: row.status,
  linkedType: row.lead_id ? "lead" : row.customer_id ? "customer" : null,
  linkedId: row.lead_id ?? row.customer_id,
  createdAt: row.created_at,
  completedAt: row.completed_at,
});

export interface StaffRow {
  id: string;
  name: string;
  email: string;
  active: boolean;
  created_at: string;
}

export const toUser = (row: StaffRow): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  active: row.active,
  createdAt: row.created_at,
});

export interface ReviewRow {
  id: string;
  name: string;
  rating: number;
  comment: string;
  booking_reference: string;
  published: boolean;
  created_at: string;
}

export const toReview = (row: ReviewRow): Review => ({
  id: row.id,
  name: row.name,
  rating: row.rating,
  comment: row.comment,
  bookingReference: row.booking_reference,
  published: row.published,
  createdAt: row.created_at,
});
