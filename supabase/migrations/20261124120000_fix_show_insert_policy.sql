-- The auto_approve_native_show trigger sets verified = true before the row is
-- checked, but the insert policy only allowed verified = false, so every show
-- submitted from the app was rejected. Allow native (source IS NULL) shows to
-- arrive approved, and still allow unverified submissions.
drop policy if exists "Anyone can submit unverified audience shows" on public.audience_shows;

create policy "Anyone can submit unverified audience shows"
  on public.audience_shows
  for insert
  to anon, authenticated
  with check (
    coalesce(status, 'active') = 'active'
    and (coalesce(verified, false) is false or source is null)
  );
