-- Easy claiming and bulk editing for hosts.
--
-- Found on the live database: nobody had ever been verified as a host (every claim was pending), and hosts had no
-- permission to edit the mic they claimed (only admins can update open_mics_historical). So the host dashboard
-- could not do anything for anyone. This adds:
--   * claim_mic_hosts: claim many mics at once. The FIRST claim on a mic that has no verified host is approved on the
--     spot (a person can have at most 40 auto-approved mics); any later claim waits for an admin.
--   * host_update_mics: a verified host (or an admin) changes the same fields on one or many of their mics in one go.
--     Only the listed fields can change. Every change is saved in mic_edit_history with the old value.
-- Works whether id columns are text or uuid.

create table if not exists public.mic_edit_history (
  id uuid primary key default gen_random_uuid(),
  mic_unique_identifier text not null,
  editor_id uuid,
  field_name text not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);
create index if not exists mic_edit_history_mic_idx on public.mic_edit_history (mic_unique_identifier, created_at desc);
alter table public.mic_edit_history enable row level security;
-- no policies: only the functions below write to it

create or replace function public.claim_mic_hosts(p_mic_ids text[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_mic text;
  v_claimed int := 0;
  v_auto int := 0;
  v_verified_before int;
  v_ok boolean;
begin
  if v_user is null then
    raise exception 'Must be authenticated';
  end if;
  if p_mic_ids is null or coalesce(array_length(p_mic_ids, 1), 0) = 0 then
    raise exception 'Pick at least one mic';
  end if;
  if array_length(p_mic_ids, 1) > 30 then
    raise exception 'Claim up to 30 mics at a time';
  end if;

  select count(*) into v_verified_before
  from public.mic_hosts h where h.user_id::text = v_user::text and h.is_verified is true;

  foreach v_mic in array p_mic_ids loop
    if not exists (select 1 from public.open_mics_historical m where m.unique_identifier::text = v_mic) then
      continue;
    end if;
    if exists (select 1 from public.mic_hosts h where h.user_id::text = v_user::text and h.mic_id::text = v_mic) then
      continue;
    end if;

    v_ok := not exists (select 1 from public.mic_hosts h where h.mic_id::text = v_mic and h.is_verified is true)
            and (v_verified_before + v_auto) < 40;

    execute format('insert into public.mic_hosts (user_id, mic_id, is_verified) values (%L, %L, %L)', v_user, v_mic, v_ok);
    v_claimed := v_claimed + 1;
    if v_ok then
      v_auto := v_auto + 1;
    end if;
  end loop;

  return jsonb_build_object('claimed', v_claimed, 'approved', v_auto, 'pending', v_claimed - v_auto);
end;
$$;

revoke all on function public.claim_mic_hosts(text[]) from public;
grant execute on function public.claim_mic_hosts(text[]) to authenticated;

-- The single-mic claim uses the same rule, so "Claim This Mic" is instant for an unclaimed mic.
create or replace function public.claim_mic_host(p_mic_id text)
returns public.mic_hosts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.mic_hosts;
begin
  if auth.uid() is null then
    raise exception 'Must be authenticated';
  end if;
  if not exists (select 1 from public.open_mics_historical m where m.unique_identifier::text = p_mic_id) then
    raise exception 'That mic was not found.';
  end if;
  perform public.claim_mic_hosts(array[p_mic_id]);
  select * into v_row from public.mic_hosts h
  where h.user_id::text = auth.uid()::text and h.mic_id::text = p_mic_id
  limit 1;
  return v_row;
end;
$$;

revoke all on function public.claim_mic_host(text) from public;
grant execute on function public.claim_mic_host(text) to authenticated;

create or replace function public.host_update_mics(p_mic_ids text[], p_fields jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_is_admin boolean := false;
  v_allowed constant text[] := array[
    'day', 'start_time', 'latest_end_time', 'cost', 'stage_time', 'hosts_organizers',
    'sign_up_instructions', 'location', 'venue_name', 'borough', 'neighborhood', 'other_rules'
  ];
  v_key text;
  v_val text;
  v_sets text[] := '{}';
  v_mic text;
  v_count int;
begin
  if v_user is null then
    raise exception 'Must be authenticated';
  end if;
  if p_mic_ids is null or coalesce(array_length(p_mic_ids, 1), 0) = 0 then
    raise exception 'Pick at least one mic';
  end if;
  if array_length(p_mic_ids, 1) > 60 then
    raise exception 'Change up to 60 mics at a time';
  end if;
  if p_fields is null or jsonb_typeof(p_fields) <> 'object' or p_fields = '{}'::jsonb then
    raise exception 'Nothing to change';
  end if;

  select coalesce(bool_or(p.isadmin is true), false) into v_is_admin
  from public.profiles p where p.user_id::text = v_user::text;

  if not v_is_admin then
    foreach v_mic in array p_mic_ids loop
      if not exists (
        select 1 from public.mic_hosts h
        where h.mic_id::text = v_mic and h.user_id::text = v_user::text and h.is_verified is true
      ) then
        raise exception 'You can only change mics you are a verified host of';
      end if;
    end loop;
  end if;

  for v_key in select jsonb_object_keys(p_fields) loop
    if not (v_key = any (v_allowed)) then
      raise exception 'You cannot change %', v_key;
    end if;
    v_val := left(btrim(coalesce(p_fields ->> v_key, '')), 2000);
    v_sets := v_sets || format('%I = %L', v_key, v_val);

    insert into public.mic_edit_history (mic_unique_identifier, editor_id, field_name, old_value, new_value)
    select m.unique_identifier::text, v_user, v_key, to_jsonb(m) ->> v_key, v_val
    from public.open_mics_historical m
    where m.unique_identifier::text = any (p_mic_ids)
      and coalesce(to_jsonb(m) ->> v_key, '') is distinct from v_val;
  end loop;

  -- one statement, so the public mic list refreshes once
  execute format(
    'update public.open_mics_historical set %s where unique_identifier::text = any ($1)',
    array_to_string(v_sets, ', ')
  ) using p_mic_ids;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.host_update_mics(text[], jsonb) from public;
grant execute on function public.host_update_mics(text[], jsonb) to authenticated;
