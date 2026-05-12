-- Add No Nazar Cafe open mic (Comediq-hosted, Tuesday 6:00 PM, East Village)

DO $$
DECLARE
  v_ref RECORD;
BEGIN

  SELECT * INTO v_ref
    FROM public.open_mics_historical
    WHERE active = true
    ORDER BY verification_count DESC NULLS LAST
    LIMIT 1;

  IF v_ref IS NULL THEN
    RAISE NOTICE 'No reference row found — skipping insert';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%No Nazar%' AND day = 'Tuesday' AND active = true
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
      gen_random_uuid(),
      'No Nazar Cafe Open Mic',
      'Tuesday',
      '6:00 PM',
      NULL,
      'No Nazar Cafe',
      'Manhattan',
      'East Village',
      '280 E 10th St, New York, NY 10009',
      'New York',
      'Coffee Shop',
      '$5',
      '5 min',
      'Sign up on Comediq or in person',
      'Comediq',
      NULL,
      NULL,
      'verified',
      true,
      true,
      'weekly',
      'comediq_slots',
      NULL,
      NULL,
      NULL,
      5,
      true,
      NULL,
      NULL,
      0,
      CURRENT_DATE,
      CURRENT_DATE,
      NULL,
      v_ref.creator_id
    );
  END IF;

END $$;
