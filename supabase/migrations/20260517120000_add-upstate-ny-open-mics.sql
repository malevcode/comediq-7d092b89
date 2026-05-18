-- Add Upstate NY / Hudson Valley open mics (city = 'Upstate NY', neighborhood = town name, no borough)

DO $$
BEGIN

  -- 1. Open Mic Night — Mahoney's Irish Pub, Poughkeepsie (Weekly Monday 7pm)
  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Mahoney%' AND day = 'Monday' AND city = 'Upstate NY' AND active = true
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
      gen_random_uuid(), 'Open Mic Night', 'Monday', '7:00 PM', NULL,
      'Mahoneys Irish Pub', NULL, 'Poughkeepsie', '35 Main St, Poughkeepsie, NY',
      'Upstate NY', 'Bar', 'Free', '5 min', 'In person', 'Kirsten Lee',
      NULL, NULL, 'trial', true, false,
      'weekly', 'in_person', NULL, NULL,
      NULL, 5, false, NULL, NULL, 0, NULL, CURRENT_DATE, NULL, NULL
    );
  END IF;

  -- 2. Comedy Mic Night — Studio Around the Corner, Brewster (Weekly Monday 7:30pm)
  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Studio Around the Corner%' AND day = 'Monday' AND city = 'Upstate NY' AND active = true
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
      gen_random_uuid(), 'Comedy Mic Night', 'Monday', '7:30 PM', NULL,
      'Studio Around the Corner', NULL, 'Brewster', '67 Main St, Brewster, NY',
      'Upstate NY', 'Bar', 'Free', '5 min', 'In person', 'Jack Ludlum',
      NULL, NULL, 'trial', true, false,
      'weekly', 'in_person', NULL, NULL,
      NULL, 5, false, NULL, NULL, 0, NULL, CURRENT_DATE, NULL, NULL
    );
  END IF;

  -- 3. Mirabella's Open Mic — Saugerties (Weekly Tuesday 7pm)
  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Mirabella%' AND day = 'Tuesday' AND city = 'Upstate NY' AND active = true
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
      gen_random_uuid(), 'Mirabella''s Open Mic', 'Tuesday', '7:00 PM', NULL,
      'Mirabella''s Restaurant and Lounge', NULL, 'Saugerties', '123 Partition St, Saugerties, NY',
      'Upstate NY', 'Restaurant/Bar', '2 Item Minimum', '5 min', 'Sign up at 6:30 PM, show starts 7:00 PM', NULL,
      NULL, NULL, 'trial', true, false,
      'weekly', 'in_person', NULL, NULL,
      NULL, 5, false, NULL, NULL, 0, NULL, CURRENT_DATE, NULL, NULL
    );
  END IF;

  -- 4. Salty's Mic — VFW Post 8691, Washingtonville (3rd Tuesday 7pm)
  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%VFW Post 8691%' AND day = 'Tuesday' AND city = 'Upstate NY' AND active = true
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
      gen_random_uuid(), 'Salty''s Mic', 'Tuesday', '7:00 PM', NULL,
      'VFW Post 8691', NULL, 'Washingtonville', '44 Main St, Washingtonville, NY',
      'Upstate NY', 'Bar', '2 Item Minimum', '5 min', 'Sign up begins at 6:30 PM', 'Michael Saltz',
      NULL, NULL, 'trial', true, false,
      '3rd_of_month', 'in_person', NULL, NULL,
      NULL, 5, false, NULL, NULL, 0, NULL, CURRENT_DATE, NULL, NULL
    );
  END IF;

  -- 5. Pine Island Mic — Polish Legion of American Vets, Pine Island (4th Tuesday 8pm)
  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Polish Legion%' AND day = 'Tuesday' AND city = 'Upstate NY' AND active = true
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
      gen_random_uuid(), 'Pine Island Mic', 'Tuesday', '8:00 PM', NULL,
      'Polish Legion of American Vets', NULL, 'Pine Island', '16 Legion Rd, Pine Island, NY',
      'Upstate NY', 'Bar', 'Free', '5 min', 'In person', 'Jakob',
      NULL, NULL, 'trial', true, false,
      '4th_of_month', 'in_person', NULL, NULL,
      NULL, 5, false, NULL, NULL, 0, NULL, CURRENT_DATE, NULL, NULL
    );
  END IF;

  -- 6. 2 Way Mic — Two Way Brewing, Beacon (Weekly Wednesday 7pm)
  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Two Way Brewing%' AND day = 'Wednesday' AND city = 'Upstate NY' AND active = true
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
      gen_random_uuid(), '2 Way Mic', 'Wednesday', '7:00 PM', NULL,
      'Two Way Brewing', NULL, 'Beacon', '18 W Main St, Beacon, NY',
      'Upstate NY', 'Bar/Brewery', '2 Item Minimum', '5 min', 'In person', 'Kevin Ludlow',
      NULL, NULL, 'trial', true, false,
      'weekly', 'in_person', NULL, NULL,
      NULL, 5, false, NULL, NULL, 0, NULL, CURRENT_DATE, NULL, NULL
    );
  END IF;

  -- 7. Night Swim Mic — Night Swim Bar, Kingston (1st & 3rd Wednesday 8:30pm)
  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Night Swim%' AND day = 'Wednesday' AND city = 'Upstate NY' AND active = true
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
      gen_random_uuid(), 'Night Swim Mic', 'Wednesday', '8:30 PM', NULL,
      'Night Swim Bar', NULL, 'Kingston', '744 Broadway, Kingston, NY',
      'Upstate NY', 'Bar', 'Free', '5 min', 'In person', 'Gabe Baldizzi',
      NULL, NULL, 'trial', true, false,
      'custom', 'in_person', NULL, NULL,
      NULL, 5, false, NULL, NULL, 0, NULL, CURRENT_DATE, '1st & 3rd Wednesday of the month', NULL
    );
  END IF;

  -- 8. Out to Lunch — Keegan Ales Brewing, Kingston (1st Thursday 8pm)
  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Keegan Ales%' AND day = 'Thursday' AND city = 'Upstate NY' AND active = true
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
      gen_random_uuid(), 'Out to Lunch', 'Thursday', '8:00 PM', NULL,
      'Keegan Ales Brewing', NULL, 'Kingston', '20 St. James St, Kingston, NY',
      'Upstate NY', 'Bar/Brewery', 'Free', '5 min', 'In person', 'Gabe Baldizzi',
      NULL, NULL, 'trial', true, false,
      '1st_of_month', 'in_person', NULL, NULL,
      NULL, 5, false, NULL, NULL, 0, NULL, CURRENT_DATE, NULL, NULL
    );
  END IF;

  -- 9. Rhino Comedy (Thursday) — Rhino Comedy Club, Suffern (Weekly Thursday 8pm)
  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Rhino Comedy%' AND day = 'Thursday' AND city = 'Upstate NY' AND active = true
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
      gen_random_uuid(), 'Rhino Comedy', 'Thursday', '8:00 PM', NULL,
      'Rhino Comedy Club', NULL, 'Suffern', '22 Lafayette Ave, Suffern, NY',
      'Upstate NY', 'Club', '$5 + 1 Item Minimum', '5 min', 'In person', NULL,
      NULL, NULL, 'trial', true, false,
      'weekly', 'in_person', NULL, NULL,
      NULL, 5, false, NULL, NULL, 0, NULL, CURRENT_DATE, NULL, NULL
    );
  END IF;

  -- 10. Kroeg Comedy — The Kroeg, Rhinebeck (Random Thursday 7pm)
  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Kroeg%' AND day = 'Thursday' AND city = 'Upstate NY' AND active = true
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
      gen_random_uuid(), 'Kroeg Comedy', 'Thursday', '7:00 PM', NULL,
      'The Kroeg', NULL, 'Rhinebeck', '41 E Market St, Rhinebeck, NY',
      'Upstate NY', 'Bar', '1 Item Minimum', '5 min', 'In person', 'David Stickle',
      NULL, NULL, 'trial', true, false,
      'custom', 'in_person', NULL, NULL,
      NULL, 5, false, NULL, NULL, 0, NULL, CURRENT_DATE, 'Random Thursday - check Instagram for dates', NULL
    );
  END IF;

  -- 11. Tapped Comedy Open Mic — Tapped Craft Beer & Restaurant, Middletown (3rd Thursday 8pm)
  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Tapped%' AND day = 'Thursday' AND city = 'Upstate NY' AND active = true
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
      gen_random_uuid(), 'Tapped Comedy Open Mic', 'Thursday', '8:00 PM', NULL,
      'Tapped Craft Beer & Restaurant', NULL, 'Middletown', '22 Henry St #2, Middletown, NY',
      'Upstate NY', 'Bar/Brewery', 'Free', '5 min', 'In person', NULL,
      NULL, NULL, 'trial', true, false,
      '3rd_of_month', 'in_person', NULL, NULL,
      NULL, 5, false, NULL, NULL, 0, NULL, CURRENT_DATE, NULL, NULL
    );
  END IF;

  -- 12. Comedians of Hudson Valley — Levity Live, West Nyack (Weekly Friday 8pm)
  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Levity Live%' AND day = 'Friday' AND city = 'Upstate NY' AND active = true
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
      gen_random_uuid(), 'Comedians of Hudson Valley', 'Friday', '8:00 PM', NULL,
      'Levity Live', NULL, 'West Nyack', 'Palisades Center Mall, West Nyack, NY',
      'Upstate NY', 'Club', '1 Item Minimum', '5 min', 'In person - time may change, check Instagram', 'Harry Van Ness',
      NULL, NULL, 'trial', true, false,
      'weekly', 'in_person', NULL, NULL,
      NULL, 5, false, NULL, NULL, 0, NULL, CURRENT_DATE, NULL, NULL
    );
  END IF;

  -- 13. Rhino Comedy (Saturday) — Rhino Comedy Club, Suffern (Weekly Saturday 10pm)
  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Rhino Comedy%' AND day = 'Saturday' AND city = 'Upstate NY' AND active = true
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
      gen_random_uuid(), 'Rhino Comedy', 'Saturday', '10:00 PM', NULL,
      'Rhino Comedy Club', NULL, 'Suffern', '22 Lafayette Ave, Suffern, NY',
      'Upstate NY', 'Club', '$5 + 1 Item Minimum', '5 min', 'In person', NULL,
      NULL, NULL, 'trial', true, false,
      'weekly', 'in_person', NULL, NULL,
      NULL, 5, false, NULL, NULL, 0, NULL, CURRENT_DATE, NULL, NULL
    );
  END IF;

  -- 14. Tri State Standup — Wolf & Warrior Brewing, White Plains (Weekly Sunday 6pm)
  IF NOT EXISTS (
    SELECT 1 FROM public.open_mics_historical
    WHERE venue_name ILIKE '%Wolf & Warrior%' AND day = 'Sunday' AND city = 'Upstate NY' AND active = true
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
      gen_random_uuid(), 'Tri State Standup', 'Sunday', '6:00 PM', NULL,
      'Wolf & Warrior Brewing', NULL, 'White Plains', '195A E Post Rd, White Plains, NY',
      'Upstate NY', 'Bar/Brewery', '$10 Minimum', '5 min', 'Must sign up online at TriStateStandUp.com', 'Jess Xu',
      NULL, NULL, 'trial', true, false,
      'weekly', 'online', 'https://www.tristatestandup.com', NULL,
      NULL, 5, false, NULL, NULL, 0, NULL, CURRENT_DATE, NULL, NULL
    );
  END IF;

END $$;
