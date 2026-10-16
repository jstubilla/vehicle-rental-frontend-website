-- Table and function privileges for the website's roles, granted explicitly.
--
-- Newer Supabase projects no longer give anon, authenticated and service_role access to tables that
-- migrations create (Project Settings -> Data API, "automatically expose new tables"). Without these
-- grants every request fails with "permission denied for table ...". Granting a role access to a
-- table does not open it up: row-level security (…_row_level_security.sql) still decides which rows
-- each role may see and change.
--
-- Every new table or function needs its grants added in its own migration, the same way.

grant usage on schema public to anon, authenticated, service_role;

-- Start from nothing, whatever the project's defaults gave (older Supabase projects give these roles
-- every right on every table, including TRUNCATE, which would ignore row-level security), then grant
-- only what the website uses.
revoke all on all tables in schema public from anon, authenticated;

-- Visitors (anon key, not signed in): only the public catalog and the business-wide rates.
-- Everything else they do goes through the security-definer functions granted below.
grant select on public.vehicles, public.settings to anon;

-- Signed-in users (staff and website customers). Row-level security limits customers to their own
-- profile, bookings and payments, and gives active staff everything.
grant select, insert, update, delete on
  public.settings,
  public.vehicles,
  public.staff,
  public.profiles,
  public.customers,
  public.leads,
  public.contact_details,
  public.activities,
  public.tasks,
  public.bookings,
  public.booking_documents,
  public.payments,
  public.reviews
to authenticated;

-- The server (service-role key: payments and staff invitations). It bypasses row-level security.
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Helpers that row-level security policies and triggers call with the caller's rights.
grant execute on function
  public.is_staff(),
  public.current_customer_ids()
to anon, authenticated;
grant execute on function
  public.manila_today(),
  public.rental_days(date, time, date, time),
  public.offers_driver(public.vehicle_category),
  public.booking_transition_allowed(public.booking_status, public.booking_status),
  public.payment_deadline(public.bookings),
  public.generate_booking_reference()
to authenticated;

-- The website's functions (the same list as in …_public_functions.sql, repeated so it holds even
-- where new functions are not callable by default).
grant execute on function
  public.list_published_reviews(),
  public.submit_review(text, integer, text, text),
  public.submit_inquiry(text, text, text, uuid, text),
  public.create_booking_request(uuid, text, text, date, time, date, time, boolean, text, text, text, text, text, jsonb, integer),
  public.get_booking_by_reference(text),
  public.get_own_booking(text, text),
  public.cancel_own_booking(text, text, text),
  public.resubmit_documents(text, text, jsonb)
to anon, authenticated;


-- Supabase's own helper that switches on row-level security for new tables (where the project has it)
-- runs as an event trigger, never through the API.
do $$
begin
  if exists (
    select 1 from pg_proc where proname = 'rls_auto_enable' and pronamespace = 'public'::regnamespace
  ) then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;
