import type { Activity, Lead, Location, Vehicle } from "@/types";
import { seedLocations } from "./locations";
import { seedVehicles } from "./vehicles";

/**
 * The fake database. Only /src/api should import this file: components never touch it.
 *
 * - In the browser it is saved to localStorage, so changes survive page reloads.
 * - On the server it is just the seed data (the server has no localStorage).
 * - Bump SEED_VERSION whenever seed data changes, so old saved data is discarded.
 */
const SEED_VERSION = 1;
const STORAGE_KEY = `car-rental-mock-db-v${SEED_VERSION}`;

export interface Db {
  vehicles: Vehicle[];
  locations: Location[];
  leads: Lead[];
  activities: Activity[];
}

function createSeed(): Db {
  return {
    vehicles: structuredClone(seedVehicles),
    locations: structuredClone(seedLocations),
    // Lead and activity seed data arrives in Phase 4.
    leads: [],
    activities: [],
  };
}

let cache: Db | null = null;

function load(): Db {
  if (cache) return cache;
  const seed = createSeed();
  if (typeof window !== "undefined") {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      cache = saved ? { ...seed, ...(JSON.parse(saved) as Partial<Db>) } : seed;
    } catch {
      cache = seed;
    }
  }
  cache ??= seed;
  return cache;
}

function persist() {
  if (typeof window === "undefined" || !cache) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full or blocked (private mode): the app keeps working in memory.
  }
}

export function readTable<K extends keyof Db>(table: K): Db[K] {
  return structuredClone(load()[table]);
}

export function writeTable<K extends keyof Db>(table: K, rows: Db[K]): void {
  load()[table] = structuredClone(rows);
  persist();
}

/** Restores the original seed data (useful before a demo). */
export function resetMockDb(): void {
  cache = createSeed();
  persist();
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
