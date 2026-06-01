-- Add Crash Landing Comedy at Red Eye (hosted by Ashley Ryan)

DO $$
BEGIN

  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE open_mic ILIKE '%Crash Landing%' AND venue_name ILIKE '%Red Eye%' AND active = true
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
      gen_random_uuid(), 'Crash Landing Comedy', 'Monday', '8:00 PM', '9:30 PM',
      'Red Eye', 'Manhattan', 'Hell''s Kitchen', '355 W 41st St, New York, NY',
      'New York', 'Bar', 'Free', '5 min', 'In person', 'Ashley Ryan',
      NULL, NULL, 'verified', true, false,
      'weekly', 'in_person', NULL, NULL,
      NULL, 5, false, NULL, NULL, 0, CURRENT_DATE, CURRENT_DATE, NULL, NULL
    );
  END IF;

END $$;
