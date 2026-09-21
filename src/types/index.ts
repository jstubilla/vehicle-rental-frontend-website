import type { ImageAsset } from "@/assets/config";
import type {
  ActivityType,
  FuelType,
  LeadSource,
  LeadStage,
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

/** A page of results, the same shape a real paginated API would return. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
