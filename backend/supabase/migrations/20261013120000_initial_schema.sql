-- Initial schema for the car rental site.
--
-- Mirrors the data the front end works with today (frontend/src/types/index.ts and
-- frontend/src/lib/constants.ts). Conventions:
--   * Columns are snake_case; the front end's src/api layer maps them to its camelCase types.
--   * Enum values are spelled exactly as in frontend/src/lib/constants.ts, so no mapping is needed.
--   * Money is whole Philippine pesos (integer). Timestamps are timestamptz; rental dates and times
--     are Manila wall-clock values (date + time), as the visitor typed them.
--   * Emails are stored trimmed and lower-cased (see the normalize_email trigger in the next migration).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.vehicle_category as enum ('suv', 'mpv', 'sedan', 'hatchback', 'van', 'pickup', '125cc', '150cc');
create type public.vehicle_status as enum ('available', 'maintenance', 'inactive');
create type public.lead_stage as enum ('new', 'contacted', 'qualified', 'won', 'lost');
create type public.lead_source as enum ('website', 'phone', 'walk_in', 'facebook', 'referral');
create type public.activity_type as enum ('note', 'call', 'status_change');
-- pending = documents waiting for staff; approved = documents verified, waiting for payment; confirmed = paid.
create type public.booking_status as enum ('pending', 'approved', 'confirmed', 'active', 'completed', 'cancelled');
create type public.payment_method as enum ('card', 'gcash', 'maya', 'paypal', 'wise', 'pay_at_pickup');
create type public.payment_status as enum ('pending', 'processing', 'paid', 'failed');
create type public.document_kind as enum ('validId', 'proofOfBilling', 'driversLicense');
create type public.document_status as enum ('pending', 'verified', 'rejected');
create type public.contact_type as enum ('phone', 'email');
create type public.task_status as enum ('open', 'done');

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Settings: the business-wide rates that used to be constants in frontend/src/lib.
-- A single row (id is always true).
-- ---------------------------------------------------------------------------

create table public.settings (
  id boolean primary key default true check (id),
  -- "With a driver", per rental day (DRIVER_DAILY_RATE).
  driver_daily_rate integer not null check (driver_daily_rate >= 0),
  -- "Pay at pick-up": share of the total charged online as a down payment (DOWN_PAYMENT_RATE).
  down_payment_rate numeric(4, 3) not null check (down_payment_rate > 0 and down_payment_rate <= 1),
  -- Hours the customer has to pay once staff approve their documents (PAYMENT_DEADLINE_HOURS).
  payment_deadline_hours integer not null check (payment_deadline_hours > 0),
  updated_at timestamptz not null default now()
);

create trigger settings_set_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Vehicles: a TYPE of vehicle (not one particular car).
-- ---------------------------------------------------------------------------

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (length(trim(name)) > 0),
  category public.vehicle_category not null,
  -- What a customer can expect, e.g. "Toyota Vios or similar".
  examples text not null default '',
  -- The most people it seats. Motorcycles don't carry a seat count; every other type must.
  seats integer check (seats > 0),
  -- Flat daily rate. Bookings keep their own copy, so changing it only affects new bookings.
  price_per_day integer not null check (price_per_day > 0),
  status public.vehicle_status not null default 'available',
  featured boolean not null default false,
  -- ImageAsset[] from frontend/src/assets/config.ts: { src, alt, label, ratio, credit? }.
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  -- Order in which the catalog lists the types.
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_seats_required check (category in ('125cc', '150cc') or seats is not null)
);

create trigger vehicles_set_updated_at before update on public.vehicles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------

-- Staff accounts. Every active staff member is an admin; there are no roles.
-- Sign-in itself is Supabase Auth: a staff row shares its id with the auth user.
create table public.staff (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- A website visitor's account (sign-up / log-in on the public site), separate from the CRM customer
-- list. Passwords, email codes and Google/Apple sign-in are handled by Supabase Auth; the email lives
-- on auth.users. Created automatically for every new auth user (see handle_new_user).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  -- Saved from the last booking, so the next one can be filled in.
  phone text not null default '',
  license_number text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- The CRM customer list. A booking reuses the customer with the same email, or creates one.
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  email text not null unique,
  phone text not null default '',
  license_number text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger customers_set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  email text not null default '',
  phone text not null default '',
  source public.lead_source not null default 'website',
  stage public.lead_stage not null default 'new',
  -- The vehicle type the person asked about, if any.
  vehicle_interest uuid references public.vehicles (id) on delete set null,
  message text not null default '',
  assignee_id uuid references public.staff (id) on delete set null,
  -- Set when the lead is converted to a customer.
  customer_id uuid references public.customers (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_stage_idx on public.leads (stage);
create index leads_assignee_id_idx on public.leads (assignee_id);
create index leads_customer_id_idx on public.leads (customer_id);
create index leads_vehicle_interest_idx on public.leads (vehicle_interest);

create trigger leads_set_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- Extra phone numbers and emails for a customer or a lead (the main ones are on the record itself).
-- Replaces the additionalContacts arrays in the mock data.
create table public.contact_details (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete cascade,
  type public.contact_type not null,
  value text not null check (length(trim(value)) > 0),
  -- e.g. "Office", "Assistant", "Personal".
  label text not null default '',
  created_at timestamptz not null default now(),
  constraint contact_details_one_owner check (num_nonnulls(customer_id, lead_id) = 1)
);

create index contact_details_customer_id_idx on public.contact_details (customer_id);
create index contact_details_lead_id_idx on public.contact_details (lead_id);

-- The activity log on a customer or a lead. Deleted together with its customer or lead.
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  type public.activity_type not null default 'note',
  body text not null,
  customer_id uuid references public.customers (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete cascade,
  -- null = written by the system (e.g. a website form).
  author_id uuid references public.staff (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint activities_one_subject check (num_nonnulls(customer_id, lead_id) = 1)
);

create index activities_customer_id_idx on public.activities (customer_id, created_at desc);
create index activities_lead_id_idx on public.activities (lead_id, created_at desc);
create index activities_author_id_idx on public.activities (author_id);

-- A to-do or follow-up, optionally linked to a lead or a customer.
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  notes text not null default '',
  due_date date not null,
  assignee_id uuid references public.staff (id) on delete set null,
  status public.task_status not null default 'open',
  lead_id uuid references public.leads (id) on delete set null,
  customer_id uuid references public.customers (id) on delete set null,
  created_at timestamptz not null default now(),
  -- Set and cleared automatically when the status changes (see tasks_sync_completed_at).
  completed_at timestamptz,
  constraint tasks_at_most_one_link check (num_nonnulls(lead_id, customer_id) <= 1)
);

create index tasks_status_due_date_idx on public.tasks (status, due_date);
create index tasks_assignee_id_idx on public.tasks (assignee_id);
create index tasks_lead_id_idx on public.tasks (lead_id);
create index tasks_customer_id_idx on public.tasks (customer_id);

-- ---------------------------------------------------------------------------
-- Bookings and money
-- ---------------------------------------------------------------------------

-- A booking keeps its own copy of the price it was made at (the rates and totals below), so a later
-- rate change never alters it. The price columns cannot be changed after insert.
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  -- Customer-facing code, e.g. "RC-K7M2QA". Generated on insert (see bookings_before_insert).
  reference text not null unique check (reference ~ '^RC-[A-HJ-NP-Z2-9]{6}$'),
  customer_id uuid not null references public.customers (id) on delete restrict,
  vehicle_id uuid not null references public.vehicles (id) on delete restrict,
  -- Wherever the visitor typed or pasted (an address or a Google Maps link). No preset list.
  pickup_location text not null check (length(trim(pickup_location)) > 0),
  return_location text not null check (length(trim(return_location)) > 0),
  pickup_date date not null,
  pickup_time time not null,
  return_date date not null,
  return_time time not null,
  days integer not null check (days >= 1),
  daily_rate integer not null check (daily_rate > 0),
  vehicle_total integer not null,
  -- "With a driver" (true) or "Vehicle only" (false).
  with_driver boolean not null default false,
  -- The driver's daily rate at booking time (0 for "Vehicle only").
  driver_rate integer not null default 0 check (driver_rate >= 0),
  driver_total integer not null default 0,
  total integer not null,
  status public.booking_status not null default 'pending',
  -- Staff check the customer's documents (booking_documents) before the booking can be paid.
  -- null for older bookings made before documents were asked for.
  documents_status public.document_status,
  -- Why staff rejected the documents; shown to the customer so they can send new photos.
  rejection_reason text,
  -- When staff approved the documents. The customer must pay within settings.payment_deadline_hours.
  approved_at timestamptz,
  -- Set when the booking was cancelled.
  cancelled_by text check (cancelled_by in ('customer', 'staff', 'system')),
  cancellation_reason text,
  cancelled_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_return_after_pickup check ((return_date + return_time) > (pickup_date + pickup_time)),
  constraint bookings_price_adds_up check (
    vehicle_total = daily_rate * days
    and driver_total = driver_rate * days
    and total = vehicle_total + driver_total
  ),
  constraint bookings_driver_rate_only_with_driver check (with_driver or driver_rate = 0)
);

create index bookings_customer_id_idx on public.bookings (customer_id);
create index bookings_vehicle_id_idx on public.bookings (vehicle_id);
create index bookings_status_idx on public.bookings (status);
create index bookings_pickup_date_idx on public.bookings (pickup_date);
create index bookings_created_at_idx on public.bookings (created_at desc);

create trigger bookings_set_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- The photos a customer sends with a booking (valid ID, proof of billing, driver's license).
-- The files live in the private "booking-documents" Storage bucket; only the object path is kept here.
create table public.booking_documents (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  kind public.document_kind not null,
  -- Path inside the booking-documents bucket, e.g. "uploads/<uuid>/validId.jpg".
  storage_path text not null unique,
  file_name text not null default '',
  uploaded_at timestamptz not null default now(),
  unique (booking_id, kind)
);

-- A payment record: a method, an amount and the payment provider's reference.
-- Card numbers are never collected or stored.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete restrict,
  method public.payment_method not null,
  -- Always the booking's full total, also for "Pay at pick-up".
  amount integer not null check (amount > 0),
  -- "Pay at pick-up" stays pending until staff record the balance at pick-up.
  status public.payment_status not null default 'pending',
  -- Reference from the payment provider.
  provider_ref text,
  -- "Pay at pick-up" only: the down payment charged online when paying for the booking.
  down_payment_method public.payment_method,
  down_payment_amount integer check (down_payment_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_down_payment_pair check ((down_payment_method is null) = (down_payment_amount is null)),
  constraint payments_down_payment_only_at_pickup check (method = 'pay_at_pickup' or down_payment_method is null),
  constraint payments_down_payment_is_online check (down_payment_method is distinct from 'pay_at_pickup'),
  constraint payments_down_payment_below_total check (down_payment_amount is null or down_payment_amount <= amount)
);

create trigger payments_set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- A customer's review of the overall service. Private until staff publish it.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '',
  -- The booking reference the customer gave. Only staff can see it.
  booking_reference text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create index reviews_published_created_at_idx on public.reviews (published, created_at desc);
