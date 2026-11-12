-- Opening a mic's signup sheet failed with:
--   new row violates row-level security policy for table "mic_signup_events"
-- The page created the sheet from the visitor's browser, and the rule only lets a sheet be
-- created under a host row the visitor owns. But a mic can already have a verified host
-- (for Gdrink at Gnihton, the admins), so the page was handed someone else's host row.
--
-- Now one database function opens the sheet. It finds the mic's next open sheet, or creates
-- it under the mic's verified host (or, if there is none, under the caller as a new
-- unverified host). Any signed-in visitor can call it; it only ever makes a plain first-come,
-- 15 spot sheet for a date and cannot do anything else. Works whether the id columns are
-- text or uuid.

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
  v_row public.mic_signup_events;
begin
  if v_user is null then
    raise exception 'Must be authenticated';
  end if;

  -- two people opening the same sheet at once must not make two
  perform pg_advisory_xact_lock(hashtext('signup_event:' || p_mic_id));

  select * into v_row
  from public.mic_signup_events e
  where e.mic_id::text = p_mic_id
    and e.is_active = true
    and e.event_date >= (now() at time zone 'America/New_York')::date
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

  execute format(
    'insert into public.mic_signup_events (mic_id, host_id, event_date, event_time, total_spots, spots_remaining, signup_mode, is_active) values (%L, %L, %L, %L, 15, 15, %L, true) returning *',
    p_mic_id, v_host, p_event_date, nullif(p_event_time, ''), 'first_come'
  ) into v_row;

  return v_row;
end;
$$;

revoke all on function public.get_or_create_signup_event(text, text, text) from public;
grant execute on function public.get_or_create_signup_event(text, text, text) to authenticated;
