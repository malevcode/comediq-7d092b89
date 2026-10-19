-- Time-block signup mode, layered onto the existing mic_signup_events /
-- mic_signups / mic_hosts tables. Pilot: exactly one mic opts in. The
-- existing first_come / lottery / bucket flow is untouched: every new
-- column below is nullable and every new RLS policy or RPC is additive,
-- it does not alter anything the legacy signup sheet depends on.

alter type public.signup_mode add value if not exists 'time_block';

alter table public.mic_signup_events
  add column if not exists slot_minutes integer,
  add column if not exists spots_per_slot integer,
  add column if not exists slot_count integer,
  add column if not exists min_signups integer default 4,
  add column if not exists signup_rules text,
  add column if not exists mic_display_name text,
  add column if not exists venue_display_name text;

-- Denormalized on purpose. The time-block signup page reads only this one
-- event row, never open_mics_historical and never the full mics list, so
-- the mic and venue name need to live here too.
comment on column public.mic_signup_events.mic_display_name is
  'Denormalized so the signup page never has to read open_mics_historical.';
comment on column public.mic_signup_events.venue_display_name is
  'Denormalized so the signup page never has to read open_mics_historical.';

alter table public.mic_hosts
  add column if not exists slug text unique;

comment on column public.mic_hosts.slug is
  'Stable shareable link for this host''s time-block signup page. Null means this host has not opted into time-block mode.';

alter table public.mic_signups
  add column if not exists slot_start time;

create index if not exists mic_signups_event_slot_idx
  on public.mic_signups (event_id, slot_start)
  where status = 'confirmed';

-- A host row becomes publicly readable only once it has a slug, so a
-- comedian can resolve the shareable signup link without being the host or
-- an admin. Hosts with no slug (everyone who has not opted into time-block
-- mode) stay exactly as private as the original policies left them.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'mic_hosts'
      and policyname = 'Anyone can view a host row by its public slug'
  ) then
    create policy "Anyone can view a host row by its public slug"
      on public.mic_hosts for select
      using (slug is not null);
  end if;
end $$;

-- Spots left, no names, no signup rows. Safe for anon so the public signup
-- page works before anyone logs in.
create or replace function public.get_time_block_slot_counts(p_event_id uuid)
returns table (slot_start time, confirmed_count integer)
language sql
security definer
set search_path = public
stable
as $$
  with event as (
    select e.event_time, e.slot_minutes, e.slot_count
    from public.mic_signup_events e
    where e.id = p_event_id
      and e.signup_mode = 'time_block'
      and e.is_active = true
  ),
  blocks as (
    select (
      event.event_time
      + (n * coalesce(event.slot_minutes, 10)) * interval '1 minute'
    )::time as slot_start
    from event, generate_series(0, greatest(coalesce(event.slot_count, 1), 1) - 1) as n
  )
  select
    blocks.slot_start,
    coalesce(count(s.id), 0)::integer as confirmed_count
  from blocks
  left join public.mic_signups s
    on s.event_id = p_event_id
    and s.slot_start = blocks.slot_start
    and s.status = 'confirmed'
  group by blocks.slot_start
  order by blocks.slot_start;
$$;

revoke all on function public.get_time_block_slot_counts(uuid) from public;
grant execute on function public.get_time_block_slot_counts(uuid) to anon, authenticated;

-- One slot per person. Locks the event row so two people who both read
-- "1 of 1 spots left" cannot both insert and take the same last spot.
-- An upsert on (event_id, user_id) so cancelling and signing up again,
-- including for a different slot, both work.
create or replace function public.signup_for_mic_slot(p_event_id uuid, p_slot_start time)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_event record;
  v_spots_per_slot integer;
  v_taken integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select e.* into v_event
  from public.mic_signup_events e
  where e.id = p_event_id
  for update;

  if v_event.id is null then
    raise exception 'Signup sheet not found';
  end if;

  if v_event.signup_mode <> 'time_block' then
    raise exception 'This signup sheet is not time-block mode';
  end if;

  if not v_event.is_active then
    raise exception 'This signup sheet is closed';
  end if;

  if v_event.event_date < current_date then
    raise exception 'This signup sheet has already passed';
  end if;

  v_spots_per_slot := coalesce(v_event.spots_per_slot, 1);

  select count(*) into v_taken
  from public.mic_signups s
  where s.event_id = p_event_id
    and s.slot_start = p_slot_start
    and s.status = 'confirmed'
    and s.user_id <> v_user_id;

  if v_taken >= v_spots_per_slot then
    raise exception 'That slot is full';
  end if;

  insert into public.mic_signups (event_id, user_id, slot_start, status)
  values (p_event_id, v_user_id, p_slot_start, 'confirmed')
  on conflict (event_id, user_id)
  do update set
    slot_start = excluded.slot_start,
    status = 'confirmed',
    updated_at = now();

  return jsonb_build_object(
    'status', 'confirmed',
    'slot_start', p_slot_start,
    'spots_left', greatest(v_spots_per_slot - v_taken - 1, 0)
  );
end;
$$;

revoke all on function public.signup_for_mic_slot(uuid, time) from public;
grant execute on function public.signup_for_mic_slot(uuid, time) to authenticated;

-- Names, visible only to that mic's verified host or an admin. The
-- existing "anyone can view signups for active events" policy on
-- mic_signups is what the legacy list mode's public spot counter depends
-- on, so it is left untouched here. This function does not rely on it, it
-- checks the caller directly and returns only what a host needs to run
-- the list.
create or replace function public.get_mic_slot_host_view(p_event_id uuid)
returns table (slot_start time, display_name text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_caller uuid := auth.uid();
  v_is_host boolean;
  v_is_admin boolean;
begin
  if v_caller is null then
    raise exception 'Authentication required';
  end if;

  select exists (
    select 1
    from public.mic_signup_events e
    join public.mic_hosts h on h.id = e.host_id
    where e.id = p_event_id
      and h.user_id = v_caller
      and h.is_verified = true
  ) into v_is_host;

  select exists (
    select 1 from public.profiles
    where profiles.user_id = v_caller
      and profiles.isadmin = true
  ) into v_is_admin;

  if not v_is_host and not v_is_admin then
    raise exception 'Only this mic''s host or an admin can view signups';
  end if;

  return query
    select
      s.slot_start,
      coalesce(s.guest_name, p.username, 'Comedian') as display_name,
      s.created_at
    from public.mic_signups s
    left join public.profiles p on p.user_id = s.user_id
    where s.event_id = p_event_id
      and s.status = 'confirmed'
    order by s.slot_start, s.created_at;
end;
$$;

revoke all on function public.get_mic_slot_host_view(uuid) from public;
grant execute on function public.get_mic_slot_host_view(uuid) to authenticated;
