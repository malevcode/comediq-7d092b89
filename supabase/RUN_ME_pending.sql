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
  and s.show_date::date >= (now() at time zone 'America/New_York')::date
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

-- ===== 20261111120000_mic_of_the_day_draw.sql =====
-- Mic of the Day (daily draw), the "By Comediq" flag, and Gdrink at Gnihton as a Comediq-run mic.
-- Safe to run more than once.
--
-- Mic ids are kept as TEXT with no foreign key. On the live database
-- open_mics_historical.unique_identifier and mic_hosts.mic_id are text, not uuid as the
-- older migration files in this repo say, and a uuid column cannot reference a text one.
--
-- How the draw works, in short:
--   * Hosts enter one of their mics for a future date (motd_enter).
--   * Every hour pg_cron calls motd_tick(). On the first tick after midnight in New York it
--     draws one entry at random for that day. Mondays and Thursdays have standing picks and
--     skip the draw. If nobody entered, the day stays empty.
--   * Before mic_of_the_day_config.paid_from the win is free and pinned at once. From that
--     date the winner has until pay_by_hour (10 AM New York) to pay; unpaid means forfeited
--     and the tick redraws from the entries that are left.
--   * The site reads everything with ONE small call: motd_week().

-- ===== 1. "By Comediq" flag =====

alter table public.open_mics_historical
  add column if not exists is_comediq_run boolean not null default false;

comment on column public.open_mics_historical.is_comediq_run is
  'True for mics Comediq runs itself. Shows the "By Comediq" sticker.';

-- ===== 2. Gdrink at Gnihton: Comediq-run, sign-up on, admins as host =====
-- The row already exists (added from the poster). End time, set length and slot count are
-- left exactly as they are; nothing is guessed here.

update public.open_mics_historical
set is_comediq_run = true,
    signup_enabled = true,
    slots_enabled = true,
    signup_method = 'comediq_slots',   -- Register opens Comediq's own sign-up sheet
    cost = '$5 or Subscribe!',
    hosts_organizers = 'Comediq',
    status = 'verified',
    last_verified_at = now()
where unique_identifier = '21c4c8b9-8cc2-42d6-8a60-2534c75dfdaf';

-- Written without ON CONFLICT: the live mic_hosts table has no unique rule on
-- (user_id, mic_id), so ON CONFLICT fails there with error 42P10.
update public.mic_hosts h
set is_verified = true
from public.profiles p
where p.isadmin = true
  and h.user_id = p.user_id
  and h.mic_id = '21c4c8b9-8cc2-42d6-8a60-2534c75dfdaf';

insert into public.mic_hosts (user_id, mic_id, is_verified)
select p.user_id, '21c4c8b9-8cc2-42d6-8a60-2534c75dfdaf', true
from public.profiles p
cross join public.open_mics_historical m
where p.isadmin = true
  and m.unique_identifier = '21c4c8b9-8cc2-42d6-8a60-2534c75dfdaf'
  and not exists (select 1 from public.mic_hosts h
                  where h.user_id = p.user_id and h.mic_id::text = m.unique_identifier::text);

-- ===== 3. Tables =====

-- One row of settings. Change a value here and the site follows; no code edit.
create table if not exists public.mic_of_the_day_config (
  id boolean primary key default true check (id),
  paid_from date not null default '2026-12-01',     -- first date a win costs money
  price_cents integer not null default 2500,
  pay_by_hour integer not null default 10,          -- New York hour the winner must pay by
  redraw_pay_hours integer not null default 2,      -- time a redrawn winner gets to pay
  days_ahead integer not null default 6,            -- how far ahead hosts can enter
  notify_url text                                   -- edge function that emails the winner
);
insert into public.mic_of_the_day_config (id, notify_url)
values (true, 'https://wwqoztrqprqksdubjwgj.supabase.co/functions/v1/motd-notify')
on conflict (id) do nothing;

-- Standing weekly picks. 0 = Sunday ... 6 = Saturday. These days skip the draw.
create table if not exists public.mic_of_the_day_standing (
  day_of_week smallint primary key check (day_of_week between 0 and 6),
  mic_id text not null
);
insert into public.mic_of_the_day_standing (day_of_week, mic_id)
select v.dow, v.mic
from (values
  (1, '0e94c622-2b8b-4c7c-a4d0-3f1937d3c1fd'::text),  -- Monday: Crash Landing Comedy
  (4, '21c4c8b9-8cc2-42d6-8a60-2534c75dfdaf'::text)   -- Thursday: Gdrink at Gnihton
) as v(dow, mic)
join public.open_mics_historical m on m.unique_identifier::text = v.mic
on conflict (day_of_week) do nothing;

create table if not exists public.mic_of_the_day_entries (
  id uuid primary key default gen_random_uuid(),
  target_date date not null,
  -- null only on an admin "clear" row, which means "this day is deliberately blank"
  mic_id text,
  host_user_id uuid not null,
  created_at timestamptz not null default now(),
  status text not null default 'entered'
    check (status in ('entered', 'won', 'lost', 'paid', 'forfeited')),
  source text not null default 'draw' check (source in ('draw', 'admin')),
  drawn_at timestamptz,
  pay_by timestamptz,            -- null on a free win
  paid_at timestamptz,
  price_paid_cents integer,
  stripe_session_id text,
  notified_at timestamptz,
  unique (target_date, host_user_id)                 -- one entry per host per date
);
-- One winner per date.
create unique index if not exists mic_of_the_day_one_winner
  on public.mic_of_the_day_entries (target_date) where status in ('won', 'paid');

create table if not exists public.mic_of_the_day_draw_log (
  id bigint generated always as identity primary key,
  target_date date not null,
  happened_at timestamptz not null default now(),
  event text not null,
  entry_count integer,
  winner_entry_id uuid,
  detail text
);
create index if not exists mic_of_the_day_draw_log_date on public.mic_of_the_day_draw_log (target_date);

create or replace function public.motd_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
     and (public.has_role(auth.uid(), 'admin') or public.is_current_user_admin());
$$;

-- Nobody reads these tables directly except admins. Everyone else goes through motd_week().
do $$
declare t text;
begin
  foreach t in array array['mic_of_the_day_config', 'mic_of_the_day_standing',
                           'mic_of_the_day_entries', 'mic_of_the_day_draw_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists "Admins manage %s" on public.%I', t, t);
    execute format(
      'create policy "Admins manage %s" on public.%I for all to authenticated
         using (public.motd_is_admin()) with check (public.motd_is_admin())', t, t);
  end loop;
end $$;

-- ===== 4. Reading =====

create or replace function public.motd_today()
returns date language sql stable as $$
  select (now() at time zone 'America/New_York')::date;
$$;

-- What a single date resolves to.
--   state: 'pinned' | 'awaiting_payment' | 'cleared' | 'open'
-- Dropped first so this file can be run again after the auction file changed its shape.
drop function if exists public.motd_resolve(date);
create function public.motd_resolve(p_date date)
returns table (mic_id uuid, source text, state text, entry_id uuid)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  w public.mic_of_the_day_entries;
  s uuid;
begin
  select * into w from public.mic_of_the_day_entries e
  where e.target_date = p_date and e.status in ('won', 'paid');

  if found then
    if w.status = 'won' and w.pay_by is not null then
      return query select w.mic_id, w.source, 'awaiting_payment'::text, w.id;
    elsif w.mic_id is null then
      return query select null::uuid, w.source, 'cleared'::text, w.id;
    else
      return query select w.mic_id, w.source, 'pinned'::text, w.id;
    end if;
    return;
  end if;

  select st.mic_id into s from public.mic_of_the_day_standing st
  where st.day_of_week = extract(dow from p_date)::int;
  if found then
    return query select s, 'standing'::text, 'pinned'::text, null::uuid;
    return;
  end if;

  return query select null::uuid, null::text, 'open'::text, null::uuid;
end;
$$;

-- The one call the site makes: today plus the next few days, the settings, and the
-- signed-in host's own entries.
create or replace function public.motd_week()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c public.mic_of_the_day_config;
  v_today date := public.motd_today();
  v_days jsonb;
  v_mine jsonb := '[]'::jsonb;
begin
  select * into c from public.mic_of_the_day_config limit 1;

  select jsonb_agg(jsonb_build_object(
           'date', d::date,
           'mic_id', r.mic_id,
           'source', r.source,
           'state', r.state,
           'entries', (select count(*) from public.mic_of_the_day_entries e
                       where e.target_date = d::date and e.status = 'entered')
         ) order by d)
  into v_days
  from generate_series(v_today, v_today + c.days_ahead, interval '1 day') d
  cross join lateral public.motd_resolve(d::date) r;

  if auth.uid() is not null then
    select coalesce(jsonb_agg(jsonb_build_object(
             'id', e.id, 'date', e.target_date, 'mic_id', e.mic_id,
             'status', e.status, 'pay_by', e.pay_by)), '[]'::jsonb)
    into v_mine
    from public.mic_of_the_day_entries e
    where e.host_user_id = auth.uid() and e.target_date >= v_today and e.source = 'draw';
  end if;

  return jsonb_build_object(
    'today', v_today,
    'config', jsonb_build_object('paid_from', c.paid_from, 'price_cents', c.price_cents,
                                 'pay_by_hour', c.pay_by_hour),
    'days', coalesce(v_days, '[]'::jsonb),
    'mine', v_mine
  );
end;
$$;

-- ===== 5. Entering (always free) =====

create or replace function public.motd_enter(p_mic_id uuid, p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_today date := public.motd_today();
  c public.mic_of_the_day_config;
  v_state text;
  v_day text;
  v_verified boolean;
  v_row public.mic_of_the_day_entries;
begin
  if v_user is null then
    raise exception 'Sign in to enter Mic of the Day.';
  end if;
  select * into c from public.mic_of_the_day_config limit 1;

  if p_date <= v_today or p_date > v_today + c.days_ahead then
    raise exception 'You can enter for tomorrow up to % days ahead.', c.days_ahead;
  end if;

  select h.is_verified into v_verified from public.mic_hosts h
  where h.user_id = v_user and h.mic_id = p_mic_id;
  if not found then
    raise exception 'Claim this mic as its host first.';
  end if;

  select m.day into v_day from public.open_mics_historical m
  where m.unique_identifier = p_mic_id and m.active = true;
  if not found then
    raise exception 'That mic is not on Comediq right now.';
  end if;
  if lower(trim(v_day)) <> lower(trim(to_char(p_date, 'Day'))) then
    raise exception 'That mic runs on %, not on %.', trim(v_day), trim(to_char(p_date, 'Day'));
  end if;

  select r.state into v_state from public.motd_resolve(p_date) r;
  if v_state <> 'open' then
    raise exception 'That day already has a Mic of the Day.';
  end if;

  insert into public.mic_of_the_day_entries (target_date, mic_id, host_user_id)
  values (p_date, p_mic_id, v_user)
  on conflict (target_date, host_user_id) do update
    set mic_id = excluded.mic_id
    where public.mic_of_the_day_entries.status = 'entered'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'You already have an entry for that day.';
  end if;

  return jsonb_build_object('id', v_row.id, 'date', v_row.target_date,
                            'mic_id', v_row.mic_id, 'host_verified', v_verified);
end;
$$;

-- ===== 6. The draw =====

-- Draws one winner for a date, if the date still needs one. Returns the winning entry id.
create or replace function public.motd_draw(p_date date)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  c public.mic_of_the_day_config;
  v_count integer;
  v_winner uuid;
  v_pay_by timestamptz;
begin
  -- Two ticks at once must not both draw.
  perform pg_advisory_xact_lock(8675309, (p_date - date '2000-01-01'));
  select * into c from public.mic_of_the_day_config limit 1;

  if exists (select 1 from public.mic_of_the_day_entries
             where target_date = p_date and status in ('won', 'paid')) then
    return null;
  end if;

  if exists (select 1 from public.mic_of_the_day_standing
             where day_of_week = extract(dow from p_date)::int) then
    insert into public.mic_of_the_day_draw_log (target_date, event, detail)
    values (p_date, 'standing', 'Standing weekly pick, no draw.');
    return null;
  end if;

  -- Only entries whose host claim has been verified are in the hat.
  select count(*) into v_count
  from public.mic_of_the_day_entries e
  join public.mic_hosts h on h.user_id = e.host_user_id and h.mic_id = e.mic_id and h.is_verified
  where e.target_date = p_date and e.status = 'entered';

  if v_count = 0 then
    update public.mic_of_the_day_entries set status = 'lost'
    where target_date = p_date and status = 'entered';
    insert into public.mic_of_the_day_draw_log (target_date, event, entry_count, detail)
    values (p_date, 'empty', 0, 'No eligible entries. Day left empty.');
    return null;
  end if;

  -- gen_random_uuid() comes from the database's cryptographic random source, so every
  -- eligible entry has the same chance.
  select e.id into v_winner
  from public.mic_of_the_day_entries e
  join public.mic_hosts h on h.user_id = e.host_user_id and h.mic_id = e.mic_id and h.is_verified
  where e.target_date = p_date and e.status = 'entered'
  order by gen_random_uuid()
  limit 1;

  if p_date < c.paid_from then
    -- Free: pinned right away, everyone else is done.
    update public.mic_of_the_day_entries
    set status = 'won', drawn_at = now(), pay_by = null, price_paid_cents = 0
    where id = v_winner;
    update public.mic_of_the_day_entries set status = 'lost'
    where target_date = p_date and status = 'entered';
  else
    -- Paid: winner has until 10 AM New York. A redraw after that gets a short window.
    v_pay_by := (p_date::timestamp + make_interval(hours => c.pay_by_hour))
                  at time zone 'America/New_York';
    if v_pay_by <= now() then
      v_pay_by := now() + make_interval(hours => c.redraw_pay_hours);
    end if;
    update public.mic_of_the_day_entries
    set status = 'won', drawn_at = now(), pay_by = v_pay_by
    where id = v_winner;

    -- Ask the edge function to email the winner. Never let this stop the draw.
    if c.notify_url is not null then
      begin
        perform net.http_post(url := c.notify_url,
                              headers := '{"Content-Type": "application/json"}'::jsonb,
                              body := '{}'::jsonb);
      exception when others then
        insert into public.mic_of_the_day_draw_log (target_date, event, detail)
        values (p_date, 'notify_failed', sqlerrm);
      end;
    end if;
  end if;

  insert into public.mic_of_the_day_draw_log (target_date, event, entry_count, winner_entry_id, detail)
  values (p_date, 'drawn', v_count, v_winner,
          case when p_date < c.paid_from then 'Free win, pinned.'
               else 'Winner must pay by ' || to_char(v_pay_by at time zone 'America/New_York', 'HH12:MI AM') || ' ET.' end);
  return v_winner;
end;
$$;

-- Runs every hour. Does the midnight draw once per day, forfeits unpaid winners and redraws.
create or replace function public.motd_tick()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := public.motd_today();
  r record;
  v_forfeited integer := 0;
  v_drawn uuid;
begin
  -- The cron job and the service role may call this; a signed-in user must be an admin.
  if auth.uid() is not null and not public.motd_is_admin() then
    raise exception 'Admins only.';
  end if;

  for r in
    select id, target_date from public.mic_of_the_day_entries
    where status = 'won' and pay_by is not null and pay_by < now()
  loop
    update public.mic_of_the_day_entries set status = 'forfeited' where id = r.id;
    insert into public.mic_of_the_day_draw_log (target_date, event, winner_entry_id, detail)
    values (r.target_date, 'forfeited', r.id, 'Not paid in time.');
    v_forfeited := v_forfeited + 1;
    if r.target_date = v_today then
      perform public.motd_draw(r.target_date);
    end if;
  end loop;

  if not exists (select 1 from public.mic_of_the_day_draw_log
                 where target_date = v_today and event in ('drawn', 'empty', 'standing')) then
    v_drawn := public.motd_draw(v_today);
  end if;

  update public.mic_of_the_day_entries set status = 'lost'
  where status = 'entered' and target_date < v_today;

  return jsonb_build_object('date', v_today, 'drawn', v_drawn, 'forfeited', v_forfeited);
end;
$$;

-- Called by the Stripe webhook once the $25 Checkout payment has succeeded.
create or replace function public.motd_mark_paid(p_entry_id uuid, p_session_id text, p_amount_cents integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.mic_of_the_day_entries;
  v_result text;
begin
  select * into e from public.mic_of_the_day_entries where id = p_entry_id for update;
  if not found then
    return 'not_found';
  end if;

  if e.status = 'paid' then
    return 'already_paid';
  elsif e.status = 'won'
     or (e.status = 'forfeited' and e.target_date >= public.motd_today()
         and not exists (select 1 from public.mic_of_the_day_entries x
                         where x.target_date = e.target_date and x.status in ('won', 'paid'))) then
    update public.mic_of_the_day_entries
    set status = 'paid', paid_at = now(), price_paid_cents = p_amount_cents,
        stripe_session_id = p_session_id
    where id = e.id;
    update public.mic_of_the_day_entries set status = 'lost'
    where target_date = e.target_date and status = 'entered';
    v_result := case when e.status = 'won' then 'paid' else 'paid_late_reinstated' end;
  else
    -- Paid after the spot went to someone else. Needs a refund by hand.
    update public.mic_of_the_day_entries
    set stripe_session_id = p_session_id where id = e.id;
    v_result := 'paid_late_refund_needed';
  end if;

  insert into public.mic_of_the_day_draw_log (target_date, event, winner_entry_id, detail)
  values (e.target_date, v_result, e.id, 'Stripe session ' || coalesce(p_session_id, '?'));
  return v_result;
end;
$$;

-- ===== 7. Admin: override, comp, clear, reset =====
--   set    pin p_mic_id on the date (free), replacing whoever was there
--   clear  leave the date deliberately blank (also blanks a standing day)
--   comp   the drawn winner is pinned without paying
--   reset  undo an admin set/clear, back to the standing pick or the draw
create or replace function public.motd_admin_set_day(p_date date, p_action text, p_mic_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if not public.motd_is_admin() then
    raise exception 'Admins only.';
  end if;

  if p_action in ('set', 'clear') then
    if p_action = 'set' and p_mic_id is null then
      raise exception 'Pick a mic.';
    end if;
    update public.mic_of_the_day_entries set status = 'lost'
    where target_date = p_date and status in ('won', 'paid');
    insert into public.mic_of_the_day_entries
      (target_date, mic_id, host_user_id, status, source, drawn_at, price_paid_cents)
    values (p_date, case when p_action = 'set' then p_mic_id end, v_user, 'paid', 'admin', now(), 0)
    on conflict (target_date, host_user_id) do update
      set mic_id = excluded.mic_id, status = 'paid', source = 'admin',
          drawn_at = now(), pay_by = null, price_paid_cents = 0;
  elsif p_action = 'comp' then
    update public.mic_of_the_day_entries
    set status = 'paid', paid_at = now(), price_paid_cents = 0
    where target_date = p_date and status = 'won';
    if not found then
      raise exception 'No winner is waiting to pay on that date.';
    end if;
    update public.mic_of_the_day_entries set status = 'lost'
    where target_date = p_date and status = 'entered';
  elsif p_action = 'reset' then
    update public.mic_of_the_day_entries set status = 'lost'
    where target_date = p_date and source = 'admin' and status in ('won', 'paid');
  else
    raise exception 'Unknown action %', p_action;
  end if;

  insert into public.mic_of_the_day_draw_log (target_date, event, detail)
  values (p_date, 'admin_' || p_action, coalesce(p_mic_id::text, ''));
  return public.motd_week();
end;
$$;

-- ===== 8. Who may call what =====

revoke all on function public.motd_resolve(date) from public;
revoke all on function public.motd_week() from public;
revoke all on function public.motd_enter(uuid, date) from public;
revoke all on function public.motd_draw(date) from public;
revoke all on function public.motd_tick() from public;
revoke all on function public.motd_mark_paid(uuid, text, integer) from public;
revoke all on function public.motd_admin_set_day(date, text, uuid) from public;

grant execute on function public.motd_week() to anon, authenticated;
grant execute on function public.motd_enter(uuid, date) to authenticated;
grant execute on function public.motd_tick() to authenticated, service_role;
grant execute on function public.motd_admin_set_day(date, text, uuid) to authenticated;
grant execute on function public.motd_mark_paid(uuid, text, integer) to service_role;

-- ===== 9. (removed) =====
-- This file used to schedule an hourly draw with pg_cron. The draw was replaced by the
-- auction (next file), so nothing is scheduled.

-- ===== 20261111180000_mic_of_the_day_auction.sql =====
-- Mic of the Day becomes an auction. Run AFTER 20261111120000_mic_of_the_day_draw.sql.
-- Safe to run more than once.
--
-- The rules, in short:
--   * Dates before mic_of_the_day_config.paid_from (Dec 1, 2026): the first verified host to
--     claim an open date gets it free and cannot be outbid. Standing days are not claimable.
--   * From paid_from: the first claim costs start_price_cents ($15). Any other host can take
--     the spot by paying increment_cents ($5) more than the current holder paid: $20, $25...
--     A standing pick (Monday, Thursday) holds its day at $0 and can be taken for $15.
--   * Money is taken first (Stripe Checkout). The spot changes hands only when the payment
--     has succeeded.
--   * A host who is outbid after being pinned for less than refund_under_minutes (60) gets
--     the whole payment back automatically. Pinned time only counts on the day itself, so
--     being outbid before the day starts is always a full refund.
--   * A mic can only be claimed for a date it really runs on: weekly on its weekday, monthly
--     on its nth weekday, bi-weekly only with an anchor date, pop-ups only on listed dates.
--   * Every claim, takeover and refund is a row in mic_of_the_day_entries. Nothing is deleted.

-- ===== 1. Switch the draw off (left in place, not dropped) =====

revoke all on function public.motd_enter(uuid, date) from public, anon, authenticated;
revoke all on function public.motd_tick() from public, anon, authenticated;
revoke all on function public.motd_draw(date) from public, anon, authenticated;

-- ===== 2. Settings and columns =====

alter table public.mic_of_the_day_config
  add column if not exists start_price_cents integer not null default 1500,
  add column if not exists increment_cents integer not null default 500,
  add column if not exists refund_under_minutes integer not null default 60,
  add column if not exists free_claims_per_host integer not null default 1;

alter table public.mic_of_the_day_entries
  add column if not exists live_from timestamptz,        -- when this bid took the spot
  add column if not exists outbid_at timestamptz,
  add column if not exists listed_seconds integer,        -- time pinned on the day itself
  add column if not exists stripe_payment_intent text,
  add column if not exists refund_cents integer,          -- set when a refund is owed
  add column if not exists refund_reason text,
  add column if not exists refunded_at timestamptz,       -- set when Stripe has sent it
  add column if not exists stripe_refund_id text;

-- A host can now bid on the same date more than once (outbid, then bid again).
alter table public.mic_of_the_day_entries
  drop constraint if exists mic_of_the_day_entries_target_date_host_user_id_key;

-- pending: checkout started. paid / won: holds the spot (won = free). outbid: was replaced.
-- void: paid too late, someone else got there first (always refunded).
alter table public.mic_of_the_day_entries drop constraint if exists mic_of_the_day_entries_status_check;
alter table public.mic_of_the_day_entries add constraint mic_of_the_day_entries_status_check
  check (status in ('entered', 'won', 'lost', 'paid', 'forfeited', 'pending', 'outbid', 'void'));

alter table public.mic_of_the_day_entries drop constraint if exists mic_of_the_day_entries_source_check;
alter table public.mic_of_the_day_entries add constraint mic_of_the_day_entries_source_check
  check (source in ('draw', 'admin', 'bid', 'free'));

create index if not exists mic_of_the_day_entries_date on public.mic_of_the_day_entries (target_date);

-- ===== 3. Does this mic really run on this date? =====
-- Same rules as micKnownToRunOn in src/utils/micOccurrences.ts. When the schedule does not
-- pin the date down (bi-weekly with no "anchor 2026-10-21", custom with no "dates ..."),
-- the answer is no, so nobody is pinned on a night their mic is dark.
create or replace function public.motd_runs_on(p_mic_id text, p_date date)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_day text;
  v_freq text;
  v_text text;
  v_anchor date;
  v_nth integer;
  v_month_start date := date_trunc('month', p_date)::date;
  v_first date;
  v_last date;
begin
  select m.day, coalesce(m.frequency::text, 'weekly'), m.frequency_custom_text
  into v_day, v_freq, v_text
  from public.open_mics_historical m
  where m.unique_identifier::text = p_mic_id and m.active = true;
  if not found then
    return false;
  end if;

  if lower(trim(coalesce(v_day, ''))) <> lower(trim(to_char(p_date, 'Day'))) then
    return false;
  end if;

  if v_freq = 'weekly' then
    return true;
  end if;

  if v_freq = 'bi_weekly' then
    v_anchor := (substring(v_text from '(?i)anchor[:\s]+(\d{4}-\d{2}-\d{2})'))::date;
    return v_anchor is not null and (p_date - v_anchor) % 14 = 0;
  end if;

  if v_freq in ('one_off', 'custom') then
    return exists (
      select 1
      from regexp_split_to_table(
             coalesce(substring(v_text from '(?i)dates[:\s]+(\d{4}-\d{2}-\d{2}(?:\s*,\s*\d{4}-\d{2}-\d{2})*)'), ''),
             '\s*,\s*') as d
      where d <> '' and d::date = p_date
    );
  end if;

  if v_freq = 'last_of_month' then
    v_last := (v_month_start + interval '1 month' - interval '1 day')::date;
    return p_date > v_last - 7;
  end if;

  v_nth := case v_freq when '1st_of_month' then 1 when '2nd_of_month' then 2
                       when '3rd_of_month' then 3 when '4th_of_month' then 4 end;
  if v_nth is null then
    return false;
  end if;
  -- First date in the month that falls on this weekday, then step to the nth.
  v_first := v_month_start + ((extract(dow from p_date)::int - extract(dow from v_month_start)::int + 7) % 7);
  return p_date = v_first + (v_nth - 1) * 7;
end;
$$;

-- ===== 4. What a date resolves to, and what it costs to take =====
-- state: 'pinned' | 'cleared' | 'open'
-- price_cents: what a host pays to take the date now. 0 = free claim. null = not available.
drop function if exists public.motd_resolve(date);
create function public.motd_resolve(p_date date)
returns table (mic_id text, source text, state text, entry_id uuid,
               holder_user_id uuid, holder_price_cents integer, price_cents integer)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c public.mic_of_the_day_config;
  w public.mic_of_the_day_entries;
  s text;
  v_paid_day boolean;
begin
  select * into c from public.mic_of_the_day_config limit 1;
  v_paid_day := p_date >= c.paid_from;

  select * into w from public.mic_of_the_day_entries e
  where e.target_date = p_date and e.status in ('won', 'paid');

  if found then
    return query select
      w.mic_id, w.source,
      case when w.mic_id is null then 'cleared' else 'pinned' end,
      w.id, w.host_user_id, coalesce(w.price_paid_cents, 0),
      -- An admin pick or a free claim cannot be bought out. A paid spot can.
      case when v_paid_day and w.source = 'bid'
           then coalesce(w.price_paid_cents, 0) + c.increment_cents end;
    return;
  end if;

  select st.mic_id into s from public.mic_of_the_day_standing st
  where st.day_of_week = extract(dow from p_date)::int;
  if found then
    return query select s, 'standing'::text, 'pinned'::text, null::uuid, null::uuid, 0,
      case when v_paid_day then c.start_price_cents end;
    return;
  end if;

  return query select null::text, null::text, 'open'::text, null::uuid, null::uuid, 0,
    case when v_paid_day then c.start_price_cents else 0 end;
end;
$$;

-- The one call the site makes.
create or replace function public.motd_week()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c public.mic_of_the_day_config;
  v_today date := public.motd_today();
  v_user uuid := auth.uid();
  v_days jsonb;
  v_mine jsonb := '[]'::jsonb;
begin
  select * into c from public.mic_of_the_day_config limit 1;

  select jsonb_agg(jsonb_build_object(
           'date', d::date,
           'mic_id', r.mic_id,
           'source', r.source,
           'state', r.state,
           'price_cents', r.price_cents,
           'holder_price_cents', r.holder_price_cents,
           'mine', coalesce(v_user is not null and r.holder_user_id = v_user, false)
         ) order by d)
  into v_days
  from generate_series(v_today, v_today + c.days_ahead, interval '1 day') d
  cross join lateral public.motd_resolve(d::date) r;

  if v_user is not null then
    -- The host's latest finished bid per date, so the site can say "you were outbid".
    select coalesce(jsonb_agg(jsonb_build_object(
             'id', x.id, 'date', x.target_date, 'mic_id', x.mic_id, 'status', x.status,
             'price_cents', x.price_paid_cents, 'refund_cents', x.refund_cents)), '[]'::jsonb)
    into v_mine
    from (
      select distinct on (e.target_date) e.*
      from public.mic_of_the_day_entries e
      where e.host_user_id = v_user and e.target_date >= v_today
        and e.source in ('bid', 'free') and e.status in ('won', 'paid', 'outbid', 'void')
      order by e.target_date, e.created_at desc
    ) x;
  end if;

  return jsonb_build_object(
    'today', v_today,
    'config', jsonb_build_object(
      'paid_from', c.paid_from, 'start_price_cents', c.start_price_cents,
      'increment_cents', c.increment_cents, 'refund_under_minutes', c.refund_under_minutes),
    'days', coalesce(v_days, '[]'::jsonb),
    'mine', v_mine
  );
end;
$$;

-- ===== 5. Shared checks for a claim =====
create or replace function public.motd_check_claim(p_user uuid, p_mic_id text, p_date date)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c public.mic_of_the_day_config;
  v_today date := public.motd_today();
begin
  select * into c from public.mic_of_the_day_config limit 1;

  if p_user is null then
    raise exception 'Sign in to claim Mic of the Day.';
  end if;
  if p_date < v_today or p_date > v_today + c.days_ahead then
    raise exception 'You can claim today or up to % days ahead.', c.days_ahead;
  end if;
  if not exists (select 1 from public.mic_hosts h where h.user_id = p_user and h.mic_id::text = p_mic_id) then
    raise exception 'Claim this mic as its host first.';
  end if;
  if not public.motd_runs_on(p_mic_id, p_date) then
    raise exception 'That mic is not listed as running on %.', to_char(p_date, 'FMDay, Mon FMDD');
  end if;
end;
$$;

-- ===== 6. Free claim (dates before paid_from) =====
create or replace function public.motd_claim_free(p_mic_id text, p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  c public.mic_of_the_day_config;
  r record;
  v_id uuid;
begin
  perform public.motd_check_claim(v_user, p_mic_id, p_date);
  perform pg_advisory_xact_lock(8675309, (p_date - date '2000-01-01'));
  select * into c from public.mic_of_the_day_config limit 1;

  -- Free pins go live at once, so only hosts Comediq has verified can take one.
  if not exists (select 1 from public.mic_hosts h
                 where h.user_id = v_user and h.mic_id::text = p_mic_id and h.is_verified) then
    raise exception 'Your host claim is waiting for Comediq to verify it. You can claim a free day as soon as it is.';
  end if;

  select * into r from public.motd_resolve(p_date);
  if r.price_cents is distinct from 0 then
    raise exception 'That day is not free to claim.';
  end if;

  if (select count(*) from public.mic_of_the_day_entries e
      where e.host_user_id = v_user and e.source = 'free' and e.status = 'won') >= c.free_claims_per_host then
    raise exception 'The free launch offer is % day per host, and you have used it.', c.free_claims_per_host;
  end if;

  insert into public.mic_of_the_day_entries
    (target_date, mic_id, host_user_id, status, source, price_paid_cents, live_from)
  values (p_date, p_mic_id, v_user, 'won', 'free', 0, now())
  returning id into v_id;

  insert into public.mic_of_the_day_draw_log (target_date, event, winner_entry_id, detail)
  values (p_date, 'free_claim', v_id, 'Free launch claim.');
  return jsonb_build_object('id', v_id, 'date', p_date, 'mic_id', p_mic_id);
end;
$$;

-- ===== 7. Paid claim: start (called by create-checkout-session) =====
-- Returns the amount to charge. Starting a checkout does not hold the date; whoever's
-- payment succeeds first at the current price gets it.
create or replace function public.motd_start_bid(p_user uuid, p_mic_id text, p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_id uuid;
begin
  perform public.motd_check_claim(p_user, p_mic_id, p_date);

  select * into r from public.motd_resolve(p_date);
  if r.price_cents is null or r.price_cents <= 0 then
    raise exception 'That day cannot be bought right now.';
  end if;
  if r.holder_user_id = p_user then
    raise exception 'You already hold that day.';
  end if;

  insert into public.mic_of_the_day_entries
    (target_date, mic_id, host_user_id, status, source, price_paid_cents)
  values (p_date, p_mic_id, p_user, 'pending', 'bid', r.price_cents)
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'amount_cents', r.price_cents, 'date', p_date);
end;
$$;

-- ===== 8. Paid claim: finish (called by stripe-webhook after the payment succeeds) =====
-- Returns {result, refunds: [{entry_id, payment_intent, amount_cents}]}. The webhook sends
-- each refund through Stripe and then calls motd_mark_refunded. Calling this again for the
-- same entry is safe and returns any refunds that are still owed for that date.
drop function if exists public.motd_mark_paid(uuid, text, integer);
create or replace function public.motd_mark_paid(
  p_entry_id uuid, p_session_id text, p_amount_cents integer, p_payment_intent text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.mic_of_the_day_config;
  e public.mic_of_the_day_entries;
  r record;
  v_day_start timestamptz;
  v_listed integer;
  v_result text;
begin
  select * into e from public.mic_of_the_day_entries where id = p_entry_id;
  if not found then
    return jsonb_build_object('result', 'not_found', 'refunds', '[]'::jsonb);
  end if;
  perform pg_advisory_xact_lock(8675309, (e.target_date - date '2000-01-01'));
  select * into e from public.mic_of_the_day_entries where id = p_entry_id for update;
  select * into c from public.mic_of_the_day_config limit 1;

  if e.status = 'pending' then
    select * into r from public.motd_resolve(e.target_date);

    if r.price_cents is not null and r.price_cents > 0 and p_amount_cents >= r.price_cents
       and e.target_date >= public.motd_today() then
      -- Whoever held the spot is outbid. Under an hour pinned on the day: full refund.
      if r.entry_id is not null then
        v_day_start := e.target_date::timestamp at time zone 'America/New_York';
        select greatest(0, floor(extract(epoch from now() - greatest(h.live_from, v_day_start))))::integer
        into v_listed
        from public.mic_of_the_day_entries h where h.id = r.entry_id;

        update public.mic_of_the_day_entries h
        set status = 'outbid', outbid_at = now(), listed_seconds = v_listed,
            refund_cents = case when v_listed < c.refund_under_minutes * 60
                                 and coalesce(h.price_paid_cents, 0) > 0 then h.price_paid_cents end,
            refund_reason = case when v_listed < c.refund_under_minutes * 60
                                  and coalesce(h.price_paid_cents, 0) > 0
                                 then 'Outbid after ' || (v_listed / 60) || ' min pinned' end
        where h.id = r.entry_id;
      end if;

      update public.mic_of_the_day_entries
      set status = 'paid', paid_at = now(), live_from = now(), price_paid_cents = p_amount_cents,
          stripe_session_id = p_session_id, stripe_payment_intent = p_payment_intent
      where id = e.id;
      v_result := 'paid';
    else
      -- Someone else's payment landed first, or the day is over. Money goes straight back.
      update public.mic_of_the_day_entries
      set status = 'void', paid_at = now(), price_paid_cents = p_amount_cents,
          stripe_session_id = p_session_id, stripe_payment_intent = p_payment_intent,
          refund_cents = p_amount_cents, refund_reason = 'Spot was taken before this payment arrived'
      where id = e.id;
      v_result := 'too_late';
    end if;

    insert into public.mic_of_the_day_draw_log (target_date, event, winner_entry_id, detail)
    values (e.target_date, v_result, e.id, '$' || (p_amount_cents / 100) || ', Stripe session ' || coalesce(p_session_id, '?'));
  else
    v_result := 'already_' || e.status;
  end if;

  return jsonb_build_object(
    'result', v_result,
    'refunds', coalesce((
      select jsonb_agg(jsonb_build_object('entry_id', x.id, 'payment_intent', x.stripe_payment_intent,
                                          'amount_cents', x.refund_cents))
      from public.mic_of_the_day_entries x
      where x.target_date = e.target_date and x.refund_cents is not null
        and x.refunded_at is null and x.stripe_payment_intent is not null), '[]'::jsonb));
end;
$$;

create or replace function public.motd_mark_refunded(p_entry_id uuid, p_refund_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.mic_of_the_day_entries;
begin
  -- The Stripe webhook (service role) or an admin marking a refund sent by hand.
  if auth.uid() is not null and not public.motd_is_admin() then
    raise exception 'Admins only.';
  end if;
  update public.mic_of_the_day_entries
  set refunded_at = now(), stripe_refund_id = p_refund_id
  where id = p_entry_id and refund_cents is not null and refunded_at is null
  returning * into e;
  if e.id is not null then
    insert into public.mic_of_the_day_draw_log (target_date, event, winner_entry_id, detail)
    values (e.target_date, 'refunded', e.id, '$' || (e.refund_cents / 100) || '. ' || coalesce(e.refund_reason, ''));
  end if;
end;
$$;

-- ===== 9. Admin: override, clear, reset =====
--   set    pin p_mic_id on the date for free ("comp"), replacing whoever was there
--   clear  leave the date deliberately blank (also blanks a standing day)
--   reset  undo an admin set/clear, back to the standing pick or open
-- A paying host who is displaced is recorded as owed a full refund; it shows under
-- "Refunds owed" in Admin and is sent from the Stripe dashboard.
drop function if exists public.motd_admin_set_day(date, text, uuid);
create or replace function public.motd_admin_set_day(p_date date, p_action text, p_mic_id text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if not public.motd_is_admin() then
    raise exception 'Admins only.';
  end if;
  perform pg_advisory_xact_lock(8675309, (p_date - date '2000-01-01'));

  if p_action in ('set', 'clear') then
    if p_action = 'set' and p_mic_id is null then
      raise exception 'Pick a mic.';
    end if;
    update public.mic_of_the_day_entries
    set status = 'outbid', outbid_at = now(),
        refund_cents = case when source = 'bid' and coalesce(price_paid_cents, 0) > 0 then price_paid_cents end,
        refund_reason = case when source = 'bid' and coalesce(price_paid_cents, 0) > 0 then 'Replaced by Comediq' end
    where target_date = p_date and status in ('won', 'paid');
    insert into public.mic_of_the_day_entries
      (target_date, mic_id, host_user_id, status, source, price_paid_cents, live_from)
    values (p_date, case when p_action = 'set' then p_mic_id end, v_user, 'paid', 'admin', 0, now());
  elsif p_action = 'reset' then
    update public.mic_of_the_day_entries set status = 'outbid', outbid_at = now()
    where target_date = p_date and source = 'admin' and status in ('won', 'paid');
  else
    raise exception 'Unknown action %', p_action;
  end if;

  insert into public.mic_of_the_day_draw_log (target_date, event, detail)
  values (p_date, 'admin_' || p_action, coalesce(p_mic_id, ''));
  return public.motd_week();
end;
$$;

-- ===== 10. Who may call what =====
revoke all on function public.motd_runs_on(text, date) from public;
revoke all on function public.motd_resolve(date) from public;
revoke all on function public.motd_check_claim(uuid, text, date) from public;
revoke all on function public.motd_claim_free(text, date) from public;
revoke all on function public.motd_start_bid(uuid, text, date) from public;
revoke all on function public.motd_mark_paid(uuid, text, integer, text) from public;
revoke all on function public.motd_mark_refunded(uuid, text) from public;

grant execute on function public.motd_week() to anon, authenticated;
grant execute on function public.motd_claim_free(text, date) to authenticated;
grant execute on function public.motd_admin_set_day(date, text, text) to authenticated;
grant execute on function public.motd_mark_refunded(uuid, text) to authenticated, service_role;
grant execute on function public.motd_start_bid(uuid, text, date) to service_role;
grant execute on function public.motd_mark_paid(uuid, text, integer, text) to service_role;

-- ===== 11. Host claiming =====
-- claim_mic_host is what "Claim This Mic" and "This is my mic" call. It was missing on the
-- live database. The mic id is text here and the insert is built as a statement so it
-- works whether mic_hosts.mic_id is text or uuid. No ON CONFLICT: the live table has no
-- unique rule on (user_id, mic_id).
drop function if exists public.claim_mic_host(uuid);
create or replace function public.claim_mic_host(p_mic_id text)
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
  if not exists (select 1 from public.open_mics_historical m where m.unique_identifier::text = p_mic_id) then
    raise exception 'That mic was not found.';
  end if;

  select * into v_row from public.mic_hosts h
  where h.user_id = v_user and h.mic_id::text = p_mic_id
  limit 1;

  if not found then
    execute format('insert into public.mic_hosts (user_id, mic_id, is_verified) values (%L, %L, false)',
                   v_user, p_mic_id);
    select * into v_row from public.mic_hosts h
    where h.user_id = v_user and h.mic_id::text = p_mic_id
    limit 1;
  end if;

  return v_row;
end;
$$;

revoke all on function public.claim_mic_host(text) from public;
grant execute on function public.claim_mic_host(text) to authenticated;

-- ===== 20261112120000_fix_signup_text_uuid.sql =====
-- The signup sheet for a mic failed to load with: operator does not exist: text = uuid
-- (seen on /mic/<slug>/signup). Somewhere in the live database an id column is text where
-- the code compares it to a uuid. Comparing both sides as text works whichever type the
-- column really has, so these functions and the event policy now do that.

create or replace function public.get_or_create_system_host(mic_id_param uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  host_record_id uuid;
begin
  select id into host_record_id
  from public.mic_hosts
  where mic_id::text = mic_id_param::text
    and is_verified = true
  limit 1;

  if host_record_id is not null then
    return host_record_id;
  end if;

  select id into host_record_id
  from public.mic_hosts
  where mic_id::text = mic_id_param::text
    and user_id::text = auth.uid()::text
  limit 1;

  if host_record_id is not null then
    return host_record_id;
  end if;

  insert into public.mic_hosts (user_id, mic_id, is_verified)
  values (auth.uid(), mic_id_param, false)
  returning id into host_record_id;

  return host_record_id;
end;
$$;

grant execute on function public.get_or_create_system_host(uuid) to authenticated;

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

  select * into v_row from public.mic_hosts
  where user_id::text = v_user::text and mic_id::text = p_mic_id::text;

  if v_row.id is null then
    insert into public.mic_hosts (user_id, mic_id, is_verified)
    values (v_user, p_mic_id, false)
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

revoke all on function public.claim_mic_host(uuid) from public;
grant execute on function public.claim_mic_host(uuid) to authenticated;

drop policy if exists "Authenticated users can create events" on public.mic_signup_events;
create policy "Authenticated users can create events"
on public.mic_signup_events
for insert
to authenticated
with check (
  host_id::text in (
    select id::text from public.mic_hosts where user_id::text = auth.uid()::text
  )
);
