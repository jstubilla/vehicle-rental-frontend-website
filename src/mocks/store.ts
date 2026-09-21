import type { Activity, Booking, Customer, Extra, Lead, Location, Payment, Role, Task, User, Vehicle } from "@/types";
import { seedActivities } from "./activities";
import { seedBookings, seedPayments } from "./bookings";
import { seedCustomers } from "./customers";
import { seedExtras } from "./extras";
import { seedLeads } from "./leads";
import { seedLocations } from "./locations";
import { seedRoles } from "./roles";
import { seedTasks } from "./tasks";
import { seedUsers } from "./users";
import { seedVehicles } from "./vehicles";

/**
 * The fake database. Only /src/api should import this file: components never touch it.
 *
 * - In the browser it is saved to localStorage, so changes survive page reloads.
 * - On the server it is just the seed data (the server has no localStorage).
 * - Bump SEED_VERSION whenever seed data changes, so old saved data is discarded.
 */
const SEED_VERSION = 7;
const STORAGE_PREFIX = "car-rental-mock-db-v";
const STORAGE_KEY = `${STORAGE_PREFIX}${SEED_VERSION}`;

export interface Db {
  vehicles: Vehicle[];
  locations: Location[];
  extras: Extra[];
  customers: Customer[];
  bookings: Booking[];
  payments: Payment[];
  leads: Lead[];
  activities: Activity[];
  users: User[];
  roles: Role[];
  tasks: Task[];
}

function createSeed(): Db {
  return {
    vehicles: structuredClone(seedVehicles),
    locations: structuredClone(seedLocations),
    extras: structuredClone(seedExtras),
    customers: structuredClone(seedCustomers),
    bookings: structuredClone(seedBookings),
    payments: structuredClone(seedPayments),
    leads: structuredClone(seedLeads),
    activities: structuredClone(seedActivities),
    users: structuredClone(seedUsers),
    roles: structuredClone(seedRoles),
    tasks: structuredClone(seedTasks),
  };
}

/** Server copy of the data, and the fallback when browser storage is unavailable. */
let memory: Db | null = null;
let cleanedOldVersions = false;

/** Removes data saved by older seed versions so it does not pile up in the browser. */
function removeOldVersions() {
  if (cleanedOldVersions) return;
  cleanedOldVersions = true;
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith(STORAGE_PREFIX) && key !== STORAGE_KEY) window.localStorage.removeItem(key);
    }
  } catch {
    // Storage blocked: nothing to clean.
  }
}

/**
 * Reads the latest data every time (not a cached copy), so a change made in one
 * browser tab is seen by another open tab straight away.
 */
function load(): Db {
  memory ??= createSeed();
  if (typeof window === "undefined") return memory;
  removeOldVersions();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...memory, ...(JSON.parse(saved) as Partial<Db>) };
    // First visit: save the starting data so it survives reloads and can be inspected.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // Unreadable or blocked storage: fall back to the in-memory copy.
  }
  return memory;
}

function persist(db: Db) {
  memory = db;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Storage full or blocked (private mode): the app keeps working in memory.
  }
}

export function readTable<K extends keyof Db>(table: K): Db[K] {
  return structuredClone(load()[table]);
}

export function writeTable<K extends keyof Db>(table: K, rows: Db[K]): void {
  const db = load();
  db[table] = structuredClone(rows);
  persist(db);
}

/** Restores the original seed data (useful before a demo). */
export function resetMockDb(): void {
  persist(createSeed());
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
