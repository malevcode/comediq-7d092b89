-- Turn on pick-your-spot for Brainstorm Mic at Judy Z's (Wednesdays 6 PM).
-- Run this only once Alec (the host) says yes. It switches the mic's listing to "sign up on Comediq".
-- Undo: delete the mic_lineup_settings row and set slots_enabled = false, signup_method = 'in_person'.

insert into public.mic_lineup_settings (mic_id, lineup_mode, opens_days_before)
values ('75877c29-43b9-4c68-b98c-17e0f81c3def', 'pick_spot', 3)
on conflict (mic_id) do update set lineup_mode = excluded.lineup_mode, opens_days_before = excluded.opens_days_before;

update public.open_mics_historical
set slots_enabled = true, signup_method = 'comediq_slots'
where unique_identifier::text = '75877c29-43b9-4c68-b98c-17e0f81c3def';
