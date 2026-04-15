-- Add 3 Sheets Saloon bi-weekly Wednesday open mic
-- Source: @3sheetsnyc / @3sheetscomedy Instagram post
-- Every other Wednesday, doors 8pm, free, starting March 4 2026

INSERT INTO public.open_mics_historical (
  open_mic,
  day,
  start_time,
  venue_name,
  borough,
  neighborhood,
  location,
  venue_type,
  cost,
  sign_up_instructions,
  active,
  signup_enabled,
  status,
  frequency,
  signup_method,
  last_verified
) VALUES (
  '3 Sheets Open Mic Comedy Night',
  'Wednesday',
  '8:00 PM',
  '3 Sheets Saloon',
  'Manhattan',
  'East Village',
  '131 Avenue A, New York, NY 10009',
  'Bar',
  'Free',
  'Sign up at the door',
  true,
  false,
  'trial',
  'bi_weekly',
  'in_person',
  '2026-04-15'
);
