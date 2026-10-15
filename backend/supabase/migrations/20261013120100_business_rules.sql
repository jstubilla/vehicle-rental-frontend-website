-- Business rules the database enforces itself, whoever writes the data (staff screens, the public
-- functions, a server using the service-role key). They repeat the rules in frontend/src/lib and
-- frontend/src/api, which only run in the browser today.
--
-- Errors: a broken rule raises an exception whose MESSAGE is one of the front end's ApiErrorCode values
-- (frontend/src/api/client.ts), e.g. 'invalid_transition', so src/api can map it straight to an ApiError.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Is the signed-in user an active staff member? Used by the row-level security policies.
-- security definer so it can read staff even where the caller cannot.
create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff where id = (select auth.uid()) and active);
$$;

-- Today's date in Manila (the business time zone).
create function public.manila_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Manila')::date;
$$;

-- Rentals are charged in 24-hour blocks, rounded up, minimum 1 (frontend/src/lib/rental.ts).
-- e.g. Mon 10:00 to Wed 11:00 = 2 days and 1 hour = 3 days.
create function public.rental_days(pickup_date date, pickup_time time, return_date date, return_time time)
returns integer
language sql
immutable
set search_path = ''
as $$
  select greatest(1, ceil(extract(epoch from ((return_date + return_time) - (pickup_date + pickup_time))) / 86400.0)::integer);
$$;

-- Motorcycles are always "Vehicle only"; cars and vans can come with a driver (frontend/src/lib/pricing.ts).
create function public.offers_driver(category public.vehicle_category)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select category not in ('125cc', '150cc');
$$;

-- ---------------------------------------------------------------------------
-- Emails are stored trimmed and lower-cased, so "Ana@Example.com " and "ana@example.com" are the same person.
-- ---------------------------------------------------------------------------

create function public.normalize_email()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.email := lower(trim(new.email));
  return new;
end;
$$;

create trigger staff_normalize_email before insert or update of email on public.staff
  for each row execute function public.normalize_email();
create trigger customers_normalize_email before insert or update of email on public.customers
  for each row execute function public.normalize_email();
create trigger leads_normalize_email before insert or update of email on public.leads
  for each row execute function public.normalize_email();

-- ---------------------------------------------------------------------------
-- Profiles: one per auth user, created at sign-up.
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Staff: nobody can deactivate themselves, and at least one account must stay active.
-- ---------------------------------------------------------------------------

create function public.staff_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.active and not new.active and new.id = (select auth.uid()) then
    raise exception 'self_deactivate' using detail = 'You cannot deactivate yourself.';
  end if;
  return new;
end;
$$;

create trigger staff_before_update before update on public.staff
  for each row execute function public.staff_before_update();

create function public.staff_keep_one_active()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.staff where active) then
    raise exception 'last_admin' using detail = 'At least one account must stay active.';
  end if;
  return null;
end;
$$;

-- Statement-level, so a change that touches several rows is judged on the end result.
create trigger staff_keep_one_active after update or delete on public.staff
  for each statement execute function public.staff_keep_one_active();

-- ---------------------------------------------------------------------------
-- Customers with bookings cannot be deleted (their bookings would lose their owner).
-- ---------------------------------------------------------------------------

create function public.customers_before_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.bookings where customer_id = old.id) then
    raise exception 'has_bookings' using detail = 'This customer has bookings.';
  end if;
  return old;
end;
$$;

create trigger customers_before_delete before delete on public.customers
  for each row execute function public.customers_before_delete();

-- ---------------------------------------------------------------------------
-- Tasks: completed_at follows the status.
-- ---------------------------------------------------------------------------

create function public.tasks_sync_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'done' then
    new.completed_at := coalesce(new.completed_at, now());
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger tasks_sync_completed_at before insert or update of status, completed_at on public.tasks
  for each row execute function public.tasks_sync_completed_at();

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------

-- No 0/O/1/I, so references are easy to read out over the phone.
create function public.generate_booking_reference()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
begin
  loop
    candidate := 'RC-';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
    end loop;
    exit when not exists (select 1 from public.bookings where reference = candidate);
  end loop;
  return candidate;
end;
$$;

create function public.bookings_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.reference is null then
    new.reference := public.generate_booking_reference();
  end if;
  return new;
end;
$$;

create trigger bookings_before_insert before insert on public.bookings
  for each row execute function public.bookings_before_insert();

-- The booking status flow (frontend/src/lib/booking-status.ts), plus the two moves the system makes:
-- pending -> approved when staff verify the documents, approved -> confirmed when the customer pays.
--   pending   -> approved, confirmed (older bookings without documents only), cancelled
--   approved  -> confirmed, cancelled
--   confirmed -> active, cancelled
--   active    -> completed
--   completed, cancelled: final
create function public.booking_transition_allowed(from_status public.booking_status, to_status public.booking_status)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case from_status
    when 'pending' then to_status in ('approved', 'confirmed', 'cancelled')
    when 'approved' then to_status in ('confirmed', 'cancelled')
    when 'confirmed' then to_status in ('active', 'cancelled')
    when 'active' then to_status = 'completed'
    else false
  end;
$$;

create function public.bookings_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- The price is locked when the booking is made.
  if (new.customer_id, new.vehicle_id, new.reference, new.pickup_date, new.pickup_time, new.return_date,
      new.return_time, new.days, new.daily_rate, new.vehicle_total, new.with_driver, new.driver_rate,
      new.driver_total, new.total, new.created_at)
     is distinct from
     (old.customer_id, old.vehicle_id, old.reference, old.pickup_date, old.pickup_time, old.return_date,
      old.return_time, old.days, old.daily_rate, old.vehicle_total, old.with_driver, old.driver_rate,
      old.driver_total, old.total, old.created_at) then
    raise exception 'invalid_transition' using detail = 'A booking''s vehicle, dates and price cannot be changed.';
  end if;

  -- Documents are checked once, while the booking is pending. Verifying them approves the booking;
  -- rejected ones go back to pending only when the customer sends new photos.
  if new.documents_status is distinct from old.documents_status then
    if old.status <> 'pending' or (old.documents_status is distinct from 'pending' and new.documents_status is distinct from 'pending') then
      raise exception 'invalid_transition' using detail = 'These documents have already been checked.';
    end if;
    if new.documents_status = 'verified' and new.status = 'pending' then
      new.status := 'approved';
    end if;
    if new.documents_status = 'rejected' then
      if new.rejection_reason is null or length(trim(new.rejection_reason)) = 0 then
        raise exception 'invalid_transition' using detail = 'Give the customer a reason for rejecting the documents.';
      end if;
    else
      new.rejection_reason := null;
    end if;
  end if;

  if new.status is distinct from old.status then
    if not public.booking_transition_allowed(old.status, new.status) then
      raise exception 'invalid_transition'
        using detail = format('A booking cannot move from %s to %s.', old.status, new.status);
    end if;

    -- Approved only by verifying the documents.
    if new.status = 'approved' then
      if new.documents_status is distinct from 'verified' then
        raise exception 'invalid_transition' using detail = 'Verify the documents to approve a booking.';
      end if;
      new.approved_at := coalesce(new.approved_at, now());
    end if;

    -- A booking with documents is confirmed only when the customer pays (after approval).
    if old.status = 'pending' and new.status = 'confirmed'
       and exists (select 1 from public.booking_documents where booking_id = new.id) then
      raise exception 'invalid_transition' using detail = 'This booking is confirmed when the customer pays.';
    end if;

    if new.status = 'cancelled' then
      new.cancelled_at := coalesce(new.cancelled_at, now());
      new.cancelled_by := coalesce(new.cancelled_by, 'staff');
    end if;
  end if;

  return new;
end;
$$;

create trigger bookings_before_update before update on public.bookings
  for each row execute function public.bookings_before_update();

-- When an approved booking must be paid by, or null if it was never approved.
create function public.payment_deadline(booking public.bookings)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select booking.approved_at + make_interval(hours => (select payment_deadline_hours from public.settings));
$$;

-- Cancels approved bookings that were not paid before the deadline. Scheduled below with pg_cron.
create function public.cancel_overdue_bookings()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  cancelled_count integer;
begin
  with overdue as (
    update public.bookings b
    set status = 'cancelled',
        cancelled_by = 'system',
        cancellation_reason = 'Not paid before the payment deadline.'
    where b.status = 'approved'
      and not exists (select 1 from public.payments p where p.booking_id = b.id)
      and public.payment_deadline(b) < now()
    returning b.id, b.customer_id, b.reference
  ), logged as (
    insert into public.activities (type, body, customer_id)
    select 'status_change', format('Booking %s cancelled: not paid before the payment deadline.', reference), customer_id
    from overdue
  )
  select count(*) into cancelled_count from overdue;
  return cancelled_count;
end;
$$;

-- Run it every 15 minutes where pg_cron is available (it is on hosted Supabase; enable it under
-- Database -> Extensions if this step is skipped).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('cancel-overdue-bookings', '*/15 * * * *', 'select public.cancel_overdue_bookings()');
  end if;
end;
$$;
