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

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Closed for good
-- ---------------------------------------------------------------------------

-- "Chewsday" -> Chewsdays Innit, Tuesday 6:00 PM @ One and One. Confirmed dead.
UPDATE public.open_mics_historical
SET active = false,
    other_rules = 'No longer running (confirmed by host, September 2026).',
    last_verified = '09/03/26'
WHERE unique_identifier = '79d61feb-e9c6-48da-b824-c730cda652d4';

-- ---------------------------------------------------------------------------
-- 2. Going on hiatus (left ACTIVE until their final date, note added now)
-- ---------------------------------------------------------------------------

-- Sick Hat, Wednesday 8:00 PM @ Cobra Club. Final dates 9/2, 9/16, 10/7.
UPDATE public.open_mics_historical
SET frequency = 'custom',
    frequency_custom_text = 'Final dates before hiatus: 9/16 and 10/7',
    other_rules = 'Going on hiatus after 10/7/26. May relocate venue, TBD.',
    last_verified = '09/03/26'
WHERE unique_identifier = '51495931-553e-44b2-846d-a643502ee193';

-- Partea Lab / Humor Section (@tonychoucomedy), Thursday 7:00 PM. Venue closing.
UPDATE public.open_mics_historical
SET frequency = 'custom',
    frequency_custom_text = 'Final date 9/10/26',
    other_rules = 'English / Chinese-friendly. Produced by Humor Section. '
                  || 'Final date is 9/10/26 — venue is closing.',
    last_verified = '09/03/26'
WHERE unique_identifier = '7904df9c-8a37-48d3-a5f2-2e35ae7d5cdc';

-- ---------------------------------------------------------------------------
-- 3. Time / format changes
-- ---------------------------------------------------------------------------

-- Energizer Honeys -> every other Wednesday, 5:30 PM (was weekly, 6:00 PM).
-- latest_end_time is left at 7:30 PM; the blast did not give a new end time.
UPDATE public.open_mics_historical
SET start_time = '5:30 PM',
    frequency = 'bi_weekly',
    frequency_custom_text = 'Every other Wednesday',
    last_verified = '09/03/26'
WHERE unique_identifier = '566c7f42-f346-43ed-8827-b64993fa00e4';

-- Have A Good Mic -> 8:30 PM (was 7:30 PM).
UPDATE public.open_mics_historical
SET start_time = '8:30 PM',
    last_verified = '09/03/26'
WHERE unique_identifier = '4f3c866e-7c45-4710-9839-e63550682f6b';

-- ---------------------------------------------------------------------------
-- 4. Host / name / signup changes
-- ---------------------------------------------------------------------------

-- Oddball Matt's mic -> Last Stop Mic, Saturday 11:30 PM @ Eastville.
-- Host replaced as instructed. This drops the co-host "Angel Contreras";
-- see the summary — confirm whether he should stay on the listing.
UPDATE public.open_mics_historical
SET hosts_organizers = 'Thomas Purdy',
    last_verified = '09/03/26'
WHERE unique_identifier = '14429d05-13d7-4f81-96b9-8c1926cab6d6';

-- Feelings Wheel -> "The Feelings Anonymous Mic".
-- The old display name carried "*1st & 3rd*", so the schedule is moved into
-- frequency/frequency_custom_text before the name drops it. The stored
-- Instagram handle (changes_updates) is deliberately NOT touched.
UPDATE public.open_mics_historical
SET open_mic = 'The Feelings Anonymous Mic',
    frequency = 'custom',
    frequency_custom_text = '1st and 3rd Saturday monthly',
    last_verified = '09/03/26'
WHERE unique_identifier = '8e71ab7e-f562-4464-bcab-01112f3f3275';

-- Fun Mic @ Freddy's -> signup is now the Google Form linked in the IG bio.
-- The stored signup_url still points at a *closed* Google Form; left alone
-- here because the blast did not supply the new link. See summary.
UPDATE public.open_mics_historical
SET sign_up_instructions = 'Sign up via Google Form linked in IG bio',
    last_verified = '09/03/26'
WHERE unique_identifier = 'b3f843a1-f2d8-4240-9236-582e3541c784';

-- ---------------------------------------------------------------------------
-- 5. Mics reported as "new" that already exist -> updated in place, not
--    inserted, so the public list does not end up with duplicates.
-- ---------------------------------------------------------------------------

-- Greenpoint Comedy Club, Wednesday. Already listed at 5:30 PM; the blast
-- adds the host name and corrects the cost.
UPDATE public.open_mics_historical
SET hosts_organizers = 'Jake',
    cost = 'Free with 1 item bar purchase',
    sign_up_instructions = 'Sign up in person from 5PM (30 minutes pre-show). '
                           || 'For questions, please email info@greenpointcomedy.com',
    last_verified = '09/03/26'
WHERE unique_identifier = '71459ec0-438e-4579-b429-ca4a00596b02';

-- Comedy in Harlem, Tuesday ("Paid by the Bell"). Start time 6:00 PM already
-- correct; only the signup time changes (5:30, was written up as 5PM doors).
UPDATE public.open_mics_historical
SET sign_up_instructions = 'Sign up at 5:30PM',
    last_verified = '09/03/26'
WHERE unique_identifier = '1e536831-cc9b-40b4-8bae-b20177756ea3';

-- Comedy in Harlem, Monday ("Funny Lines"). 5PM signup / 5:30 PM start were
-- already correct; touch only last_verified so the September check is recorded.
UPDATE public.open_mics_historical
SET last_verified = '09/03/26'
WHERE unique_identifier = '6e48fa02-a9c0-4729-8ff8-1d1409df5fad';

-- ---------------------------------------------------------------------------
-- 6. Genuinely new mic — staged as 'pending' because it has no venue yet.
--    scripts/export-mics.mjs filters status != 'pending', so this will NOT
--    appear on the public site until a venue and address are filled in.
-- ---------------------------------------------------------------------------

INSERT INTO public.open_mics_historical (
  unique_identifier, open_mic, day, start_time,
  city, cost, sign_up_instructions, hosts_organizers,
  other_rules, changes_updates,
  status, active, signup_enabled, frequency, signup_method
)
SELECT
  gen_random_uuid(),
  'Wednesday Mic (@damonmillard1)',
  'Wednesday',
  '8:30 PM',
  'New York',
  '$5',
  'Pre-signup required',
  NULL,
  'Signup link posted on IG story weekly. '
  || 'STAGED: venue name and address still needed before this goes public.',
  '@damonmillard1',
  'pending',
  true,
  false,
  'weekly',
  'online'
WHERE NOT EXISTS (
  SELECT 1 FROM public.open_mics_historical
  WHERE changes_updates ILIKE '%damonmillard1%'
    AND day = 'Wednesday'
);

-- ---------------------------------------------------------------------------
-- 7. Address correction
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
    last_verified = '09/03/26'
WHERE unique_identifier = '0336da7f-a548-4ac2-970c-a70814ae8e7d';

COMMIT;

-- ---------------------------------------------------------------------------
-- Deliberately NOT changed (see the session summary for details):
--   * "Golden Pen @ EastVille Fri 6pm" — the only Golden Pen row is SUNDAY
--     5:00 PM. No Friday 6PM Eastville mic exists. Not deactivated.
--   * "Grisly Pear Wednesday (@asapangry_)" — @asapangry_ hosts a different
--     mic entirely, and three Grisly Pear Wednesday rows exist. Ambiguous.
--   * "Rodney's CC Wed" — already Wednesday 6:00 PM, host already Ellen
--     Maloney. Nothing to change.
--   * "The Sunday Open Mic" (damonmillard1) — no matching row in the DB.
--   * "Pear Midtown" / "Pear Village" — the requested schedules already
--     match the live rows exactly. No replacement needed.
-- ---------------------------------------------------------------------------
