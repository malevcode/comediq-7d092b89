-- Add Sunday Spanish Open Mic at St. Marks Comedy Club
-- Source: stmarkscomedy.com/shows/cccd321c-df7e-47da-be35-2e3e6245e94b
-- Hosted by Alexis Carabaño | Sundays 5:30pm–7pm | $5 / 5 min

INSERT INTO public.open_mics_historical (
  open_mic,
  day,
  start_time,
  latest_end_time,
  venue_name,
  borough,
  neighborhood,
  location,
  venue_type,
  cost,
  stage_time,
  sign_up_instructions,
  hosts_organizers,
  active,
  signup_enabled,
  status,
  frequency,
  signup_method,
  signup_url,
  last_verified
) VALUES (
  'Sunday Spanish Open Mic',
  'Sunday',
  '5:30 PM',
  '7:00 PM',
  'St. Marks Comedy Club',
  'Manhattan',
  'East Village',
  '12 St. Marks Place, New York, NY 10003',
  'Comedy Club',
  '$5',
  '5 minutes',
  'Buy tickets online at stmarkscomedy.com ($5 per ticket)',
  'Alexis Carabaño',
  true,
  false,
  'trial',
  'weekly',
  'online',
  'https://www.stmarkscomedy.com/shows/cccd321c-df7e-47da-be35-2e3e6245e94b',
  '2026-04-14'
);
