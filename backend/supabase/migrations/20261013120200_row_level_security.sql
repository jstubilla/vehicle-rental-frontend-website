-- Row-level security.
--
-- Who may see and change what, enforced by Postgres for every request made with the public (anon) key
-- or a signed-in user's token. The service-role key bypasses all of this, so it must only ever be
-- used on a server.
--
--   * Website visitors (anon) may read the vehicle catalog and the settings, nothing else directly.
--     Everything they send (booking requests, the contact form, reviews) goes through the functions
--     in the next migration, which check their input.
--   * A signed-in website customer may read and update their own profile, and read their own bookings
--     and payments (those made with their confirmed email address).
--   * Active staff may read and change everything. Every staff member is an admin.

alter table public.settings enable row level security;
alter table public.vehicles enable row level security;
alter table public.staff enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.leads enable row level security;
alter table public.contact_details enable row level security;
alter table public.activities enable row level security;
alter table public.tasks enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_documents enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;

-- The CRM customer ids that belong to the signed-in website account: customers with the account's
-- email, and only once that email is confirmed (so nobody can sign up with someone else's address
-- and see their bookings).
create function public.current_customer_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id
  from public.customers c
  join auth.users u on u.email is not null and lower(u.email) = c.email
  where u.id = (select auth.uid())
    and u.email_confirmed_at is not null;
$$;

-- ---------------------------------------------------------------------------
-- Staff: full access to every table.
-- ---------------------------------------------------------------------------

create policy "Staff manage settings" on public.settings
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff manage vehicles" on public.vehicles
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff manage staff" on public.staff
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff read profiles" on public.profiles
  for select to authenticated using ((select public.is_staff()));
create policy "Staff manage customers" on public.customers
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff manage leads" on public.leads
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff manage contact details" on public.contact_details
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff manage activities" on public.activities
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff manage tasks" on public.tasks
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff manage bookings" on public.bookings
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff manage booking documents" on public.booking_documents
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff manage payments" on public.payments
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "Staff manage reviews" on public.reviews
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Everyone: the public catalog and the business-wide rates.
-- ---------------------------------------------------------------------------

create policy "Anyone reads the settings" on public.settings
  for select to anon, authenticated using (true);

-- Inactive vehicle types are hidden from the website (staff still see them through their own policy).
create policy "Anyone reads listed vehicles" on public.vehicles
  for select to anon, authenticated using (status <> 'inactive');

-- ---------------------------------------------------------------------------
-- Signed-in website customers: their own profile, bookings and payments.
-- Booking documents are never readable by customers once sent.
-- ---------------------------------------------------------------------------

create policy "Customers read their own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Customers update their own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Customers read their own bookings" on public.bookings
  for select to authenticated using (customer_id in (select public.current_customer_ids()));
create policy "Customers read their own payments" on public.payments
  for select to authenticated
  using (booking_id in (select b.id from public.bookings b where b.customer_id in (select public.current_customer_ids())));
