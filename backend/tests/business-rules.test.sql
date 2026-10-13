-- Behaviour tests for the migrations. Run with tests/run.sh (see there). Each check prints "ok - ...";
-- the first broken rule stops the run with an error.
\set ON_ERROR_STOP 1
\set QUIET 1
create schema t;
grant usage on schema t to public;
create function t.expect_error(stmt text, expected text) returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'EXPECTED ERROR % BUT SUCCEEDED: %', expected, stmt;
exception when others then
  if sqlerrm not like '%' || expected || '%' then
    raise exception 'EXPECTED % GOT "%" FOR: %', expected, sqlerrm, stmt;
  end if;
end $$;
create function t.ok(cond boolean, label text) returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'FAILED: %', label; end if;
  raise notice 'ok - %', label;
end $$;
grant execute on all functions in schema t to public;
create table t.ids (k text primary key, v text);
grant all on t.ids to public;

-- people
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@example.com', now(), '{"name":"Admin One"}'),
  ('00000000-0000-0000-0000-00000000000b', 'second@example.com', now(), '{}'),
  ('00000000-0000-0000-0000-00000000000c', 'ana@example.com', now(), '{"full_name":"Ana Cruz"}'),
  ('00000000-0000-0000-0000-00000000000d', 'ana2@example.com', null, '{}');
insert into public.staff (id, name, email) values
  ('00000000-0000-0000-0000-00000000000a', 'Admin One', ' Admin@Example.com '),
  ('00000000-0000-0000-0000-00000000000b', 'Second', 'second@example.com');
select t.ok((select name from profiles where id = '00000000-0000-0000-0000-00000000000c') = 'Ana Cruz', 'profile created on sign-up');
select t.ok((select email from staff where name = 'Admin One') = 'admin@example.com', 'staff email normalized');

-- uploads as a visitor
insert into storage.objects (bucket_id, name) values
  ('booking-documents', 'uploads/11111111-1111-1111-1111-111111111111/validId.jpg'),
  ('booking-documents', 'uploads/11111111-1111-1111-1111-111111111111/proofOfBilling.jpg'),
  ('booking-documents', 'uploads/11111111-1111-1111-1111-111111111111/driversLicense.jpg'),
  ('booking-documents', 'uploads/22222222-2222-2222-2222-222222222222/validId.jpg'),
  ('booking-documents', 'uploads/22222222-2222-2222-2222-222222222222/proofOfBilling.jpg'),
  ('booking-documents', 'uploads/22222222-2222-2222-2222-222222222222/driversLicense.jpg'),
  ('booking-documents', 'uploads/33333333-3333-3333-3333-333333333333/validId.jpg'),
  ('booking-documents', 'uploads/33333333-3333-3333-3333-333333333333/proofOfBilling.jpg'),
  ('booking-documents', 'uploads/33333333-3333-3333-3333-333333333333/driversLicense.jpg');

set role anon;
select t.ok((select count(*) from vehicles) = 8, 'visitor sees 8 vehicle types');
select t.ok((select count(*) from customers) = 0, 'visitor sees no customers');
select t.ok((select count(*) from storage.objects) = 0, 'visitor cannot list uploads');
select t.expect_error($$insert into leads (name) values ('x')$$, 'row-level security');
select t.ok((select count(*) from vehicles where price_per_day = 1) = 0, 'visitor cannot change prices');
insert into storage.objects (bucket_id, name) values ('booking-documents', 'uploads/44444444-4444-4444-4444-444444444444/validId.jpg');
select t.expect_error($$insert into storage.objects (bucket_id, name) values ('booking-documents', 'elsewhere/x.jpg')$$, 'row-level security');

-- contact form
select t.ok(submit_inquiry('Ben', 'BEN@example.com', '0917', null, 'Do you have vans?') is not null, 'inquiry accepted');
select t.expect_error($$select submit_inquiry('Ben', 'not-an-email', '', null, 'hi')$$, 'invalid_input');

-- booking request: SUV 4000/day, 3 days (+1h => 3 days? 2 days 1 hour => 3), with driver 1000/day
\set docs1 '''{"validId":{"path":"uploads/11111111-1111-1111-1111-111111111111/validId.jpg","fileName":"id.jpg"},"proofOfBilling":{"path":"uploads/11111111-1111-1111-1111-111111111111/proofOfBilling.jpg"},"driversLicense":{"path":"uploads/11111111-1111-1111-1111-111111111111/driversLicense.jpg"}}'''
select t.expect_error(format($$select create_booking_request((select id from vehicles where slug='suv'), 'Makati', 'Makati', %L, '10:00', %L, '11:00', true, 'Ana Cruz', 'ana@example.com', '0917', 'N01', '', %L, 1)$$,
  manila_today() + 1, manila_today() + 3, :docs1), 'price_changed');
select t.expect_error(format($$select create_booking_request((select id from vehicles where slug='suv'), 'Makati', 'Makati', %L, '10:00', %L, '11:00', true, 'Ana Cruz', 'ana@example.com', '0917', 'N01', '', %L, 15000)$$,
  manila_today() - 1, manila_today() + 3, :docs1), 'invalid_input');
select t.expect_error(format($$select create_booking_request((select id from vehicles where slug='suv'), 'Makati', 'Makati', %L, '10:00', %L, '11:00', true, 'Ana Cruz', 'ana@example.com', '0917', 'N01', '', '{}', 15000)$$,
  manila_today() + 1, manila_today() + 3), 'invalid_input');
insert into t.ids select 'b1', create_booking_request((select id from vehicles where slug='suv'), 'Makati', 'Makati', manila_today() + 1, '10:00', manila_today() + 3, '11:00', true, 'Ana Cruz', 'Ana@Example.com', '0917', 'N01', 'Child seat?', :docs1::jsonb, 15000) -> 'booking' ->> 'reference';
select t.ok((select v from t.ids where k='b1') ~ '^RC-[A-HJ-NP-Z2-9]{6}$', 'booking reference generated');
select t.expect_error(format($$select create_booking_request((select id from vehicles where slug='sedan'), 'A', 'B', %L, '10:00', %L, '10:00', false, 'Ana', 'ana@example.com', '0917', 'N01', '', %L, 1800)$$,
  manila_today() + 1, manila_today() + 2, :docs1), 'invalid_input');
-- motorcycle with driver => driver ignored; 125cc 550/day, 1 day
insert into t.ids select 'b2', create_booking_request((select id from vehicles where slug='125cc'), 'A', 'B', manila_today() + 1, '10:00', manila_today() + 2, '10:00', true, 'Ana', 'ana@example.com', '0999', 'N02', '',
  '{"validId":{"path":"uploads/22222222-2222-2222-2222-222222222222/validId.jpg"},"proofOfBilling":{"path":"uploads/22222222-2222-2222-2222-222222222222/proofOfBilling.jpg"},"driversLicense":{"path":"uploads/22222222-2222-2222-2222-222222222222/driversLicense.jpg"}}', 550) -> 'booking' ->> 'reference';
select t.ok((get_booking_by_reference((select v from t.ids where k='b1')) -> 'customer') = jsonb_build_object('id', (get_booking_by_reference((select v from t.ids where k='b1')) -> 'customer' ->> 'id')::uuid, 'name', 'Ana Cruz'), 'status page shows the name only');
select t.ok(get_booking_by_reference('RC-ZZZZZZ') is null, 'unknown reference returns null');
select t.expect_error(format('select get_own_booking(%L, %L)', (select v from t.ids where k='b1'), 'other@example.com'), 'not_found');
select t.ok(get_own_booking(lower((select v from t.ids where k='b1')), 'ANA@example.com') -> 'customer' ->> 'email' = 'ana@example.com', 'owner sees own booking');
select t.ok(not (get_own_booking((select v from t.ids where k='b1'), 'ana@example.com') ? 'documents'), 'no documents in booking details');

-- reviews
select t.expect_error($$select submit_review('Ana', 5, 'Great', 'RC-ZZZZZZ')$$, 'unknown_booking');
select submit_review('Ana', 5, 'Great', lower((select v from t.ids where k='b1')));
select t.ok((select count(*) from list_published_reviews()) = 0, 'new review is private');

-- server-only function
select t.expect_error(format('select record_booking_payment(%L, %L, %L)', gen_random_uuid(), 'card', 'x'), 'permission denied');
reset role;

select t.ok((select count(*) from customers) = 1 and (select phone from customers) = '0999', 'customer reused by email, phone updated');
select t.ok((select days || '/' || driver_rate || '/' || total from bookings where reference = (select v from t.ids where k='b1')) = '3/1000/15000', 'price: 3 days with driver');
select t.ok((select with_driver::text || total from bookings where reference = (select v from t.ids where k='b2')) = 'false550', 'motorcycle never with driver');
select t.ok((select count(*) from booking_documents) = 6, 'documents attached');
select t.ok((select count(*) from leads where email = 'ben@example.com' and stage = 'new') = 1, 'inquiry became a new lead');
select t.ok((select count(*) from activities) = 3, 'activities logged');

-- staff
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
set role authenticated;
select t.ok(is_staff(), 'admin is staff');
select t.ok((select count(*) from customers) = 1 and (select count(*) from storage.objects) = 10, 'staff see customers and uploads');
update reviews set published = true;
select t.ok((select count(*) from list_published_reviews()) = 1, 'published review is listed');
select t.expect_error(format($$update bookings set documents_status = 'rejected' where reference = %L$$, (select v from t.ids where k='b1')), 'invalid_transition');
update bookings set documents_status = 'rejected', rejection_reason = 'Blurry ID' where reference = (select v from t.ids where k='b1');
select t.expect_error(format($$update bookings set status = 'approved' where reference = %L$$, (select v from t.ids where k='b1')), 'invalid_transition');
select t.expect_error(format($$update bookings set total = 1 where reference = %L$$, (select v from t.ids where k='b1')), 'invalid_transition');
select t.expect_error($$update staff set active = false where id = '00000000-0000-0000-0000-00000000000a'$$, 'self_deactivate');
update staff set active = false where id = '00000000-0000-0000-0000-00000000000b';
reset role;
select set_config('request.jwt.claim.sub', '', false);
select t.expect_error($$update staff set active = false$$, 'last_admin');
update staff set active = true;

-- customer resubmits documents
set role anon;
select t.expect_error(format($$select cancel_own_booking(%L, 'ana@example.com', '')$$, (select v from t.ids where k='b1')), 'invalid_input');
select resubmit_documents((select v from t.ids where k='b1'), 'ana@example.com',
  '{"validId":{"path":"uploads/33333333-3333-3333-3333-333333333333/validId.jpg"},"proofOfBilling":{"path":"uploads/33333333-3333-3333-3333-333333333333/proofOfBilling.jpg"},"driversLicense":{"path":"uploads/33333333-3333-3333-3333-333333333333/driversLicense.jpg"}}');
select t.expect_error(format($$select resubmit_documents(%L, 'ana@example.com', '{}')$$, (select v from t.ids where k='b1')), 'not_resubmittable');
reset role;
select t.ok((select documents_status::text || coalesce(rejection_reason, '-') from bookings where reference = (select v from t.ids where k='b1')) = 'pending-', 'resubmitted documents back to pending');

-- staff verify -> approved
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
set role authenticated;
select t.expect_error(format($$update bookings set status = 'confirmed' where reference = %L$$, (select v from t.ids where k='b1')), 'invalid_transition');
update bookings set documents_status = 'verified' where reference = (select v from t.ids where k='b1');
select t.ok((select status::text from bookings where reference = (select v from t.ids where k='b1')) = 'approved'
  and (select approved_at from bookings where reference = (select v from t.ids where k='b1')) is not null, 'verifying documents approves the booking');
reset role;

-- payment server records a pay-at-pick-up payment
set role service_role;
select t.expect_error(format($$select record_booking_payment(%L, 'pay_at_pickup', 'MOCK-1')$$, (select id from bookings where reference = (select v from t.ids where k='b1'))), 'invalid_input');
select record_booking_payment((select id from bookings where reference = (select v from t.ids where k='b1')), 'pay_at_pickup', 'MOCK-1', 'gcash');
select t.expect_error(format($$select record_booking_payment(%L, 'card', 'MOCK-2')$$, (select id from bookings where reference = (select v from t.ids where k='b1'))), 'not_payable');
reset role;
select t.ok((select status::text || amount || '/' || down_payment_amount from payments) = 'pending15000/1500', 'pay at pick-up: 10% down payment, pending');
select t.ok((select status::text from bookings where reference = (select v from t.ids where k='b1')) = 'confirmed', 'payment confirms the booking');

set role anon;
select t.expect_error(format($$select cancel_own_booking(%L, 'ana@example.com', 'changed plans')$$, (select v from t.ids where k='b1')), 'not_cancellable');
select t.ok(cancel_own_booking((select v from t.ids where k='b2'), 'ana@example.com', 'changed plans') -> 'booking' ->> 'status' = 'cancelled', 'customer cancels unpaid booking');
reset role;

-- staff move confirmed -> active -> completed; no way back
set role authenticated;
update bookings set status = 'active' where reference = (select v from t.ids where k='b1');
select t.expect_error(format($$update bookings set status = 'confirmed' where reference = %L$$, (select v from t.ids where k='b1')), 'invalid_transition');
update bookings set status = 'completed' where reference = (select v from t.ids where k='b1');
-- a phone booking entered by staff gets a reference too
insert into bookings (customer_id, vehicle_id, pickup_location, return_location, pickup_date, pickup_time, return_date, return_time,
  days, daily_rate, vehicle_total, total)
select c.id, v.id, 'Office', 'Office', current_date + 5, '09:00', current_date + 6, '09:00', 1, v.price_per_day, v.price_per_day, v.price_per_day
from customers c, vehicles v where v.slug = 'van' limit 1;
select t.ok((select count(*) from bookings where pickup_location = 'Office' and reference ~ '^RC-') = 1, 'staff enter a booking directly');
update payments set status = 'paid';
select t.expect_error($$delete from customers$$, 'has_bookings');
reset role;

-- website customer accounts: confirmed email sees own bookings, unconfirmed sees none
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', false);
set role authenticated;
select t.ok(not is_staff(), 'customer is not staff');
select t.ok((select count(*) from bookings) = 3 and (select count(*) from payments) = 1, 'customer sees own bookings and payment');
select t.ok((select count(*) from booking_documents) = 0 and (select count(*) from customers) = 0, 'customer sees no documents or CRM rows');
update profiles set phone = '123';
reset role;
select t.ok((select phone from profiles where id = '00000000-0000-0000-0000-00000000000c') = '123', 'customer updates own profile');
update auth.users set email = 'ana@example.com' where id = '00000000-0000-0000-0000-00000000000d';
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000d', false);
set role authenticated;
select t.ok((select count(*) from bookings) = 0, 'unconfirmed email sees no bookings');
reset role;

-- overdue approved bookings are cancelled
insert into storage.objects (bucket_id, name) values
  ('booking-documents', 'uploads/55555555-5555-5555-5555-555555555555/validId.jpg'),
  ('booking-documents', 'uploads/55555555-5555-5555-5555-555555555555/proofOfBilling.jpg'),
  ('booking-documents', 'uploads/55555555-5555-5555-5555-555555555555/driversLicense.jpg');
insert into t.ids select 'b3', create_booking_request((select id from vehicles where slug='sedan'), 'A', 'B', manila_today() + 1, '10:00', manila_today() + 2, '10:00', false, 'Cara', 'cara@example.com', '0917', 'N03', '',
  '{"validId":{"path":"uploads/55555555-5555-5555-5555-555555555555/validId.jpg"},"proofOfBilling":{"path":"uploads/55555555-5555-5555-5555-555555555555/proofOfBilling.jpg"},"driversLicense":{"path":"uploads/55555555-5555-5555-5555-555555555555/driversLicense.jpg"}}', 1800) -> 'booking' ->> 'reference';
update bookings set documents_status = 'verified' where reference = (select v from t.ids where k='b3');
update bookings set approved_at = now() - interval '25 hours' where reference = (select v from t.ids where k='b3');
set role service_role;
select t.expect_error(format($$select record_booking_payment(%L, 'card', 'MOCK-3')$$, (select id from bookings where reference = (select v from t.ids where k='b3'))), 'payment_overdue');
reset role;
select t.ok(cancel_overdue_bookings() = 1, 'overdue booking cancelled');
select t.ok((select cancelled_by from bookings where reference = (select v from t.ids where k='b3')) = 'system', 'cancelled by the system');

-- tasks completed_at
insert into tasks (title, due_date) values ('Call Ana', current_date);
update tasks set status = 'done';
select t.ok((select completed_at is not null from tasks), 'completed_at set');
update tasks set status = 'open';
select t.ok((select completed_at is null from tasks), 'completed_at cleared');
\echo ALL TESTS PASSED
