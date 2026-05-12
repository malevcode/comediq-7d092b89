-- Fix Flop House open mic schedule
-- Correct schedule per screenshot:
--   Monday    6:30 PM - 7:15 PM
--   Tuesday   6:30 PM - 7:45 PM
--   Wednesday 6:30 PM - 7:45 PM
--   Thursday  6:30 PM - 7:45 PM  (early)
--   Thursday  11:00 PM - 11:59 PM (late night)
--   Friday    6:30 PM - 7:45 PM
--   Sunday    4:00 PM - 5:30 PM
--   Saturday  4:30 PM - 5:30 PM

DO $$
DECLARE
  v_ref RECORD;
BEGIN

  -- ── Update existing entries by matching (venue_name, day) ──────────────────

  UPDATE public.open_mics_historical
    SET start_time = '6:30 PM', latest_end_time = '7:15 PM', active = true, last_verified = CURRENT_DATE
    WHERE venue_name ILIKE '%Flop House%' AND day = 'Monday';

  UPDATE public.open_mics_historical
    SET start_time = '6:30 PM', latest_end_time = '7:45 PM', active = true, last_verified = CURRENT_DATE
    WHERE venue_name ILIKE '%Flop House%' AND day = 'Tuesday';

  UPDATE public.open_mics_historical
    SET start_time = '6:30 PM', latest_end_time = '7:45 PM', active = true, last_verified = CURRENT_DATE
    WHERE venue_name ILIKE '%Flop House%' AND day = 'Wednesday';

  -- Thursday early slot
  UPDATE public.open_mics_historical
    SET start_time = '6:30 PM', latest_end_time = '7:45 PM', active = true, last_verified = CURRENT_DATE
    WHERE venue_name ILIKE '%Flop House%' AND day = 'Thursday'
      AND (start_time IS NULL OR start_time < '10:00 PM');

  -- Thursday late-night slot
  UPDATE public.open_mics_historical
    SET start_time = '11:00 PM', latest_end_time = '11:59 PM', active = true, last_verified = CURRENT_DATE
    WHERE venue_name ILIKE '%Flop House%' AND day = 'Thursday'
      AND start_time >= '10:00 PM';

  UPDATE public.open_mics_historical
    SET start_time = '6:30 PM', latest_end_time = '7:45 PM', active = true, last_verified = CURRENT_DATE
    WHERE venue_name ILIKE '%Flop House%' AND day = 'Friday';

  UPDATE public.open_mics_historical
    SET start_time = '4:00 PM', latest_end_time = '5:30 PM', active = true, last_verified = CURRENT_DATE
    WHERE venue_name ILIKE '%Flop House%' AND day = 'Sunday';

  UPDATE public.open_mics_historical
    SET start_time = '4:30 PM', latest_end_time = '5:30 PM', active = true, last_verified = CURRENT_DATE
    WHERE venue_name ILIKE '%Flop House%' AND day = 'Saturday';

  -- ── Insert missing entries by cloning from any existing Flop House row ─────

  SELECT * INTO v_ref
    FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Flop House%'
    ORDER BY last_verified DESC NULLS LAST
    LIMIT 1;

  IF v_ref IS NULL THEN
    RAISE NOTICE 'No Flop House rows found — skipping inserts';
    RETURN;
  END IF;

  -- Insert only for days that still have no active row after the updates above

  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Flop House%' AND day = 'Monday' AND active = true
  ) THEN
    INSERT INTO public.open_mics_historical (
      unique_identifier, open_mic, day, start_time, latest_end_time,
      venue_name, borough, neighborhood, location, city, venue_type,
      cost, stage_time, sign_up_instructions, hosts_organizers,
      other_rules, changes_updates, status, active, signup_enabled,
      frequency, signup_method, signup_url, cover_image_url,
      legacy_tag, slot_duration_minutes, slots_enabled, price_per_slot,
      sms_response, verification_count, last_verified, submission_date,
      frequency_custom_text, creator_id
    ) VALUES (
      gen_random_uuid(), v_ref.open_mic, 'Monday', '6:30 PM', '7:15 PM',
      v_ref.venue_name, v_ref.borough, v_ref.neighborhood, v_ref.location,
      v_ref.city, v_ref.venue_type, v_ref.cost, v_ref.stage_time,
      v_ref.sign_up_instructions, v_ref.hosts_organizers, v_ref.other_rules,
      v_ref.changes_updates, v_ref.status, true, v_ref.signup_enabled,
      v_ref.frequency, v_ref.signup_method, v_ref.signup_url,
      v_ref.cover_image_url, v_ref.legacy_tag, v_ref.slot_duration_minutes,
      v_ref.slots_enabled, v_ref.price_per_slot, v_ref.sms_response,
      0, CURRENT_DATE, CURRENT_DATE, v_ref.frequency_custom_text, v_ref.creator_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Flop House%' AND day = 'Tuesday' AND active = true
  ) THEN
    INSERT INTO public.open_mics_historical (
      unique_identifier, open_mic, day, start_time, latest_end_time,
      venue_name, borough, neighborhood, location, city, venue_type,
      cost, stage_time, sign_up_instructions, hosts_organizers,
      other_rules, changes_updates, status, active, signup_enabled,
      frequency, signup_method, signup_url, cover_image_url,
      legacy_tag, slot_duration_minutes, slots_enabled, price_per_slot,
      sms_response, verification_count, last_verified, submission_date,
      frequency_custom_text, creator_id
    ) VALUES (
      gen_random_uuid(), v_ref.open_mic, 'Tuesday', '6:30 PM', '7:45 PM',
      v_ref.venue_name, v_ref.borough, v_ref.neighborhood, v_ref.location,
      v_ref.city, v_ref.venue_type, v_ref.cost, v_ref.stage_time,
      v_ref.sign_up_instructions, v_ref.hosts_organizers, v_ref.other_rules,
      v_ref.changes_updates, v_ref.status, true, v_ref.signup_enabled,
      v_ref.frequency, v_ref.signup_method, v_ref.signup_url,
      v_ref.cover_image_url, v_ref.legacy_tag, v_ref.slot_duration_minutes,
      v_ref.slots_enabled, v_ref.price_per_slot, v_ref.sms_response,
      0, CURRENT_DATE, CURRENT_DATE, v_ref.frequency_custom_text, v_ref.creator_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Flop House%' AND day = 'Wednesday' AND active = true
  ) THEN
    INSERT INTO public.open_mics_historical (
      unique_identifier, open_mic, day, start_time, latest_end_time,
      venue_name, borough, neighborhood, location, city, venue_type,
      cost, stage_time, sign_up_instructions, hosts_organizers,
      other_rules, changes_updates, status, active, signup_enabled,
      frequency, signup_method, signup_url, cover_image_url,
      legacy_tag, slot_duration_minutes, slots_enabled, price_per_slot,
      sms_response, verification_count, last_verified, submission_date,
      frequency_custom_text, creator_id
    ) VALUES (
      gen_random_uuid(), v_ref.open_mic, 'Wednesday', '6:30 PM', '7:45 PM',
      v_ref.venue_name, v_ref.borough, v_ref.neighborhood, v_ref.location,
      v_ref.city, v_ref.venue_type, v_ref.cost, v_ref.stage_time,
      v_ref.sign_up_instructions, v_ref.hosts_organizers, v_ref.other_rules,
      v_ref.changes_updates, v_ref.status, true, v_ref.signup_enabled,
      v_ref.frequency, v_ref.signup_method, v_ref.signup_url,
      v_ref.cover_image_url, v_ref.legacy_tag, v_ref.slot_duration_minutes,
      v_ref.slots_enabled, v_ref.price_per_slot, v_ref.sms_response,
      0, CURRENT_DATE, CURRENT_DATE, v_ref.frequency_custom_text, v_ref.creator_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Flop House%' AND day = 'Thursday'
      AND (start_time IS NULL OR start_time < '10:00 PM') AND active = true
  ) THEN
    INSERT INTO public.open_mics_historical (
      unique_identifier, open_mic, day, start_time, latest_end_time,
      venue_name, borough, neighborhood, location, city, venue_type,
      cost, stage_time, sign_up_instructions, hosts_organizers,
      other_rules, changes_updates, status, active, signup_enabled,
      frequency, signup_method, signup_url, cover_image_url,
      legacy_tag, slot_duration_minutes, slots_enabled, price_per_slot,
      sms_response, verification_count, last_verified, submission_date,
      frequency_custom_text, creator_id
    ) VALUES (
      gen_random_uuid(), v_ref.open_mic, 'Thursday', '6:30 PM', '7:45 PM',
      v_ref.venue_name, v_ref.borough, v_ref.neighborhood, v_ref.location,
      v_ref.city, v_ref.venue_type, v_ref.cost, v_ref.stage_time,
      v_ref.sign_up_instructions, v_ref.hosts_organizers, v_ref.other_rules,
      v_ref.changes_updates, v_ref.status, true, v_ref.signup_enabled,
      v_ref.frequency, v_ref.signup_method, v_ref.signup_url,
      v_ref.cover_image_url, v_ref.legacy_tag, v_ref.slot_duration_minutes,
      v_ref.slots_enabled, v_ref.price_per_slot, v_ref.sms_response,
      0, CURRENT_DATE, CURRENT_DATE, v_ref.frequency_custom_text, v_ref.creator_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Flop House%' AND day = 'Thursday'
      AND start_time >= '10:00 PM' AND active = true
  ) THEN
    INSERT INTO public.open_mics_historical (
      unique_identifier, open_mic, day, start_time, latest_end_time,
      venue_name, borough, neighborhood, location, city, venue_type,
      cost, stage_time, sign_up_instructions, hosts_organizers,
      other_rules, changes_updates, status, active, signup_enabled,
      frequency, signup_method, signup_url, cover_image_url,
      legacy_tag, slot_duration_minutes, slots_enabled, price_per_slot,
      sms_response, verification_count, last_verified, submission_date,
      frequency_custom_text, creator_id
    ) VALUES (
      gen_random_uuid(), v_ref.open_mic, 'Thursday', '11:00 PM', '11:59 PM',
      v_ref.venue_name, v_ref.borough, v_ref.neighborhood, v_ref.location,
      v_ref.city, v_ref.venue_type, v_ref.cost, v_ref.stage_time,
      v_ref.sign_up_instructions, v_ref.hosts_organizers, v_ref.other_rules,
      v_ref.changes_updates, v_ref.status, true, v_ref.signup_enabled,
      v_ref.frequency, v_ref.signup_method, v_ref.signup_url,
      v_ref.cover_image_url, v_ref.legacy_tag, v_ref.slot_duration_minutes,
      v_ref.slots_enabled, v_ref.price_per_slot, v_ref.sms_response,
      0, CURRENT_DATE, CURRENT_DATE, v_ref.frequency_custom_text, v_ref.creator_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Flop House%' AND day = 'Friday' AND active = true
  ) THEN
    INSERT INTO public.open_mics_historical (
      unique_identifier, open_mic, day, start_time, latest_end_time,
      venue_name, borough, neighborhood, location, city, venue_type,
      cost, stage_time, sign_up_instructions, hosts_organizers,
      other_rules, changes_updates, status, active, signup_enabled,
      frequency, signup_method, signup_url, cover_image_url,
      legacy_tag, slot_duration_minutes, slots_enabled, price_per_slot,
      sms_response, verification_count, last_verified, submission_date,
      frequency_custom_text, creator_id
    ) VALUES (
      gen_random_uuid(), v_ref.open_mic, 'Friday', '6:30 PM', '7:45 PM',
      v_ref.venue_name, v_ref.borough, v_ref.neighborhood, v_ref.location,
      v_ref.city, v_ref.venue_type, v_ref.cost, v_ref.stage_time,
      v_ref.sign_up_instructions, v_ref.hosts_organizers, v_ref.other_rules,
      v_ref.changes_updates, v_ref.status, true, v_ref.signup_enabled,
      v_ref.frequency, v_ref.signup_method, v_ref.signup_url,
      v_ref.cover_image_url, v_ref.legacy_tag, v_ref.slot_duration_minutes,
      v_ref.slots_enabled, v_ref.price_per_slot, v_ref.sms_response,
      0, CURRENT_DATE, CURRENT_DATE, v_ref.frequency_custom_text, v_ref.creator_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Flop House%' AND day = 'Sunday' AND active = true
  ) THEN
    INSERT INTO public.open_mics_historical (
      unique_identifier, open_mic, day, start_time, latest_end_time,
      venue_name, borough, neighborhood, location, city, venue_type,
      cost, stage_time, sign_up_instructions, hosts_organizers,
      other_rules, changes_updates, status, active, signup_enabled,
      frequency, signup_method, signup_url, cover_image_url,
      legacy_tag, slot_duration_minutes, slots_enabled, price_per_slot,
      sms_response, verification_count, last_verified, submission_date,
      frequency_custom_text, creator_id
    ) VALUES (
      gen_random_uuid(), v_ref.open_mic, 'Sunday', '4:00 PM', '5:30 PM',
      v_ref.venue_name, v_ref.borough, v_ref.neighborhood, v_ref.location,
      v_ref.city, v_ref.venue_type, v_ref.cost, v_ref.stage_time,
      v_ref.sign_up_instructions, v_ref.hosts_organizers, v_ref.other_rules,
      v_ref.changes_updates, v_ref.status, true, v_ref.signup_enabled,
      v_ref.frequency, v_ref.signup_method, v_ref.signup_url,
      v_ref.cover_image_url, v_ref.legacy_tag, v_ref.slot_duration_minutes,
      v_ref.slots_enabled, v_ref.price_per_slot, v_ref.sms_response,
      0, CURRENT_DATE, CURRENT_DATE, v_ref.frequency_custom_text, v_ref.creator_id
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Flop House%' AND day = 'Saturday' AND active = true
  ) THEN
    INSERT INTO public.open_mics_historical (
      unique_identifier, open_mic, day, start_time, latest_end_time,
      venue_name, borough, neighborhood, location, city, venue_type,
      cost, stage_time, sign_up_instructions, hosts_organizers,
      other_rules, changes_updates, status, active, signup_enabled,
      frequency, signup_method, signup_url, cover_image_url,
      legacy_tag, slot_duration_minutes, slots_enabled, price_per_slot,
      sms_response, verification_count, last_verified, submission_date,
      frequency_custom_text, creator_id
    ) VALUES (
      gen_random_uuid(), v_ref.open_mic, 'Saturday', '4:30 PM', '5:30 PM',
      v_ref.venue_name, v_ref.borough, v_ref.neighborhood, v_ref.location,
      v_ref.city, v_ref.venue_type, v_ref.cost, v_ref.stage_time,
      v_ref.sign_up_instructions, v_ref.hosts_organizers, v_ref.other_rules,
      v_ref.changes_updates, v_ref.status, true, v_ref.signup_enabled,
      v_ref.frequency, v_ref.signup_method, v_ref.signup_url,
      v_ref.cover_image_url, v_ref.legacy_tag, v_ref.slot_duration_minutes,
      v_ref.slots_enabled, v_ref.price_per_slot, v_ref.sms_response,
      0, CURRENT_DATE, CURRENT_DATE, v_ref.frequency_custom_text, v_ref.creator_id
    );
  END IF;

END $$;
