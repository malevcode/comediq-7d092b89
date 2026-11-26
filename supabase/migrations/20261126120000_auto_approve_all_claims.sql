-- Every claim on a mic is approved on the spot, not just the first one.
-- Before: a claim only auto-approved if the mic had no verified host yet, so a
-- claim made after someone else's, or any claim made before auto-approval
-- existed, sat pending and the host got "You can only change mics you are a
-- verified host of". The 40-mics-per-person cap stays as a guard.
create or replace function public.claim_mic_hosts(p_mic_ids text[])
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
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

    v_ok := (v_verified_before + v_auto) < 40;

    execute format('insert into public.mic_hosts (user_id, mic_id, is_verified) values (%L, %L, %L)', v_user, v_mic, v_ok);
    v_claimed := v_claimed + 1;
    if v_ok then
      v_auto := v_auto + 1;
    end if;
  end loop;

  return jsonb_build_object('claimed', v_claimed, 'approved', v_auto, 'pending', v_claimed - v_auto);
end;
$function$;

-- Approve every claim that is still waiting.
update public.mic_hosts set is_verified = true where is_verified is not true;
