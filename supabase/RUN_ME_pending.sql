-- Everything not yet run, in order. Safe to run more than once. Paste all of it into the Supabase SQL editor.

-- ===== 20261021120000_show_listing_fields.sql =====
-- Fields the new show listing form collects.
--
-- laughpass_free_ticket / laughpass_ticket_limit: the host offers LaughPass
--   subscribers a free ticket (and how many per show) to help fill the room.
--   Redemption is not built yet, so nothing public reads these today.
-- confirm_active_agreed: the host promised to confirm the show is still on
--   one day before each show, so the listing can stay on Comediq.
-- last_confirmed_active_at: when they last did. Filled by the reminder job
--   once it exists.

alter table public.audience_shows
  add column if not exists laughpass_free_ticket boolean not null default false,
  add column if not exists laughpass_ticket_limit integer,
  add column if not exists confirm_active_agreed boolean not null default false,
  add column if not exists last_confirmed_active_at timestamptz;

-- ===== 20261026120000_auto_approve_shows.sql =====
-- Approve every show submitted on Comediq automatically, the same way new mics go live.
-- Rows that come from a partner source keep their own approval path.

create or replace function public.auto_approve_native_show()
returns trigger
language plpgsql
as $$
begin
  if new.source is null then
    new.verified := true;
  end if;
  return new;
end;
$$;

drop trigger if exists auto_approve_native_show on public.audience_shows;
create trigger auto_approve_native_show
  before insert on public.audience_shows
  for each row execute function public.auto_approve_native_show();

-- Publish what is already waiting (for example Evan Solomon's show).
update public.audience_shows
set verified = true
where source is null
  and verified = false
  and submitted_by is not null
  and status = 'active'
  and is_active = true;

-- ===== 20261102120000_ensure_headshots_bucket.sql =====
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

-- ===== 20261110120000_claim_mic_host_rpc.sql =====
-- Claiming a mic failed with 'new row violates row-level security policy for table "mic_hosts"'.
-- Do the insert inside a function that checks who is signed in, like add_open_mic does,
-- so it no longer depends on the table's insert policy.

create or replace function public.claim_mic_host(p_mic_id uuid)
returns public.mic_hosts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.mic_hosts;
begin
  if v_user is null then
    raise exception 'Must be authenticated';
  end if;

  insert into public.mic_hosts (user_id, mic_id, is_verified)
  values (v_user, p_mic_id, false)
  on conflict (user_id, mic_id) do nothing;

  select * into v_row from public.mic_hosts
  where user_id = v_user and mic_id = p_mic_id;

  return v_row;
end;
$$;

revoke all on function public.claim_mic_host(uuid) from public;
grant execute on function public.claim_mic_host(uuid) to authenticated;

-- ===== 20261110140000_normalize_mic_times.sql =====
-- Keep every mic's times in one format: "7:00 PM" and "9:00 PM".
--
-- Why: a mic typed as "7PM" or "7-9" was saved as typed, so it sorted wrong (a bare
-- "7" can be read as 7 AM). Now the database cleans times itself on every insert and
-- update, whichever screen, script or sheet the mic came from.
--
-- Rules (same as src/utils/micTime.ts):
--   * "7", "7pm", "7:30p", "730", "19:30" all become "7:00 PM", "7:30 PM", ...
--   * Hours 1 to 12 with no AM or PM are PM. Comedy happens at night.
--   * "7-9" typed in the start box becomes start 7:00 PM and end 9:00 PM.
--   * An end time with no AM or PM at or before the start is after midnight
--     ("11" to "1" is 11:00 PM to 1:00 AM).
--   * Anything unreadable is left alone.

create or replace function public.normalize_mic_time(t text)
returns text
language plpgsql
immutable
as $$
declare
  m text[];
  h int;
  mi int;
  pm boolean;
begin
  if t is null then
    return null;
  end if;
  m := regexp_match(btrim(t), '^(\d{1,2})(?::?(\d{2}))?\s*([apAP])?\.?[mM]?\.?$');
  if m is null then
    return t;
  end if;
  h := m[1]::int;
  mi := coalesce(m[2], '0')::int;
  if mi > 59 or h > 23 then
    return t;
  end if;
  pm := case when m[3] is null then h <> 0 else lower(m[3]) = 'p' end;
  if h > 12 then
    h := h - 12;
  end if;
  if h = 0 then
    h := 12;
  end if;
  return h::text || ':' || lpad(mi::text, 2, '0') || ' ' || case when pm then 'PM' else 'AM' end;
end;
$$;

create or replace function public.mic_time_minutes(t text)
returns int
language sql
immutable
as $$
  select (((regexp_match(t, '^(\d{1,2}):(\d{2}) (AM|PM)$'))[1]::int % 12) * 60
          + ((regexp_match(t, '^(\d{1,2}):(\d{2}) (AM|PM)$'))[2]::int)
          + case when (regexp_match(t, '^(\d{1,2}):(\d{2}) (AM|PM)$'))[3] = 'PM' then 720 else 0 end);
$$;

create or replace function public.mic_minutes_label(total int)
returns text
language sql
immutable
as $$
  select (case when (total / 60) % 12 = 0 then 12 else (total / 60) % 12 end)::text
         || ':' || lpad((total % 60)::text, 2, '0')
         || ' ' || case when (total / 60) % 24 >= 12 then 'PM' else 'AM' end;
$$;

create or replace function public.normalize_open_mic_times()
returns trigger
language plpgsql
as $$
declare
  range_parts text[];
  start_text text := btrim(coalesce(new.start_time, ''));
  end_text text := btrim(coalesce(new.latest_end_time, ''));
  canon constant text := '^(1[0-2]|[1-9]):[0-5][0-9] (AM|PM)$';
  s text;
  e text;
begin
  -- "7-9" typed into the start box
  range_parts := regexp_match(start_text, '^(.+?)\s*[-–—]\s*(.+)$');
  if range_parts is not null
     and public.normalize_mic_time(range_parts[1]) ~ canon
     and public.normalize_mic_time(range_parts[2]) ~ canon then
    start_text := range_parts[1];
    if end_text = '' then
      end_text := range_parts[2];
    end if;
  end if;

  s := public.normalize_mic_time(start_text);
  e := public.normalize_mic_time(end_text);

  -- an end time with no AM or PM that is not after the start is after midnight
  if s ~ canon and e ~ canon and end_text !~* '[ap]\.?m?\.?\s*$'
     and public.mic_time_minutes(e) <= public.mic_time_minutes(s) then
    e := public.mic_minutes_label((public.mic_time_minutes(e) + 720) % 1440);
  end if;

  new.start_time := case when new.start_time is null then null else s end;
  new.latest_end_time := case when new.latest_end_time is null and end_text = '' then null else e end;
  return new;
end;
$$;

drop trigger if exists normalize_open_mic_times on public.open_mics_historical;
create trigger normalize_open_mic_times
  before insert or update of start_time, latest_end_time on public.open_mics_historical
  for each row execute function public.normalize_open_mic_times();

-- Fix the mics already saved in the old formats (for example "7PM", "9PM", "12:30", "10:00pm").
-- Touching the columns fires the trigger above, which rewrites them.
update public.open_mics_historical
set start_time = start_time, latest_end_time = latest_end_time
where start_time !~ '^(1[0-2]|[1-9]):[0-5][0-9] (AM|PM)$'
   or (latest_end_time is not null and latest_end_time !~ '^(1[0-2]|[1-9]):[0-5][0-9] (AM|PM)$');

-- ===== showtn_next_shows view (ShowTN) =====
-- ShowTN's Browse page reads this view. It is a safe, read-only window onto the
-- Comediq Laugh-tab listings (public.audience_shows) in the same Supabase project.
-- Only shows that are live on comediq.us appear here: verified, active, a real dated
-- show (not a repeating template), from Comediq itself or an approved partner venue.

create or replace view public.showtn_next_shows as
select
  s.id,
  s.title,
  s.venue_name                                   as venue,
  s.borough                                      as neighborhood,
  'New York'::text                               as city,
  ((s.show_date::text || ' ' || coalesce(s.show_time::text, '20:00'))::timestamp
     at time zone 'America/New_York')            as show_date,
  s.description,
  case when coalesce(s.showtn_eligible, false) or coalesce(s.laughpass_free_ticket, false)
       then 'pro' else 'free' end                as tier,
  s.image_url,
  coalesce(s.ticket_url, s.external_ticket_url)  as ticket_url,
  s.ticket_price,
  coalesce(s.laughpass_free_ticket, false)       as laughpass_free_ticket,
  coalesce(s.is_featured, false)                 as is_featured
from public.audience_shows s
where s.verified is true
  and s.status = 'active'
  and s.is_active is true
  and coalesce(s.is_recurring, false) = false
  and s.show_date >= (now() at time zone 'America/New_York')::date
  and (
    s.source is null
    or exists (
      select 1 from public.venue_sources v
      where v.source_key = s.source
        and v.permission_status = 'approved'
        and v.is_active is true
    )
  );

grant select on public.showtn_next_shows to anon, authenticated;
