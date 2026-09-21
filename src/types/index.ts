import type { ImageAsset } from "@/assets/config";
import type {
  ActivityType,
  BookingStatus,
  ContactType,
  ExtraPricing,
  FuelType,
  LeadSource,
  LeadStage,
  Permission,
  PaymentMethod,
  PaymentStatus,
  Transmission,
  VehicleCategory,
  VehicleStatus,
} from "@/lib/constants";

/**
 * Data models. These mirror what a real backend would return, so swapping the
 * mock layer for an API should not require changing them. Dates are ISO strings.
 * Money is in PHP. More models (Booking, Customer, Task, User, Payment) arrive with their phases.
 */

export interface Vehicle {
  id: string;
  slug: string;
  name: string;
  make: string;
  model: string;
  year: number;
  category: VehicleCategory;
  transmission: Transmission;
  fuel: FuelType;
  seats: number;
  /** Flat daily rate in PHP. The owner can change it from the fleet screen. */
  pricePerDay: number;
  description: string;
  features: string[];
  plateNumber: string;
  status: VehicleStatus;
  featured: boolean;
  images: ImageAsset[];
}

export interface Location {
  id: string;
  name: string;
  city: string;
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

/** An optional add-on such as a child seat. */
export interface Extra {
  id: string;
  name: string;
  description: string;
  price: number;
  /** per_day = price x number of days, flat = charged once. */
  pricing: ExtraPricing;
}

/** An extra as it was priced when the booking was made. */
export interface BookingExtraLine {
  extraId: string;
  name: string;
  pricing: ExtraPricing;
  unitPrice: number;
  total: number;
}

/**
 * A booking keeps its own copy of the prices it was made at (dailyRate and the
 * extras lines). If the owner changes a vehicle's rate later, existing bookings
 * keep their original price and only new bookings use the new rate.
 */
export interface Booking {
  id: string;
  /** Customer-facing code, e.g. "RC-K7M2QA". */
  reference: string;
  customerId: string;
  vehicleId: string;
  pickupLocationId: string;
  returnLocationId: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  days: number;
  dailyRate: number;
  vehicleTotal: number;
  extras: BookingExtraLine[];
  extrasTotal: number;
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
}
