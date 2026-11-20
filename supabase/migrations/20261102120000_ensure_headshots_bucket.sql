-- The headshots bucket (profile pictures and show pictures) was missing in production,
-- which showed up as "bucket not found" when adding a show with a picture.
-- Safe to run more than once.

insert into storage.buckets (id, name, public)
values ('headshots', 'headshots', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can view headshots" on storage.objects;
create policy "Anyone can view headshots"
  on storage.objects for select
  using (bucket_id = 'headshots');

drop policy if exists "Authenticated users can upload their own headshot" on storage.objects;
create policy "Authenticated users can upload their own headshot"
  on storage.objects for insert
  with check (bucket_id = 'headshots' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can update their own headshot" on storage.objects;
create policy "Users can update their own headshot"
  on storage.objects for update
  using (bucket_id = 'headshots' and auth.uid()::text = (storage.foldername(name))[1]);
