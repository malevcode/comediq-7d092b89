-- Pick your spot: a digital version of the paper list a host prints every week.
--
-- 1. Sign up: the sheet opens N days before the mic (default 3). Everyone sees how many spots are
--    left, nobody sees names.
-- 2. Check in: at the venue (GPS, the existing check_in_mic), you pick any open lineup number.
--    A walk-in with no signup can check in and pick too, if the sheet is not full.
--    Once you are checked in you see every checked-in name.
-- 3. Run of show: the host taps "Next comic" and posts short notes. Everyone sees who is up and
--    how many comics are before them.
--
-- Turned on per mic with one row in mic_lineup_settings. Everything here is additive.

-- Per-mic switch. A new sheet for the mic picks these up automatically (trigger below).
create table if not exists public.mic_lineup_settings (
  mic_id text primary key,
  lineup_mode text not null default 'pick_spot' check (lineup_mode in ('pick_spot')),
  opens_days_before integer not null default 3 check (opens_days_before between 0 and 14),
  created_at timestamptz not null default now()
);
alter table public.mic_lineup_settings enable row level security;
drop policy if exists mic_lineup_settings_read on public.mic_lineup_settings;
create policy mic_lineup_settings_read on public.mic_lineup_settings for select using (true);

alter table public.mic_signup_events
  add column if not exists lineup_mode text,
  add column if not exists now_up_position integer,
  add column if not exists host_note text,
  add column if not exists host_note_at timestamptz;

alter table public.mic_signups
  add column if not exists lineup_spot integer;

-- one person per number on a sheet (cancelled signups free their number)
create unique index if not exists mic_signups_lineup_spot_unique
  on public.mic_signups (event_id, lineup_spot)
  where lineup_spot is not null and status::text = 'confirmed';

-- A new sheet for a pick-your-spot mic gets the mode and its opening time.
create or replace function public.apply_mic_lineup_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_set public.mic_lineup_settings;
begin
  select * into v_set from public.mic_lineup_settings where mic_id = new.mic_id::text;
  if v_set.mic_id is null then
    return new;
  end if;
  new.lineup_mode := v_set.lineup_mode;
  new.lineup_by_checkin := true;
  if new.signup_opens_at is null then
    -- midnight New York, N days before the mic
    new.signup_opens_at := ((left(new.event_date::text, 10))::date - v_set.opens_days_before)::timestamp
      at time zone 'America/New_York';
  end if;
  return new;
end;
$$;

drop trigger if exists apply_mic_lineup_settings on public.mic_signup_events;
create trigger apply_mic_lineup_settings
  before insert on public.mic_signup_events
  for each row execute function public.apply_mic_lineup_settings();

-- Nobody can sign up before the sheet opens (signups are direct inserts from the page).
create or replace function public.enforce_signup_window()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_opens timestamptz;
begin
  select signup_opens_at into v_opens from public.mic_signup_events where id = new.event_id;
  -- a walk-in already checked in at the venue is never blocked by the online window
  if new.lineup_spot is not null and public.has_event_checkin(new.event_id, new.user_id) then
    return new;
  end if;
  if v_opens is not null and now() < v_opens then
    raise exception 'Signups for this mic open %',
      to_char(v_opens at time zone 'America/New_York', 'Dy Mon FMDD "at" FMHH12:MI AM');
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_signup_window on public.mic_signups;
create trigger enforce_signup_window
  before insert on public.mic_signups
  for each row execute function public.enforce_signup_window();

-- A lineup number can only be set by someone checked in at the venue (people can update their own
-- signup row directly, so this guards that path too).
create or replace function public.guard_lineup_spot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.lineup_spot is not null and new.lineup_spot is distinct from old.lineup_spot
     and not public.has_event_checkin(new.event_id, new.user_id) then
    raise exception 'Check in at the venue first';
  end if;
  return new;
end;
$$;

-- Is the signed-in user a verified host of this sheet's mic (or an admin)?
create or replace function public.is_event_host(p_event_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.is_current_user_admin(), false) or exists (
    select 1
    from public.mic_signup_events e
    join public.mic_hosts h on h.mic_id::text = e.mic_id::text
    where e.id = p_event_id and h.user_id = auth.uid() and h.is_verified = true
  );
$$;

-- Has this user got a verified check-in at the sheet's mic on the sheet's date (New York time)?
create or replace function public.has_event_checkin(p_event_id uuid, p_user uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.mic_signup_events e
    join public.user_mic_checkins ck on ck.mic_id::text = e.mic_id::text
    where e.id = p_event_id
      and ck.user_id = p_user
      and ck.is_verified is true
      and to_char(ck.checked_in_at at time zone 'America/New_York', 'YYYY-MM-DD') = left(e.event_date::text, 10)
  );
$$;

-- Step 2: pick a lineup number. Must be checked in at the venue. Walk-ins get signed up here.
create or replace function public.pick_lineup_spot(p_event_id uuid, p_spot integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ev public.mic_signup_events;
  v_signup public.mic_signups;
  v_taken integer;
  v_name text;
begin
  if v_user is null then
    raise exception 'Sign in to pick a spot';
  end if;

  select * into v_ev from public.mic_signup_events where id = p_event_id and is_active = true;
  if v_ev.id is null then
    raise exception 'This signup sheet is closed';
  end if;
  if coalesce(v_ev.lineup_mode, '') <> 'pick_spot' then
    raise exception 'This mic does not use pick-your-spot';
  end if;
  if p_spot is null or p_spot < 1 or p_spot > v_ev.total_spots then
    raise exception 'Pick a number from 1 to %', v_ev.total_spots;
  end if;
  if v_ev.now_up_position is not null and p_spot <= v_ev.now_up_position then
    raise exception 'That spot has already gone up';
  end if;
  if not public.has_event_checkin(p_event_id, v_user) then
    raise exception 'Check in at the venue first';
  end if;

  perform pg_advisory_xact_lock(hashtext('lineup_spot:' || p_event_id::text));

  select * into v_signup from public.mic_signups
  where event_id = p_event_id and user_id = v_user and status::text = 'confirmed'
  limit 1;

  if v_signup.id is not null and v_signup.lineup_spot is not null
     and v_ev.now_up_position is not null and v_signup.lineup_spot <= v_ev.now_up_position then
    raise exception 'You already went up';
  end if;

  if exists (
    select 1 from public.mic_signups
    where event_id = p_event_id and lineup_spot = p_spot and status::text = 'confirmed'
      and user_id is distinct from v_user
  ) then
    return jsonb_build_object('status', 'taken');
  end if;

  if v_signup.id is null then
    -- walk-in: only if there is still room
    select count(*) into v_taken from public.mic_signups
    where event_id = p_event_id and status::text = 'confirmed';
    if v_taken >= v_ev.total_spots then
      raise exception 'The list is full';
    end if;
    select p.username into v_name from public.profiles p where p.user_id = v_user;
    -- a walk-in already checked in at the venue, so the online window does not apply (see enforce_signup_window)
    insert into public.mic_signups (event_id, user_id, guest_name, status, lineup_spot)
    values (p_event_id, v_user, v_name, 'confirmed', p_spot)
    returning * into v_signup;
    return jsonb_build_object('status', 'picked', 'spot', p_spot, 'walk_in', true);
  end if;

  update public.mic_signups set lineup_spot = p_spot, updated_at = now() where id = v_signup.id;
  return jsonb_build_object('status', 'picked', 'spot', p_spot, 'walk_in', false);
end;
$$;

drop trigger if exists guard_lineup_spot on public.mic_signups;
create trigger guard_lineup_spot
  before update on public.mic_signups
  for each row execute function public.guard_lineup_spot();

-- Everything the pick-your-spot page needs in one small read.
-- Names only go to people who are checked in, and to the host.
create or replace function public.get_pick_lineup(p_event_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ev public.mic_signup_events;
  v_is_host boolean := public.is_event_host(p_event_id);
  v_me_checked boolean := v_user is not null and public.has_event_checkin(p_event_id, v_user);
  v_show_names boolean;
  v_me public.mic_signups;
  v_rows jsonb;
  v_confirmed integer;
begin
  select * into v_ev from public.mic_signup_events where id = p_event_id;
  if v_ev.id is null then
    return null;
  end if;
  v_show_names := v_is_host or v_me_checked;

  select count(*) into v_confirmed from public.mic_signups
  where event_id = p_event_id and status::text = 'confirmed';

  if v_user is not null then
    select * into v_me from public.mic_signups
    where event_id = p_event_id and user_id = v_user and status::text = 'confirmed' limit 1;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'spot', s.lineup_spot,
    'is_me', s.user_id = v_user,
    'name', case when v_show_names or s.user_id = v_user
      then coalesce(nullif(btrim(s.guest_name), ''), p.username, 'Comedian') end
  ) order by s.lineup_spot), '[]'::jsonb)
  into v_rows
  from public.mic_signups s
  left join public.profiles p on p.user_id = s.user_id
  where s.event_id = p_event_id and s.status::text = 'confirmed' and s.lineup_spot is not null;

  return jsonb_build_object(
    'total_spots', v_ev.total_spots,
    'signed_up', v_confirmed,
    'checked_in', jsonb_array_length(v_rows),
    'signup_opens_at', v_ev.signup_opens_at,
    'now_up', v_ev.now_up_position,
    'host_note', v_ev.host_note,
    'host_note_at', v_ev.host_note_at,
    'is_host', v_is_host,
    'show_names', v_show_names,
    'me', jsonb_build_object(
      'signed_up', v_me.id is not null,
      'signup_id', v_me.id,
      'checked_in', v_me_checked,
      'spot', v_me.lineup_spot
    ),
    'spots', v_rows
  );
end;
$$;

-- Step 3: the host moves the lineup along and posts notes.
create or replace function public.host_update_lineup(
  p_event_id uuid,
  p_now_up integer default null,
  p_clear_now_up boolean default false,
  p_note text default null,
  p_clear_note boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_event_host(p_event_id) then
    raise exception 'Only the host of this mic can run the lineup';
  end if;
  update public.mic_signup_events set
    now_up_position = case when p_clear_now_up then null else coalesce(p_now_up, now_up_position) end,
    host_note = case when p_clear_note then null else coalesce(nullif(btrim(p_note), ''), host_note) end,
    host_note_at = case when p_clear_note then null
                        when nullif(btrim(p_note), '') is not null then now() else host_note_at end,
    updated_at = now()
  where id = p_event_id;
end;
$$;

revoke all on function public.pick_lineup_spot(uuid, integer) from public;
revoke all on function public.get_pick_lineup(uuid) from public;
revoke all on function public.host_update_lineup(uuid, integer, boolean, text, boolean) from public;
revoke all on function public.is_event_host(uuid) from public;
revoke all on function public.has_event_checkin(uuid, uuid) from public;
grant execute on function public.pick_lineup_spot(uuid, integer) to authenticated;
grant execute on function public.get_pick_lineup(uuid) to anon, authenticated;
grant execute on function public.host_update_lineup(uuid, integer, boolean, text, boolean) to authenticated;
grant execute on function public.is_event_host(uuid) to anon, authenticated;
