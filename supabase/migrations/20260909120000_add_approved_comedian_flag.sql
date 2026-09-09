-- Adds the approved_comedian gate used by the audience vs comedian split.
--
-- Not-approved users (including logged-out visitors) see shows + the weekly top
-- mics on the map. Approved comedians see the full open mic catalog.
--
-- Every profile that exists when this migration runs is grandfathered in so the
-- current weekly users keep their access; only new signups start pending.

alter table public.profiles
  add column if not exists approved_comedian boolean not null default false;

update public.profiles set approved_comedian = true;

-- The only query that scans this column is the admin pending-approval queue.
create index if not exists profiles_pending_comedian_idx
  on public.profiles (created_at)
  where approved_comedian = false;
