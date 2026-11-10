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
