-- Storage bucket for event cover images, uploaded by organizers and
-- displayed publicly on the /e/:public_token RSVP page.

insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

-- Organizers can manage files under a folder named after their own user id
-- (e.g. event-images/<owner_id>/<filename>).
create policy "event_images_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "event_images_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "event_images_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Bucket is public, so reads are open to anyone (needed for the public
-- RSVP page to render the event image without authentication).
create policy "event_images_public_read" on storage.objects
  for select using (bucket_id = 'event-images');
