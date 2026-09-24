import type { ImageAsset } from "@/assets/config";
import type {
  ActivityType,
  BookingStatus,
  ContactType,
  LeadSource,
  LeadStage,
  Permission,
  PaymentMethod,
  PaymentStatus,
  TaskStatus,
  VehicleCategory,
  VehicleStatus,
} from "@/lib/constants";

/**
 * Data models. These mirror what a real backend would return, so swapping the
 * mock layer for an API should not require changing them. Dates are ISO strings.
 * Money is in PHP.
 */

/** Kept deliberately small: what it is, how many it seats, and what it costs. */
export interface Vehicle {
  id: string;
  slug: string;
  name: string;
  category: VehicleCategory;
  /** Cars and vans always have this. Motorcycles don't carry a seat count. */
  seats?: number;
  /** Flat daily rate in PHP. Staff with the pricing permission can change it from the Pricing screen; bookings keep the rate they were made at. */
  pricePerDay: number;
  plateNumber: string;
  status: VehicleStatus;
  featured: boolean;
  images: ImageAsset[];
}

/** An extra phone number or email for a customer or lead (the main ones are on the record itself). */
export interface ContactDetail {
  id: string;
  type: ContactType;
  value: string;
  /** e.g. "Office", "Assistant", "Personal". */
  label: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  stage: LeadStage;
  /** Vehicle id the person asked about, if any. */
  vehicleInterest: string | null;
  message: string;
  additionalContacts: ContactDetail[];
  assigneeId: string | null;
  customerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  body: string;
  entityType: "lead" | "customer";
  entityId: string;
  /** null = created by the system (e.g. a website form). */
  authorId: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string | null;
  notes: string;
  additionalContacts: ContactDetail[];
  createdAt: string;
}

/**
 * A booking keeps its own copy of the price it was made at (dailyRate and the
 * totals). If the owner changes a vehicle's rate later, existing bookings
 * keep their original price and only new bookings use the new rate.
 */
export interface Booking {
  id: string;
  /** Customer-facing code, e.g. "RC-K7M2QA". */
  reference: string;
  customerId: string;
  vehicleId: string;
  /** Wherever the visitor typed or pasted (an address, or a Google Maps link) — there is no preset list. */
  pickupLocation: string;
  /** Same idea, for the return leg. */
  returnLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  days: number;
  dailyRate: number;
  vehicleTotal: number;
  total: number;
  status: BookingStatus;
  paymentId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A payment record. It only ever holds a method, an amount and the payment
 * provider's reference. Card numbers are never collected or stored here.
 */
export interface Payment {
  id: string;
  bookingId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  /** Reference from the payment provider (mock value for now). */
  providerRef: string | null;
  createdAt: string;
}

/** A page of results, the same shape a real paginated API would return. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

/** A staff account. Which role it has decides what it may do. */
export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  active: boolean;
  createdAt: string;
}

/** A named bundle of permissions, e.g. "Sales" or "Accountant". */
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  /** Built-in role that cannot be edited or deleted (Admin), so nobody can lock everyone out. */
  system?: boolean;
}

/** A to-do or follow-up, optionally linked to a lead or a customer. */
export interface Task {
  id: string;
  title: string;
  notes: string;
  /** ISO date ("2026-10-03"). */
  dueDate: string;
  assigneeId: string | null;
  status: TaskStatus;
  linkedType: "lead" | "customer" | null;
  linkedId: string | null;
  createdAt: string;
  completedAt: string | null;
}

/** A customer's review of the overall service (not of one car or one booking). Private until staff choose to show it. */
export interface Review {
  id: string;
  name: string;
  /** 1 to 5 stars. */
  rating: number;
  comment: string;
  /** The booking reference the customer gave. Only staff can see it. */
  bookingReference: string;
  /** Whether staff chose to show it on the public website. */
  published: boolean;
  createdAt: string;
}

/** What the public website is allowed to know about a shown review. */
export type PublicReview = Pick<Review, "id" | "name" | "rating" | "comment" | "createdAt">;
