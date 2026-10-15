-- Two read rules the website's sign-in screens need.

-- A staff member may read their own row even while deactivated, so the staff login can tell them
-- their account is turned off (instead of "wrong password").
create policy "Staff read their own row" on public.staff
  for select to authenticated using (id = (select auth.uid()));

-- A signed-in website customer may read their own CRM customer record (same rule as their bookings:
-- the account's confirmed email), so My bookings can show the renter's details.
create policy "Customers read their own customer record" on public.customers
  for select to authenticated using (id in (select public.current_customer_ids()));
