-- Lineup by arrival.
--
-- For some mics (first: Gdrink at Gnihton) a signup holds one of the 15 spots, but the
-- running order is set by WHEN YOU ARRIVE: the order people check in at the mic, using the
-- GPS check-in (check_in_mic) that already exists. Comics who have signed up but are not
-- there yet wait at the bottom.
--
-- Works whether the live id columns are text or uuid and whether event_date is a date or text.

alter table public.mic_signup_events
  add column if not exists lineup_by_checkin boolean not null default false;

-- Gdrink at Gnihton
update public.mic_signup_events
set lineup_by_checkin = true
where mic_id::text = '21c4c8b9-8cc2-42d6-8a60-2534c75dfdaf';

-- The signup sheet for a date: first_come, 15 spots, under the mic's verified host. A new
-- sheet keeps the lineup rule of the mic's last sheet, so next Thursday still runs by arrival.
create or replace function public.get_or_create_signup_event(
  p_mic_id text,
  p_event_date text,
  p_event_time text default null
)
returns public.mic_signup_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_host text;
  v_lineup boolean;
  v_row public.mic_signup_events;
begin
  if v_user is null then
    raise exception 'Must be authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtext('signup_event:' || p_mic_id));

  select * into v_row
  from public.mic_signup_events e
  where e.mic_id::text = p_mic_id
    and e.is_active = true
    and e.event_date::text >= to_char(now() at time zone 'America/New_York', 'YYYY-MM-DD')
  order by e.event_date asc
  limit 1;

  if v_row.id is not null then
    return v_row;
  end if;

  select h.id::text into v_host
  from public.mic_hosts h
  where h.mic_id::text = p_mic_id and h.is_verified = true
  order by h.created_at asc
  limit 1;

  if v_host is null then
    select h.id::text into v_host
    from public.mic_hosts h
    where h.mic_id::text = p_mic_id and h.user_id::text = v_user::text
    limit 1;
  end if;

  if v_host is null then
    insert into public.mic_hosts (user_id, mic_id, is_verified)
    values (v_user, p_mic_id::uuid, false);
    select h.id::text into v_host
    from public.mic_hosts h
    where h.mic_id::text = p_mic_id and h.user_id::text = v_user::text
    limit 1;
  end if;

  select e.lineup_by_checkin into v_lineup
  from public.mic_signup_events e
  where e.mic_id::text = p_mic_id
  order by e.event_date desc
  limit 1;

  execute format(
    'insert into public.mic_signup_events (mic_id, host_id, event_date, event_time, total_spots, spots_remaining, signup_mode, is_active, lineup_by_checkin) values (%L, %L, %L, %L, 15, 15, %L, true, %L) returning *',
    p_mic_id, v_host, p_event_date, nullif(p_event_time, ''), 'first_come', coalesce(v_lineup, false)
  ) into v_row;

  return v_row;
end;
$$;

revoke all on function public.get_or_create_signup_event(text, text, text) from public;
grant execute on function public.get_or_create_signup_event(text, text, text) to authenticated;

-- Everyone signed up for a sheet, in running order: checked in (at the venue, by GPS) first by
-- arrival time, then the ones signed up but not there yet, by when they signed up.
create or replace function public.get_event_lineup(p_event_id uuid)
returns table (
  signup_id uuid,
  user_id uuid,
  display_name text,
  signed_up_at timestamptz,
  checked_in_at timestamptz,
  lineup_position integer
)
language sql
security definer
stable
set search_path = public
as $$
  with ev as (
    select e.id, e.mic_id::text as mic_id, e.event_date::text as event_date
    from public.mic_signup_events e
    where e.id = p_event_id
  ),
  rows as (
    select
      s.id as signup_id,
      s.user_id,
      coalesce(nullif(btrim(s.guest_name), ''), p.username, 'Comedian') as display_name,
      s.created_at as signed_up_at,
      c.checked_in_at
    from ev
    join public.mic_signups s on s.event_id = ev.id and s.status::text = 'confirmed'
    left join public.profiles p on p.user_id = s.user_id
    left join lateral (
      select ck.checked_in_at
      from public.user_mic_checkins ck
      where ck.user_id = s.user_id
        and ck.mic_id::text = ev.mic_id
        and ck.is_verified is true
        and (ck.checked_in_at at time zone 'America/New_York')::date::text = ev.event_date
      order by ck.checked_in_at asc
      limit 1
    ) c on true
  )
  select
    r.signup_id, r.user_id, r.display_name, r.signed_up_at, r.checked_in_at,
    (row_number() over (order by (r.checked_in_at is null), r.checked_in_at, r.signed_up_at))::integer as lineup_position
  from rows r
  order by lineup_position;
$$;

revoke all on function public.get_event_lineup(uuid) from public;
grant execute on function public.get_event_lineup(uuid) to authenticated;
