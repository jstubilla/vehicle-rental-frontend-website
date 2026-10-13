-- Functions the public website calls (supabase.rpc(...)), replacing the mock versions in frontend/src/api.
--
-- Website visitors cannot write to any table directly (see the row-level security migration). These
-- functions run with the owner's rights (security definer), check everything the visitor sends, work
-- out prices on the server from the current rates (never trusting the browser), and return only what
-- the visitor is allowed to see. Errors use the front end's ApiErrorCode values as their message.
--
-- Results are JSON with snake_case keys, the same column names as the tables.

-- ---------------------------------------------------------------------------
-- Internal helpers (not callable by visitors; see the grants at the end)
-- ---------------------------------------------------------------------------

-- Trims a required text value and checks its length.
create function public.require_text(value text, field text, max_length integer default 500)
returns text
language plpgsql
immutable
set search_path = ''
as $$
begin
  if value is null or length(trim(value)) = 0 then
    raise exception 'invalid_input' using detail = format('%s is required.', field);
  end if;
  if length(trim(value)) > max_length then
    raise exception 'invalid_input' using detail = format('%s is too long (at most %s characters).', field, max_length);
  end if;
  return trim(value);
end;
$$;

create function public.require_email(value text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_email text := lower(public.require_text(value, 'Email', 254));
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_input' using detail = 'Email is not a valid email address.';
  end if;
  return v_email;
end;
$$;

-- A booking with its vehicle, customer and payment, as the website shows it. Never includes the
-- customer's document photos. With include_contact = false the customer is reduced to their name
-- (for the status page, which anyone with the reference can open).
create function public.booking_details(booking_id uuid, include_contact boolean)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'booking', to_jsonb(b) || jsonb_build_object('payment_deadline', public.payment_deadline(b)),
    'vehicle', to_jsonb(v),
    'customer', case
      when include_contact then to_jsonb(c)
      else jsonb_build_object('id', c.id, 'name', c.name)
    end,
    'payment', to_jsonb(p)
  )
  from public.bookings b
  join public.vehicles v on v.id = b.vehicle_id
  join public.customers c on c.id = b.customer_id
  left join public.payments p on p.booking_id = b.id
  where b.id = booking_details.booking_id;
$$;

-- Finds a booking by reference, but only for the person who made it (their email must match).
-- The same error whether the reference or the email is wrong, so nobody can probe for bookings.
create function public.find_own_booking(reference text, email text)
returns public.bookings
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
begin
  select b.* into v_booking
  from public.bookings b
  join public.customers c on c.id = b.customer_id
  where b.reference = upper(trim(find_own_booking.reference))
    and c.email = lower(trim(find_own_booking.email));
  if not found then
    raise exception 'not_found' using detail = 'Booking not found.';
  end if;
  return v_booking;
end;
$$;

-- Checks the three document photos a visitor uploaded to the booking-documents bucket and stores them
-- on the booking, replacing any earlier ones. documents is
--   { "validId": { "path": "uploads/<uuid>/validId.jpg", "fileName": "id.jpg" }, "proofOfBilling": {...}, "driversLicense": {...} }
create function public.attach_booking_documents(booking_id uuid, documents jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_kind public.document_kind;
  v_path text;
begin
  if attach_booking_documents.documents is null or jsonb_typeof(attach_booking_documents.documents) <> 'object' then
    raise exception 'invalid_input' using detail = 'Documents are required.';
  end if;

  delete from public.booking_documents d where d.booking_id = attach_booking_documents.booking_id;

  foreach v_kind in array enum_range(null::public.document_kind) loop
    v_path := attach_booking_documents.documents -> v_kind::text ->> 'path';
    if v_path is null or v_path !~ '^uploads/[0-9a-f-]{36}/[A-Za-z0-9._-]+$' then
      raise exception 'invalid_input' using detail = format('The %s photo is missing.', v_kind);
    end if;
    if not exists (select 1 from storage.objects o where o.bucket_id = 'booking-documents' and o.name = v_path) then
      raise exception 'invalid_input' using detail = format('The %s photo was not uploaded.', v_kind);
    end if;
    if exists (select 1 from public.booking_documents d where d.storage_path = v_path) then
      raise exception 'invalid_input' using detail = format('The %s photo belongs to another booking.', v_kind);
    end if;
    insert into public.booking_documents (booking_id, kind, storage_path, file_name)
    values (
      attach_booking_documents.booking_id,
      v_kind,
      v_path,
      left(coalesce(attach_booking_documents.documents -> v_kind::text ->> 'fileName', ''), 255)
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Catalog and reviews
-- ---------------------------------------------------------------------------

-- The reviews staff chose to show, newest first. Nothing private (like the booking reference).
create function public.list_published_reviews()
returns table (id uuid, name text, rating smallint, comment text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.name, r.rating, r.comment, r.created_at
  from public.reviews r
  where r.published
  order by r.created_at desc;
$$;

-- Saves a customer's review, private until staff publish it. The booking reference must exist.
create function public.submit_review(name text, rating integer, comment text, booking_reference text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reference text := upper(trim(coalesce(submit_review.booking_reference, '')));
begin
  if submit_review.rating is null or submit_review.rating not between 1 and 5 then
    raise exception 'invalid_input' using detail = 'Rating must be 1 to 5 stars.';
  end if;
  if not exists (select 1 from public.bookings b where b.reference = v_reference) then
    raise exception 'unknown_booking' using detail = 'Booking reference not found.';
  end if;

  insert into public.reviews (name, rating, comment, booking_reference)
  values (
    public.require_text(submit_review.name, 'Name', 200),
    submit_review.rating,
    public.require_text(submit_review.comment, 'Comment', 4000),
    v_reference
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Contact form
-- ---------------------------------------------------------------------------

-- Every inquiry becomes a "New" lead in the CRM plus an activity note, so staff see it on the dashboard.
create function public.submit_inquiry(name text, email text, phone text, vehicle_id uuid, message text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead_id uuid;
  v_message text := public.require_text(submit_inquiry.message, 'Message', 4000);
  v_vehicle_id uuid := submit_inquiry.vehicle_id;
begin
  if not exists (select 1 from public.vehicles v where v.id = v_vehicle_id) then
    v_vehicle_id := null;
  end if;

  insert into public.leads (name, email, phone, source, stage, vehicle_interest, message)
  values (
    public.require_text(submit_inquiry.name, 'Name', 200),
    public.require_email(submit_inquiry.email),
    left(trim(coalesce(submit_inquiry.phone, '')), 50),
    'website',
    'new',
    v_vehicle_id,
    v_message
  )
  returning id into v_lead_id;

  insert into public.activities (type, body, lead_id)
  values ('note', format('Website inquiry received: "%s"', v_message), v_lead_id);

  return v_lead_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------

-- Sends a booking request. Nothing is charged: staff check the customer's documents first, and once
-- they approve them the customer pays (record_booking_payment, called by the payment server).
--
-- The price is worked out here from the vehicle's CURRENT rate and stored on the booking, where it is
-- locked. expected_total is the total the visitor was shown: if it no longer matches, nothing is
-- booked and 'price_changed' is raised so the visitor can check again.
create function public.create_booking_request(
  vehicle_id uuid,
  pickup_location text,
  return_location text,
  pickup_date date,
  pickup_time time,
  return_date date,
  return_time time,
  with_driver boolean,
  customer_name text,
  customer_email text,
  customer_phone text,
  license_number text,
  notes text,
  documents jsonb,
  expected_total integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vehicle public.vehicles;
  v_settings public.settings;
  v_email text := public.require_email(create_booking_request.customer_email);
  v_phone text := public.require_text(create_booking_request.customer_phone, 'Phone', 50);
  v_license text := public.require_text(create_booking_request.license_number, 'Driver''s license number', 50);
  v_days integer;
  v_with_driver boolean;
  v_driver_rate integer;
  v_total integer;
  v_customer_id uuid;
  v_booking public.bookings;
begin
  select * into v_vehicle from public.vehicles v where v.id = create_booking_request.vehicle_id;
  -- Only a vehicle's own status stops it being booked; there is no availability check by date.
  if not found or v_vehicle.status <> 'available' then
    raise exception 'not_found' using detail = 'This vehicle cannot be booked.';
  end if;

  if create_booking_request.pickup_date is null or create_booking_request.pickup_time is null
     or create_booking_request.return_date is null or create_booking_request.return_time is null then
    raise exception 'invalid_input' using detail = 'Pick-up and return dates and times are required.';
  end if;
  if create_booking_request.pickup_date < public.manila_today() then
    raise exception 'invalid_input' using detail = 'The pick-up date is in the past.';
  end if;
  if (create_booking_request.return_date + create_booking_request.return_time)
     <= (create_booking_request.pickup_date + create_booking_request.pickup_time) then
    raise exception 'invalid_input' using detail = 'The return must come after the pick-up.';
  end if;

  select * into v_settings from public.settings;
  v_days := public.rental_days(
    create_booking_request.pickup_date, create_booking_request.pickup_time,
    create_booking_request.return_date, create_booking_request.return_time
  );
  v_with_driver := coalesce(create_booking_request.with_driver, false) and public.offers_driver(v_vehicle.category);
  v_driver_rate := case when v_with_driver then v_settings.driver_daily_rate else 0 end;
  v_total := (v_vehicle.price_per_day + v_driver_rate) * v_days;

  if create_booking_request.expected_total is distinct from v_total then
    raise exception 'price_changed' using detail = 'The price has changed.';
  end if;

  -- Reuse the customer if this email is already known (updating their phone and license); otherwise create one.
  insert into public.customers as c (name, email, phone, license_number)
  values (public.require_text(create_booking_request.customer_name, 'Name', 200), v_email, v_phone, v_license)
  on conflict on constraint customers_email_key
    do update set phone = excluded.phone, license_number = excluded.license_number
  returning c.id into v_customer_id;

  insert into public.bookings (
    customer_id, vehicle_id, pickup_location, return_location, pickup_date, pickup_time, return_date,
    return_time, days, daily_rate, vehicle_total, with_driver, driver_rate, driver_total, total, status,
    documents_status, notes
  )
  values (
    v_customer_id,
    v_vehicle.id,
    public.require_text(create_booking_request.pickup_location, 'Pick-up location', 1000),
    public.require_text(create_booking_request.return_location, 'Return location', 1000),
    create_booking_request.pickup_date,
    create_booking_request.pickup_time,
    create_booking_request.return_date,
    create_booking_request.return_time,
    v_days,
    v_vehicle.price_per_day,
    v_vehicle.price_per_day * v_days,
    v_with_driver,
    v_driver_rate,
    v_driver_rate * v_days,
    v_total,
    'pending',
    'pending',
    left(trim(coalesce(create_booking_request.notes, '')), 4000)
  )
  returning * into v_booking;

  perform public.attach_booking_documents(v_booking.id, create_booking_request.documents);

  insert into public.activities (type, body, customer_id)
  values ('note', format('Booking request %s sent online for %s.', v_booking.reference, v_vehicle.name), v_customer_id);

  -- A signed-in website customer gets these details filled in next time.
  update public.profiles p set phone = v_phone, license_number = v_license
  where p.id = (select auth.uid());

  -- EMAIL TRIGGER GOES HERE (e.g. a database webhook to an edge function): requestReceivedEmail to the
  -- customer and staffNewRequestEmail to the company inbox (templates in frontend/src/emails).
  return public.booking_details(v_booking.id, true);
end;
$$;

-- The status page shown right after sending the request: anyone with the reference can open it, so
-- it shows the booking, vehicle and payment but only the customer's name. Returns null if not found.
create function public.get_booking_by_reference(reference text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.booking_details(b.id, false)
  from public.bookings b
  where b.reference = upper(trim(get_booking_by_reference.reference));
$$;

-- The customer's own booking, for the pay and new-photos pages. The email is the proof of ownership.
-- (A real link in an email should carry a signed, expiring token instead.)
create function public.get_own_booking(reference text, email text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.booking_details((public.find_own_booking(reference, email)).id, true);
$$;

-- The customer cancels their own booking, giving a reason. Only while nothing has been paid, since
-- there is no refund policy; after that only staff can cancel.
create function public.cancel_own_booking(reference text, email text, reason text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := public.find_own_booking(cancel_own_booking.reference, cancel_own_booking.email);
  v_reason text := public.require_text(cancel_own_booking.reason, 'Reason', 2000);
begin
  if v_booking.status not in ('pending', 'approved')
     or exists (select 1 from public.payments p where p.booking_id = v_booking.id) then
    raise exception 'not_cancellable' using detail = 'This booking can no longer be cancelled online.';
  end if;

  update public.bookings b
  set status = 'cancelled', cancelled_by = 'customer', cancellation_reason = v_reason, cancelled_at = now()
  where b.id = v_booking.id;

  insert into public.activities (type, body, customer_id)
  values ('status_change', format('Booking %s cancelled by the customer. Reason: %s', v_booking.reference, v_reason), v_booking.customer_id);

  -- EMAIL TRIGGER GOES HERE: tell the company inbox the customer cancelled, with their reason.
  return public.booking_details(v_booking.id, true);
end;
$$;

-- Sends new document photos after staff rejected the first ones. They go back to staff to check.
create function public.resubmit_documents(reference text, email text, documents jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings := public.find_own_booking(resubmit_documents.reference, resubmit_documents.email);
begin
  if v_booking.status <> 'pending' or v_booking.documents_status is distinct from 'rejected' then
    raise exception 'not_resubmittable' using detail = 'New documents are not needed for this booking.';
  end if;

  perform public.attach_booking_documents(v_booking.id, resubmit_documents.documents);

  update public.bookings b set documents_status = 'pending' where b.id = v_booking.id;

  insert into public.activities (type, body, customer_id)
  values ('note', format('New documents sent for booking %s.', v_booking.reference), v_booking.customer_id);

  -- EMAIL TRIGGER GOES HERE: staffNewRequestEmail (with resent: true) to the company inbox.
  return public.booking_details(v_booking.id, true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Payments (server only)
-- ---------------------------------------------------------------------------

-- Records a successful payment and confirms the booking. Called by the payment server (an edge
-- function or a Next.js route using the service-role key) once the gateway confirms the charge,
-- never by the browser. The amounts come from the booking's locked price.
--   method = 'pay_at_pickup': only the down payment was charged (with down_payment_method); the
--   payment stays pending until staff record the balance at pick-up.
create function public.record_booking_payment(
  booking_id uuid,
  method public.payment_method,
  provider_ref text,
  down_payment_method public.payment_method default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_at_pickup boolean := record_booking_payment.method = 'pay_at_pickup';
  v_down_payment integer;
begin
  select * into v_booking from public.bookings b where b.id = record_booking_payment.booking_id for update;
  if not found then
    raise exception 'not_found' using detail = 'Booking not found.';
  end if;
  if v_booking.status <> 'approved' or exists (select 1 from public.payments p where p.booking_id = v_booking.id) then
    raise exception 'not_payable' using detail = 'This booking cannot be paid.';
  end if;
  if public.payment_deadline(v_booking) < now() then
    raise exception 'payment_overdue' using detail = 'The payment deadline has passed.';
  end if;
  if v_at_pickup and record_booking_payment.down_payment_method is null then
    raise exception 'invalid_input' using detail = 'Pay at pick-up needs an online method for the down payment.';
  end if;

  -- The down payment is rounded up to the peso (frontend/src/lib/pricing.ts, splitDownPayment).
  v_down_payment := ceil(v_booking.total * (select s.down_payment_rate from public.settings s))::integer;

  insert into public.payments (booking_id, method, amount, status, provider_ref, down_payment_method, down_payment_amount)
  values (
    v_booking.id,
    record_booking_payment.method,
    v_booking.total,
    case when v_at_pickup then 'pending'::public.payment_status else 'paid'::public.payment_status end,
    record_booking_payment.provider_ref,
    case when v_at_pickup then record_booking_payment.down_payment_method end,
    case when v_at_pickup then v_down_payment end
  );

  update public.bookings b set status = 'confirmed' where b.id = v_booking.id;

  insert into public.activities (type, body, customer_id)
  values ('status_change', format('Booking %s paid online and confirmed.', v_booking.reference), v_booking.customer_id);

  -- EMAIL TRIGGER GOES HERE: bookingConfirmedEmail to the customer.
  return public.booking_details(v_booking.id, true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Who may call what
-- ---------------------------------------------------------------------------

-- Supabase lets anon and authenticated execute new functions by default. Take that away from the
-- internal helpers and the server-only functions...
revoke execute on function
  public.require_text(text, text, integer),
  public.require_email(text),
  public.booking_details(uuid, boolean),
  public.find_own_booking(text, text),
  public.attach_booking_documents(uuid, jsonb),
  public.record_booking_payment(uuid, public.payment_method, text, public.payment_method),
  public.cancel_overdue_bookings(),
  public.handle_new_user()
from public, anon, authenticated;

-- ...and grant the website's functions explicitly.
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

grant execute on function public.record_booking_payment(uuid, public.payment_method, text, public.payment_method) to service_role;
