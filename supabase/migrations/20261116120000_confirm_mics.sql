-- Mic confirmation without Instagram DMs.
--
-- Two ways a mic gets confirmed, both recorded in mic_confirmations:
--   1. The host (or an admin) taps "Yes, still running" or "It ended" in the host dashboard.
--   2. Real use: when two different people have checked in at the venue (GPS verified) within
--      14 days, the mic counts as confirmed. No host effort at all.
-- Confirming sets last_confirmed_at and last_verified_at, which drives the "Verified <date>" label.
-- Works whether the live id columns are text or uuid.

create table if not exists public.mic_confirmations (
  id uuid primary key default gen_random_uuid(),
  mic_id text not null,
  user_id uuid,
  kind text not null check (kind in ('host', 'admin', 'checkins')),
  outcome text not null check (outcome in ('running', 'ended')),
  created_at timestamptz not null default now()
);
create index if not exists mic_confirmations_mic_idx on public.mic_confirmations (mic_id, created_at desc);
alter table public.mic_confirmations enable row level security;
-- no policies on purpose: only the functions below read or write it

create or replace function public.confirm_mic_status(p_mic_id text, p_outcome text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_is_admin boolean := false;
  v_is_host boolean := false;
begin
  if v_user is null then
    raise exception 'Must be authenticated';
  end if;
  if p_outcome not in ('running', 'ended') then
    raise exception 'Outcome must be running or ended';
  end if;

  select coalesce(bool_or(p.isadmin is true), false) into v_is_admin
  from public.profiles p where p.user_id::text = v_user::text;

  select exists (
    select 1 from public.mic_hosts h
    where h.mic_id::text = p_mic_id and h.user_id::text = v_user::text and h.is_verified is true
  ) into v_is_host;

  if not (v_is_admin or v_is_host) then
    raise exception 'Only this mic''s verified host can confirm it';
  end if;

  if not exists (select 1 from public.open_mics_historical m where m.unique_identifier::text = p_mic_id) then
    raise exception 'That mic was not found.';
  end if;

  if p_outcome = 'running' then
    update public.open_mics_historical
    set last_confirmed_at = now(), last_verified_at = now()
    where unique_identifier::text = p_mic_id;
  else
    update public.open_mics_historical
    set active = false
    where unique_identifier::text = p_mic_id;
  end if;

  insert into public.mic_confirmations (mic_id, user_id, kind, outcome)
  values (p_mic_id, v_user, case when v_is_host then 'host' else 'admin' end, p_outcome);

  return jsonb_build_object('status', p_outcome);
end;
$$;

revoke all on function public.confirm_mic_status(text, text) from public;
grant execute on function public.confirm_mic_status(text, text) to authenticated;

-- Two different people verified at the venue within 14 days = the mic is running.
create or replace function public.confirm_mic_from_checkins()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_people integer;
begin
  if new.is_verified is not true then
    return new;
  end if;

  select count(distinct c.user_id) into v_people
  from public.user_mic_checkins c
  where c.mic_id::text = new.mic_id::text
    and c.is_verified is true
    and c.checked_in_at >= now() - interval '14 days';

  if v_people >= 2
     and not exists (
       select 1 from public.mic_confirmations x
       where x.mic_id = new.mic_id::text and x.kind = 'checkins'
         and x.created_at >= now() - interval '7 days'
     ) then
    update public.open_mics_historical
    set last_confirmed_at = now(), last_verified_at = now()
    where unique_identifier::text = new.mic_id::text;

    insert into public.mic_confirmations (mic_id, user_id, kind, outcome)
    values (new.mic_id::text, null, 'checkins', 'running');
  end if;

  return new;
end;
$$;

drop trigger if exists confirm_mic_from_checkins on public.user_mic_checkins;
create trigger confirm_mic_from_checkins
  after insert on public.user_mic_checkins
  for each row execute function public.confirm_mic_from_checkins();
