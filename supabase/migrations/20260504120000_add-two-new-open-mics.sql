-- Add Greenpoint Comedy Club Tuesday 5:30 PM open mic (cloned from existing Thursday mic)
INSERT INTO public.open_mics_historical (
  unique_identifier, open_mic, day, start_time, latest_end_time,
  venue_name, borough, neighborhood, location, city, venue_type,
  cost, stage_time, sign_up_instructions, hosts_organizers,
  other_rules, changes_updates, status, active, signup_enabled,
  frequency, signup_method, signup_url, cover_image_url,
  legacy_tag, slot_duration_minutes, slots_enabled, price_per_slot,
  sms_response, verification_count, last_verified, submission_date,
  frequency_custom_text, creator_id
)
SELECT
  gen_random_uuid(),
  open_mic,
  'Tuesday',
  '5:30 PM',
  latest_end_time,
  venue_name,
  borough,
  neighborhood,
  location,
  city,
  venue_type,
  cost,
  stage_time,
  'Sign up at 5:00 PM. Open mic starts at 5:30 PM.',
  hosts_organizers,
  other_rules,
  changes_updates,
  status,
  active,
  signup_enabled,
  frequency,
  signup_method,
  signup_url,
  cover_image_url,
  legacy_tag,
  slot_duration_minutes,
  slots_enabled,
  price_per_slot,
  sms_response,
  0,
  NULL,
  CURRENT_DATE,
  frequency_custom_text,
  creator_id
FROM public.open_mics_historical
WHERE venue_name ILIKE '%Greenpoint%'
  AND day = 'Thursday'
  AND active = true
ORDER BY verification_count DESC
LIMIT 1;

-- Add Producers Club Sunday 4:00–5:00 PM Feedback Mic (cloned from existing Producers Club mic)
INSERT INTO public.open_mics_historical (
  unique_identifier, open_mic, day, start_time, latest_end_time,
  venue_name, borough, neighborhood, location, city, venue_type,
  cost, stage_time, sign_up_instructions, hosts_organizers,
  other_rules, changes_updates, status, active, signup_enabled,
  frequency, signup_method, signup_url, cover_image_url,
  legacy_tag, slot_duration_minutes, slots_enabled, price_per_slot,
  sms_response, verification_count, last_verified, submission_date,
  frequency_custom_text, creator_id
)
SELECT
  gen_random_uuid(),
  'Feedback Mic',
  'Sunday',
  '4:00 PM',
  '5:00 PM',
  venue_name,
  borough,
  neighborhood,
  location,
  city,
  venue_type,
  cost,
  stage_time,
  sign_up_instructions,
  hosts_organizers,
  other_rules,
  changes_updates,
  status,
  active,
  signup_enabled,
  frequency,
  signup_method,
  signup_url,
  cover_image_url,
  legacy_tag,
  slot_duration_minutes,
  slots_enabled,
  price_per_slot,
  sms_response,
  0,
  NULL,
  CURRENT_DATE,
  frequency_custom_text,
  creator_id
FROM public.open_mics_historical
WHERE venue_name ILIKE '%Producers%'
  AND active = true
ORDER BY verification_count DESC
LIMIT 1;
