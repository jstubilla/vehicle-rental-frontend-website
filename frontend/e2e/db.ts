import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { seedVehicles } from "./fixtures/vehicles";

/**
 * The tests run against a LOCAL Supabase database (npx supabase start, in backend/) holding the demo
 * data from backend/supabase/seed.sql. Every test starts from that data again (see resetDatabase).
 */

/** The password of every seeded account (staff and the demo customer). */
export const DEMO_PASSWORD = "demo1234";

const root = resolve(__dirname, "..");

/** Settings from the environment, or from frontend/.env.local like the website reads them. */
function setting(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  const file = resolve(root, ".env.local");
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, "utf8")
    .split("\n")
    .find((row) => row.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim();
}

/** The fixed id a fixture id ("cus-01") has in the database: md5 as a uuid, as seed.sql makes it. */
export function fixtureId(id: string): string {
  const hash = createHash("md5").update(id).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`;
}

/** A client with full access, for setting up a test (like staff acting behind the scenes). */
export function adminDb(): SupabaseClient {
  const url = setting("NEXT_PUBLIC_SUPABASE_URL");
  const key = setting("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in frontend/.env.local (see e2e/README.md).");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** The local Supabase database. Refuses anything else, so the tests can never wipe a real project. */
const DB_URL = process.env.E2E_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
if (!/@(127\.0\.0\.1|localhost)[:/]/.test(DB_URL)) {
  throw new Error(`E2E_DB_URL must point at a local database, not ${DB_URL.replace(/:[^:@/]*@/, ":***@")}`);
}

let sql: postgres.Sql | null = null;
const database = () => (sql ??= postgres(DB_URL, { max: 1, onnotice: () => {} }));

const SEED = readFileSync(resolve(root, "../backend/supabase/seed.sql"), "utf8");

/**
 * Puts the demo data back: empties every table the website writes to, removes every sign-in account,
 * restores the vehicles' original prices, and loads seed.sql again. Takes a fraction of a second.
 */
export async function resetDatabase(): Promise<void> {
  const vehicles = seedVehicles.map((v) => `(${quote(v.slug)}, ${v.pricePerDay}, ${quote(v.status)}::public.vehicle_status, ${v.featured})`);
  await database().unsafe(`
    truncate public.reviews, public.payments, public.booking_documents, public.bookings, public.tasks,
      public.activities, public.contact_details, public.leads, public.customers cascade;
    -- Truncate, not delete: deleting the accounts would trip the "one active staff account" rule.
    truncate auth.users cascade;
    update public.vehicles v set price_per_day = x.price, status = x.status, featured = x.featured
      from (values ${vehicles.join(", ")}) as x(slug, price, status, featured)
      where v.slug = x.slug;
    ${SEED}
  `);
}

const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;

/** Runs SQL against the local database (for setting up an unusual state in a test). */
export async function runSql<T extends object = Record<string, unknown>>(query: string): Promise<T[]> {
  return (await database().unsafe(query)) as unknown as T[];
}
