-- A new signup sheet every week, and last week's sheet archived.
--
-- Problem: the signup page showed every ACTIVE sheet and only made a new one when there were none, so last
-- week's sheet stayed active forever and nobody got a fresh list.
--
-- Now:
--   * "Archived" means is_active = false. The sheet and everyone on it are kept; it just stops showing as the live list.
--   * ensure_weekly_signup_events() archives sheets whose date has passed and creates the next sheet for every
--     weekly Comediq-signup mic that does not have one. A daily GitHub workflow calls it (no pg_cron here).
--   * get_or_create_signup_event also archives past sheets, so opening the page heals itself.
-- Works whether id columns are text or uuid and whether event_date is a date or text.

create or replace function public.archive_past_signup_events()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.mic_signup_events
  set is_active = false
  where is_active = true
    and event_date::text < to_char(now() at time zone 'America/New_York', 'YYYY-MM-DD');
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.ensure_weekly_signup_events()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'America/New_York')::date;
  v_archived integer;
  v_created integer := 0;
  r record;
  v_dow integer;
  v_date date;
  v_prev record;
begin
  v_archived := public.archive_past_signup_events();

  for r in
    select m.unique_identifier::text as mic_id, m.day, m.start_time
    from public.open_mics_historical m
    where m.active is true
      and (m.signup_method::text = 'comediq_slots' or m.slots_enabled is true)
      and coalesce(m.frequency::text, 'weekly') = 'weekly'
  loop
    v_dow := case initcap(btrim(r.day))
      when 'Sunday' then 0 when 'Monday' then 1 when 'Tuesday' then 2 when 'Wednesday' then 3
      when 'Thursday' then 4 when 'Friday' then 5 when 'Saturday' then 6 else null end;
    if v_dow is null then
      continue;
    end if;

    -- the next occurrence, today included
    v_date := v_today + ((v_dow - extract(dow from v_today)::int + 7) % 7);

    if exists (
      select 1 from public.mic_signup_events e
      where e.mic_id::text = r.mic_id and e.event_date::text = to_char(v_date, 'YYYY-MM-DD')
    ) then
      continue;
    end if;

    -- same host and settings as the mic's most recent sheet; a mic with no sheet yet is made on first visit instead
    select e.host_id::text as host_id, e.total_spots, e.lineup_by_checkin into v_prev
    from public.mic_signup_events e
    where e.mic_id::text = r.mic_id
    order by e.event_date desc
    limit 1;

    if v_prev.host_id is null then
      continue;
    end if;

    execute format(
      'insert into public.mic_signup_events (mic_id, host_id, event_date, event_time, total_spots, spots_remaining, signup_mode, is_active, lineup_by_checkin) values (%L, %L, %L, %L, %L, %L, %L, true, %L)',
      r.mic_id, v_prev.host_id, to_char(v_date, 'YYYY-MM-DD'), r.start_time,
      coalesce(v_prev.total_spots, 15), coalesce(v_prev.total_spots, 15), 'first_come', coalesce(v_prev.lineup_by_checkin, false)
    );
    v_created := v_created + 1;
  end loop;

  return jsonb_build_object('archived', v_archived, 'created', v_created);
end;
$$;

revoke all on function public.archive_past_signup_events() from public;
revoke all on function public.ensure_weekly_signup_events() from public;
grant execute on function public.ensure_weekly_signup_events() to service_role;
grant execute on function public.archive_past_signup_events() to service_role;

-- opening the page also archives old sheets
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
  perform public.archive_past_signup_events();

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
