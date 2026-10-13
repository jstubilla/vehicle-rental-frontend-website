-- Private Storage bucket for the photos customers send with a booking (valid ID, proof of billing,
-- driver's license). Nobody but staff can ever read them.
--
-- How the website uses it:
--   1. The visitor's browser uploads each photo to "uploads/<random uuid>/<kind>.jpg" (upsert off).
--      Visitors may only add files, never list, read, overwrite or delete them.
--   2. create_booking_request / resubmit_documents check that those files exist and record their
--      paths in booking_documents.
--   3. Staff view them through short-lived signed URLs (storage.from('booking-documents').createSignedUrl).
--
-- Files uploaded but never attached to a booking can be cleaned up later by a scheduled job.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('booking-documents', 'booking-documents', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Anyone uploads booking documents" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'booking-documents' and (storage.foldername(name))[1] = 'uploads');

create policy "Staff read booking documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'booking-documents' and (select public.is_staff()));

create policy "Staff delete booking documents" on storage.objects
  for delete to authenticated
  using (bucket_id = 'booking-documents' and (select public.is_staff()));
