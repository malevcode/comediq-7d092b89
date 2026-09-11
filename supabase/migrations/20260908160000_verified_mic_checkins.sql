-- Verified mic check-ins.
--
-- Before this, "I Went Up" was an honour-system toggle you could tap from your couch.
-- Now the client sends its GPS reading and the database decides whether you were
-- actually at the venue, using the venue coordinates it already stores.
--
-- The distance test lives here on purpose: anything the client decides, the client
-- can lie about. The time-of-day test stays on the client because start_time is
-- free text ("9:30 PM") and is not reliable enough to hard-gate on in SQL.

alter table public.user_mic_checkins
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists accuracy_meters double precision,
  add column if not exists distance_meters double precision,
  add column if not exists is_verified boolean not null default false;

create index if not exists user_mic_checkins_user_date_idx
  on public.user_mic_checkins (user_id, checkin_date desc);

-- Straight-line distance between two points, in metres (haversine).
create or replace function public.checkin_distance_meters(
  p_lat1 double precision,
  p_lng1 double precision,
  p_lat2 double precision,
  p_lng2 double precision
)
returns double precision
language sql
immutable
as $$
  select 2 * 6371000 * asin(
    sqrt(
      power(sin(radians(p_lat2 - p_lat1) / 2), 2)
      + cos(radians(p_lat1)) * cos(radians(p_lat2))
        * power(sin(radians(p_lng2 - p_lng1) / 2), 2)
    )
  );
$$;

-- Record a check-in, but only if the reading puts the user at the venue.
--
-- p_accuracy_meters is the phone's own reported error. We forgive up to 200m of it,
-- because GPS in a basement bar is genuinely bad and punishing an honest reading
-- for being honest is the wrong trade.
create or replace function public.check_in_mic(
  p_mic_unique_identifier text,
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy_meters double precision default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := current_date;
  v_venue_lat double precision;
  v_venue_lng double precision;
  v_distance double precision;
  v_allowance double precision;
  v_allowed double precision;
  v_inserted_id uuid;
  v_radius constant double precision := 150;
  v_max_allowance constant double precision := 200;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_latitude is null or p_longitude is null then
    raise exception 'Location required to check in';
  end if;

  select latitude, longitude
  into v_venue_lat, v_venue_lng
  from public.open_mics_historical
  where unique_identifier = p_mic_unique_identifier;

  if not found then
    raise exception 'Mic not found';
  end if;

  if v_venue_lat is null or v_venue_lng is null then
    -- A handful of mics have never been geocoded. Nothing to measure against,
    -- so accept the check-in but do not call it verified.
    insert into public.user_mic_checkins
      (user_id, mic_id, checkin_date, latitude, longitude, accuracy_meters, is_verified)
    values
      (v_user_id, p_mic_unique_identifier::uuid, v_today, p_latitude, p_longitude,
       p_accuracy_meters, false)
    on conflict (user_id, mic_id, checkin_date) do nothing
    returning id into v_inserted_id;

    return jsonb_build_object(
      'status', case when v_inserted_id is null then 'already_checked_in' else 'checked_in' end,
      'verified', false,
      'reason', 'This venue has no coordinates on file yet.'
    );
  end if;

  v_distance := public.checkin_distance_meters(
    p_latitude, p_longitude, v_venue_lat, v_venue_lng
  );
  v_allowance := least(greatest(coalesce(p_accuracy_meters, 0), 0), v_max_allowance);
  v_allowed := v_radius + v_allowance;

  if v_distance > v_allowed then
    return jsonb_build_object(
      'status', 'too_far',
      'verified', false,
      'distance_meters', round(v_distance),
      'allowed_meters', round(v_allowed)
    );
  end if;

  insert into public.user_mic_checkins
    (user_id, mic_id, checkin_date, latitude, longitude, accuracy_meters,
     distance_meters, is_verified)
  values
    (v_user_id, p_mic_unique_identifier::uuid, v_today, p_latitude, p_longitude,
     p_accuracy_meters, v_distance, true)
  on conflict (user_id, mic_id, checkin_date) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    return jsonb_build_object(
      'status', 'already_checked_in',
      'verified', true,
      'distance_meters', round(v_distance)
    );
  end if;

  perform public.award_mic_point(v_user_id, p_mic_unique_identifier, 'checkin', 1);

  return jsonb_build_object(
    'status', 'checked_in',
    'verified', true,
    'distance_meters', round(v_distance),
    'points_awarded', 1
  );
end;
$$;

revoke all on function public.check_in_mic(text, double precision, double precision, double precision) from public;
grant execute on function public.check_in_mic(text, double precision, double precision, double precision) to authenticated;

-- Direct inserts are no longer how a check-in is created: the RPC is the only path
-- that can set is_verified, and it runs as definer. Users keep read and delete.
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_mic_checkins'
      and policyname = 'Users can insert their own checkins'
  ) then
    drop policy "Users can insert their own checkins" on public.user_mic_checkins;
  end if;
end $$;
