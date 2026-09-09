-- September 2026 host-blast updates to open_mics_historical.
--
-- Every row is targeted by unique_identifier so nothing is matched by a fuzzy
-- name and updated by accident. Closures are soft (active = false) and never
-- DELETE: mic_edit_history exists so listings can be reverted, and a hard
-- delete would throw that away.
--
-- Two dated closures (Sick Hat after 10/7, Partea Lab after 9/10) are NOT in
-- this file. Those mics still run right now, so deactivating them today would
-- hide live mics. The statements live in scripts/scheduled-sql/ to be run on
-- the date instead.
--
-- Notes go in other_rules. changes_updates is NOT a notes column despite the
-- name: scripts/export-mics.mjs maps it to the public Instagram handle.
--
-- The NYCC Midtown address used below is taken from this repo's own
-- scripts/scrapers/NYCC_scraper.py VENUE_TO_ADDRESS map, not guessed.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Closed for good
-- ---------------------------------------------------------------------------

-- "Chewsday" -> Chewsdays Innit, Tuesday 6:00 PM @ One and One.
-- Jake Lemonade: "hasn't been happening for a while now".
UPDATE public.open_mics_historical
SET active = false,
    other_rules = 'No longer running (confirmed by host, September 2026).',
    last_verified = '09/09/26'
WHERE unique_identifier = '79d61feb-e9c6-48da-b824-c730cda652d4';

-- the_secret_mics item 4: "N / no thursday mics".
UPDATE public.open_mics_historical
SET active = false,
    other_rules = 'No longer running: the host confirmed there are no Thursday mics.',
    last_verified = '09/09/26'
WHERE unique_identifier = 'ec19a474-d901-4a43-8783-90ce6f109d00';

-- the_secret_mics item 5: "N / changes" -- the Friday 11:30 PM mic at The Pit
-- is replaced by a 4:00 PM mic at NYCC Midtown, inserted in section 6 below.
UPDATE public.open_mics_historical
SET active = false,
    other_rules = 'Replaced by The Secret Mic, Friday 4:00 PM at New York Comedy Club - Midtown.',
    last_verified = '09/09/26'
WHERE unique_identifier = '7c892342-d59d-4aaa-8c25-32310f40688d';

-- ---------------------------------------------------------------------------
-- 2. Going on hiatus (left ACTIVE until their final date, note added now)
-- ---------------------------------------------------------------------------

-- Sick Hat, Wednesday 8:00 PM @ Cobra Club. Host: "just going on hiatus,
-- haven't figured out whether we wanna move to a different venue".
-- Dates given were 9/2, 9/16 and 10/7; 9/2 has already passed.
UPDATE public.open_mics_historical
SET frequency = 'custom',
    frequency_custom_text = 'Final dates before hiatus: 9/16 and 10/7',
    other_rules = 'Going on hiatus after 10/7/26. May relocate venue, TBD.',
    last_verified = '09/09/26'
WHERE unique_identifier = '51495931-553e-44b2-846d-a643502ee193';

-- Partea Lab / Humor Section (@tonychoucomedy), Thursday 7:00 PM. Venue closing.
UPDATE public.open_mics_historical
SET frequency = 'custom',
    frequency_custom_text = 'Final date 9/10/26',
    other_rules = 'English / Chinese-friendly. Produced by Humor Section. '
                  || 'Final date is 9/10/26 - venue is closing.',
    last_verified = '09/09/26'
WHERE unique_identifier = '7904df9c-8a37-48d3-a5f2-2e35ae7d5cdc';

-- ---------------------------------------------------------------------------
-- 3. Time / format / frequency changes
-- ---------------------------------------------------------------------------

-- Energizer Honeys: every other Wednesday, 5:30 PM, 4 minute sets,
-- sign up ahead of time. latest_end_time left as-is (no new end time given).
UPDATE public.open_mics_historical
SET start_time = '5:30 PM',
    frequency = 'bi_weekly',
    frequency_custom_text = 'Every other Wednesday',
    stage_time = '4',
    sign_up_instructions = 'Sign up ahead of time',
    last_verified = '09/09/26'
WHERE unique_identifier = '566c7f42-f346-43ed-8827-b64993fa00e4';

-- Have A Good Mic -> 8:30 PM (was 7:30 PM).
UPDATE public.open_mics_historical
SET start_time = '8:30 PM',
    last_verified = '09/09/26'
WHERE unique_identifier = '4f3c866e-7c45-4710-9839-e63550682f6b';

-- @thursdaysattherib is biweekly, not weekly.
UPDATE public.open_mics_historical
SET frequency = 'bi_weekly',
    frequency_custom_text = 'Every other Thursday',
    last_verified = '09/09/26'
WHERE unique_identifier = 'ec491c87-12c1-43a2-8b10-187f22b73d73';

-- Eiffel Tower -> 8:15 PM (was 6:30 PM). The stored end time of 8:00 PM would
-- now fall BEFORE the start, so it is cleared rather than guessed at.
UPDATE public.open_mics_historical
SET start_time = '8:15 PM',
    latest_end_time = NULL,
    last_verified = '09/09/26'
WHERE unique_identifier = '1c145ee3-5380-481a-94a9-e9d13e878216';

-- Buddha @NYCC UWS moves 1:30 PM -> 3:30 PM. The old time is baked into the
-- display name, so BOTH the name and the start time have to change.
-- (A separate "Buddha 3 @NYCC UWS" runs at 3:00 PM, so 3:30 does not collide.)
UPDATE public.open_mics_historical
SET open_mic = 'Buddha 3:30 @NYCC UWS',
    start_time = '3:30 PM',
    latest_end_time = '4:30 PM',
    last_verified = '09/09/26'
WHERE unique_identifier = '3478fc7e-a23d-4d42-bee7-939ccd43cb19';

-- ---------------------------------------------------------------------------
-- 4. Host / name / signup changes
-- ---------------------------------------------------------------------------

-- Oddball Matt's mic -> Last Stop Mic, Saturday 11:30 PM @ Eastville.
-- "Oddball Matt gave his mic to Thomas Purdy": Matt is swapped out, and the
-- co-host Angel Contreras is kept because nothing says he left.
UPDATE public.open_mics_historical
SET hosts_organizers = 'Angel Contreras and Thomas Purdy',
    last_verified = '09/09/26'
WHERE unique_identifier = '14429d05-13d7-4f81-96b9-8c1926cab6d6';

-- Feelings Wheel -> "The Feelings Anonymous Mic". The host confirmed the
-- Instagram handle is "just the insta page", so changes_updates is NOT touched.
-- The old display name carried "*1st & 3rd*", so that schedule is moved into
-- frequency_custom_text before the name drops it.
UPDATE public.open_mics_historical
SET open_mic = 'The Feelings Anonymous Mic',
    frequency = 'custom',
    frequency_custom_text = '1st and 3rd Saturday monthly',
    last_verified = '09/09/26'
WHERE unique_identifier = '8e71ab7e-f562-4464-bcab-01112f3f3275';

-- Fun Mic @ Freddy's: a NEW Google Form goes up every week, so the stored
-- signup_url (which points at a closed form) can never be right. Cleared.
UPDATE public.open_mics_historical
SET sign_up_instructions = 'Sign up via the Google Form linked in the IG bio (new form weekly)',
    signup_url = NULL,
    last_verified = '09/09/26'
WHERE unique_identifier = 'b3f843a1-f2d8-4240-9236-582e3541c784';

-- ---------------------------------------------------------------------------
-- 5. Venue move + mics reported as "new" that already exist, updated in place
--    so the public list does not end up with duplicates.
-- ---------------------------------------------------------------------------

-- Comedy Mob Thursday 5:30 PM is at the 24th St (Midtown) NYCC, not East
-- Village. Coordinates cleared so npm run geocode:open-mics re-pins it.
UPDATE public.open_mics_historical
SET open_mic = 'Comedy Mob @NYCC Midtown',
    venue_name = 'New York Comedy Club - Midtown',
    location = '241 East 24th Street, New York, NY',
    neighborhood = 'Gramercy',
    latitude = NULL,
    longitude = NULL,
    geocoded_at = NULL,
    geocoding_provider = NULL,
    geocoding_score = NULL,
    geocoding_match_address = NULL,
    last_verified = '09/09/26'
WHERE unique_identifier = '4769d8a1-7c92-4b63-bf83-50e6731f9782';

-- Greenpoint Comedy Club, Wednesday. Already listed at 5:30 PM. Jake Lemonade
-- (the former Chewsdays Innit host) runs it; cost corrected.
UPDATE public.open_mics_historical
SET hosts_organizers = 'Jake Lemonade',
    cost = 'Free with 1 item bar purchase',
    sign_up_instructions = 'Sign up in person from 5PM. '
                           || 'For questions, please email info@greenpointcomedy.com',
    last_verified = '09/09/26'
WHERE unique_identifier = '71459ec0-438e-4579-b429-ca4a00596b02';

-- Comedy in Harlem, Tuesday. 6:00 PM start already correct; signup is 5:30.
UPDATE public.open_mics_historical
SET sign_up_instructions = 'Sign up at 5:30PM',
    last_verified = '09/09/26'
WHERE unique_identifier = '1e536831-cc9b-40b4-8bae-b20177756ea3';

-- ---------------------------------------------------------------------------
-- 6. Address correction
-- ---------------------------------------------------------------------------

-- "Social Club" -> On The Wagon @ Social Club (Sober).
-- This is a borough move (415 Classon Ave, Brooklyn -> 309 E 49th St,
-- Manhattan), not a typo fix, so the stale Brooklyn coordinates are cleared
-- rather than left pointing at the old pin. Re-run: npm run geocode:open-mics
UPDATE public.open_mics_historical
SET location = '309 E 49th St, New York, NY 10017',
    borough = 'Manhattan',
    neighborhood = 'Midtown East',
    latitude = NULL,
    longitude = NULL,
    geocoded_at = NULL,
    geocoding_provider = NULL,
    geocoding_score = NULL,
    geocoding_match_address = NULL,
    last_verified = '09/09/26'
WHERE unique_identifier = '0336da7f-a548-4ac2-970c-a70814ae8e7d';

-- ---------------------------------------------------------------------------
-- 7. Confirmed still running (the_secret_mics items 1-3, Comedy in Harlem Mon)
-- ---------------------------------------------------------------------------

UPDATE public.open_mics_historical
SET last_verified = '09/09/26'
WHERE unique_identifier IN (
  '14ecf40f-20e8-4ffe-b510-b2393d117391',  -- The Secret Mic, Monday
  '8826a9af-d3c3-4b4f-8437-571628b489fb',  -- The Secret Mic, Tuesday
  'b48e2406-12e3-440e-8cab-5c1d05fe6c3b',  -- The Secret Mic, Wednesday
  '6e48fa02-a9c0-4729-8ff8-1d1409df5fad'   -- Funny Lines, Comedy in Harlem Monday
);

-- ---------------------------------------------------------------------------
-- 8. New mics with complete details, inserted live.
--    Coordinates left NULL for npm run geocode:open-mics.
-- ---------------------------------------------------------------------------

-- GIRL DINNER, Tuesdays @ Comedy Village.
INSERT INTO public.open_mics_historical (
  unique_identifier, open_mic, day, start_time,
  venue_name, borough, neighborhood, location, city, venue_type,
  cost, stage_time, sign_up_instructions, other_rules, changes_updates,
  status, active, signup_enabled, frequency, signup_method, last_verified
)
SELECT
  gen_random_uuid(), 'Girl Dinner', 'Tuesday', '7:30 PM',
  'Comedy Village', 'Manhattan', 'Hell''s Kitchen',
  '352 W 44th St, New York, NY', 'New York', 'Comedy Club',
  '$5', '5', 'Sign up at 7PM',
  '$5 gets you 5 minutes plus 3 minutes of feedback.', NULL,
  'verified', true, false, 'weekly', 'in_person', '09/09/26'
WHERE NOT EXISTS (
  SELECT 1 FROM public.open_mics_historical
  WHERE open_mic ILIKE 'Girl Dinner' AND day = 'Tuesday'
);

-- The Secret Mic, Friday 4:00 PM @ NYCC Midtown (replaces the closed Pit row).
INSERT INTO public.open_mics_historical (
  unique_identifier, open_mic, day, start_time,
  venue_name, borough, neighborhood, location, city, venue_type,
  cost, sign_up_instructions, hosts_organizers, changes_updates,
  status, active, signup_enabled, frequency, signup_method, last_verified
)
SELECT
  gen_random_uuid(), 'The Secret Mic', 'Friday', '4:00 PM',
  'New York Comedy Club - Midtown', 'Manhattan', 'Gramercy',
  '241 East 24th Street, New York, NY', 'New York', 'Comedy Club',
  '$5', 'Sign up in person', '@the_secret_mics', '@the_secret_mics',
  'verified', true, false, 'weekly', 'in_person', '09/09/26'
WHERE NOT EXISTS (
  SELECT 1 FROM public.open_mics_historical
  WHERE open_mic ILIKE 'The Secret Mic' AND day = 'Friday'
    AND venue_name ILIKE '%Midtown%'
);

-- Hot Take, Monday 4:00 PM @ NYCC Midtown. No-material mic.
INSERT INTO public.open_mics_historical (
  unique_identifier, open_mic, day, start_time,
  venue_name, borough, neighborhood, location, city, venue_type,
  cost, sign_up_instructions, hosts_organizers, other_rules, changes_updates,
  status, active, signup_enabled, frequency, signup_method, last_verified
)
SELECT
  gen_random_uuid(), 'Hot Take', 'Monday', '4:00 PM',
  'New York Comedy Club - Midtown', 'Manhattan', 'Gramercy',
  '241 East 24th Street, New York, NY', 'New York', 'Comedy Club',
  '$5', 'Sign up in person', '@the_secret_mics',
  'No material mic: fresh takes only, do not run written material.',
  '@the_secret_mics',
  'verified', true, false, 'weekly', 'in_person', '09/09/26'
WHERE NOT EXISTS (
  SELECT 1 FROM public.open_mics_historical
  WHERE open_mic ILIKE 'Hot Take' AND day = 'Monday'
);

-- ---------------------------------------------------------------------------
-- 9. New mics staged as 'pending' because no venue was given.
--    scripts/export-mics.mjs filters status <> 'pending', so these will NOT
--    appear on the public site until a venue and address are filled in.
-- ---------------------------------------------------------------------------

-- damonmillard1: The Sunday Open Mic.
INSERT INTO public.open_mics_historical (
  unique_identifier, open_mic, day, start_time,
  city, cost, sign_up_instructions, other_rules, changes_updates,
  status, active, signup_enabled, frequency, signup_method
)
SELECT
  gen_random_uuid(), 'The Sunday Open Mic', 'Sunday', '8:00 PM',
  'New York', '$5',
  'Signups in person from 7:20 to 8PM only. No late comics.',
  'STAGED: venue name and address still needed before this goes public.',
  '@damonmillard1',
  'pending', true, false, 'weekly', 'in_person'
WHERE NOT EXISTS (
  SELECT 1 FROM public.open_mics_historical
  WHERE changes_updates ILIKE '%damonmillard1%' AND day = 'Sunday'
);

-- damonmillard1: new Wednesday mic.
INSERT INTO public.open_mics_historical (
  unique_identifier, open_mic, day, start_time,
  city, cost, sign_up_instructions, other_rules, changes_updates,
  status, active, signup_enabled, frequency, signup_method
)
SELECT
  gen_random_uuid(), 'Wednesday Mic (@damonmillard1)', 'Wednesday', '8:30 PM',
  'New York', '$5', 'Pre-signup required',
  'Signup link posted on IG story weekly. '
  || 'STAGED: venue name and address still needed before this goes public.',
  '@damonmillard1',
  'pending', true, false, 'weekly', 'online'
WHERE NOT EXISTS (
  SELECT 1 FROM public.open_mics_historical
  WHERE changes_updates ILIKE '%damonmillard1%' AND day = 'Wednesday'
);

COMMIT;

-- ---------------------------------------------------------------------------
-- Deliberately NOT changed (see the PR summary for details):
--   * "Grisly Pear Wednesday (@asapangry_)" 5 min + feedback -- @asapangry_
--     hosts a different mic entirely, and three Grisly Pear Wednesday rows
--     exist. Ambiguous, needs Adam to pick one.
--   * West Side Comedy Club "no 2 5 or 7 this week" -- those are one-week
--     skips, not closures, and that week has already passed.
--   * "Golden Pen @ EastVille Fri 6pm" -- the only Golden Pen row is SUNDAY
--     5:00 PM and was verified 8/4, a month AFTER the 7/5 cancellation report.
--   * bjhealy23 "not running until September or October" -- no mic named;
--     probable match is "Wreck the mic @ the Wreck". It is now September.
--   * "Rodney's CC Wed" -- already Wednesday 6:00 PM with Ellen Maloney.
--   * "Pear Midtown" / "Pear Village" -- the schedules kmehra sent already
--     match the live rows exactly, row for row.
-- ---------------------------------------------------------------------------
