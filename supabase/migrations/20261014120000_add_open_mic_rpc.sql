-- Let any visitor (signed in or not) add a mic.
--
-- The app used to INSERT straight into open_mics_historical, which depends on
-- per-role grants plus RLS policies that have drifted over time (anon has an
-- insert policy but never got an INSERT grant; authenticated needs
-- creator_id = auth.uid() and status = 'trial'). Users saw an error adding to
-- open_mics_historical. This function owns the insert instead and sets the
-- trusted fields server-side, so callers cannot choose status, creator or
-- verification state.

create or replace function public.add_open_mic(p jsonb)
returns public.open_mics_historical
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.open_mics_historical;
begin
  if coalesce(trim(p->>'open_mic'), '') = ''
     or coalesce(trim(p->>'venue_name'), '') = ''
     or coalesce(trim(p->>'day'), '') = ''
     or coalesce(trim(p->>'start_time'), '') = '' then
    raise exception 'Mic name, venue, day and start time are required';
  end if;

  insert into public.open_mics_historical (
    open_mic, venue_name, borough, neighborhood, location, day, start_time,
    latest_end_time, stage_time, cost, venue_type, sign_up_instructions,
    hosts_organizers, changes_updates, city, frequency, signup_method,
    signup_url, frequency_custom_text,
    active, status, submission_date, creator_id, verification_count
  ) values (
    left(trim(p->>'open_mic'), 200),
    left(trim(p->>'venue_name'), 200),
    left(nullif(trim(p->>'borough'), ''), 100),
    left(nullif(trim(p->>'neighborhood'), ''), 100),
    left(nullif(trim(p->>'location'), ''), 300),
    left(trim(p->>'day'), 20),
    left(trim(p->>'start_time'), 20),
    left(nullif(trim(p->>'latest_end_time'), ''), 20),
    left(nullif(trim(p->>'stage_time'), ''), 50),
    left(coalesce(nullif(trim(p->>'cost'), ''), 'Free'), 100),
    left(nullif(trim(p->>'venue_type'), ''), 100),
    left(nullif(trim(p->>'sign_up_instructions'), ''), 1000),
    left(nullif(trim(p->>'hosts_organizers'), ''), 300),
    left(nullif(trim(p->>'changes_updates'), ''), 300),
    left(coalesce(nullif(trim(p->>'city'), ''), 'New York'), 100),
    coalesce(nullif(p->>'frequency', ''), 'weekly')::public.mic_frequency,
    coalesce(nullif(p->>'signup_method', ''), 'in_person')::public.signup_method,
    left(nullif(trim(p->>'signup_url'), ''), 500),
    left(nullif(trim(p->>'frequency_custom_text'), ''), 200),
    true, 'trial', now(), auth.uid(), 0
  )
  returning * into r;

  return r;
end $$;

revoke all on function public.add_open_mic(jsonb) from public;
grant execute on function public.add_open_mic(jsonb) to anon, authenticated;
