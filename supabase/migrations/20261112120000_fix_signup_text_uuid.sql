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
