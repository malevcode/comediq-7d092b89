-- Set MOTD weekly defaults for each day of the week.
-- Priority: admin lock > top vote > this weekly default > auto-pick.
-- day_of_week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
--
-- For each day: try the preferred Comediq partner mic first.
-- If not found, fall back to the most-liked active mic for that day.

CREATE OR REPLACE FUNCTION pg_temp.most_liked_for_day(p_day text)
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT omh.unique_identifier::uuid
  FROM public.open_mics_historical omh
  LEFT JOIN public.mic_like_counts mlc
         ON mlc.mic_unique_identifier = omh.unique_identifier
  WHERE omh.active = true AND omh.day ILIKE p_day
  ORDER BY COALESCE(mlc.likes, 0) DESC, COALESCE(omh.verification_count, 0) DESC
  LIMIT 1;
$$;

DO $$
DECLARE
  v_mic_id uuid;
BEGIN

  -- Sunday (0): Fear City mic
  SELECT unique_identifier::uuid INTO v_mic_id
    FROM public.open_mics_historical
    WHERE active = true AND open_mic ILIKE '%Fear City%'
    ORDER BY COALESCE(verification_count, 0) DESC LIMIT 1;
  IF v_mic_id IS NULL THEN
    v_mic_id := pg_temp.most_liked_for_day('Sunday');
    RAISE NOTICE 'Sunday: Fear City not found — using most-liked Sunday mic (%)', v_mic_id;
  ELSE
    RAISE NOTICE 'Sunday default set to Fear City mic (%)', v_mic_id;
  END IF;
  IF v_mic_id IS NOT NULL THEN
    UPDATE public.motd_weekly_defaults SET mic_unique_identifier = v_mic_id, updated_at = now() WHERE day_of_week = 0;
    IF NOT FOUND THEN INSERT INTO public.motd_weekly_defaults (day_of_week, mic_unique_identifier) VALUES (0, v_mic_id); END IF;
  END IF;

  -- Monday (1): KGB Bar mic
  SELECT unique_identifier::uuid INTO v_mic_id
    FROM public.open_mics_historical
    WHERE active = true AND (venue_name ILIKE '%KGB%' OR open_mic ILIKE '%KGB%')
    ORDER BY COALESCE(verification_count, 0) DESC LIMIT 1;
  IF v_mic_id IS NULL THEN
    v_mic_id := pg_temp.most_liked_for_day('Monday');
    RAISE NOTICE 'Monday: KGB Bar not found — using most-liked Monday mic (%)', v_mic_id;
  ELSE
    RAISE NOTICE 'Monday default set to KGB Bar mic (%)', v_mic_id;
  END IF;
  IF v_mic_id IS NOT NULL THEN
    UPDATE public.motd_weekly_defaults SET mic_unique_identifier = v_mic_id, updated_at = now() WHERE day_of_week = 1;
    IF NOT FOUND THEN INSERT INTO public.motd_weekly_defaults (day_of_week, mic_unique_identifier) VALUES (1, v_mic_id); END IF;
  END IF;

  -- Tuesday (2): No Nazar Cafe
  SELECT unique_identifier::uuid INTO v_mic_id
    FROM public.open_mics_historical
    WHERE active = true AND venue_name ILIKE '%No Nazar%' AND day = 'Tuesday'
    ORDER BY COALESCE(verification_count, 0) DESC LIMIT 1;
  IF v_mic_id IS NULL THEN
    v_mic_id := pg_temp.most_liked_for_day('Tuesday');
    RAISE NOTICE 'Tuesday: No Nazar Cafe not found — using most-liked Tuesday mic (%)', v_mic_id;
  ELSE
    RAISE NOTICE 'Tuesday default set to No Nazar Cafe mic (%)', v_mic_id;
  END IF;
  IF v_mic_id IS NOT NULL THEN
    UPDATE public.motd_weekly_defaults SET mic_unique_identifier = v_mic_id, updated_at = now() WHERE day_of_week = 2;
    IF NOT FOUND THEN INSERT INTO public.motd_weekly_defaults (day_of_week, mic_unique_identifier) VALUES (2, v_mic_id); END IF;
  END IF;

  -- Wednesday (3): Judy Z mic
  SELECT unique_identifier::uuid INTO v_mic_id
    FROM public.open_mics_historical
    WHERE active = true AND (open_mic ILIKE '%Judy Z%' OR hosts_organizers ILIKE '%Judy Z%')
    ORDER BY COALESCE(verification_count, 0) DESC LIMIT 1;
  IF v_mic_id IS NULL THEN
    v_mic_id := pg_temp.most_liked_for_day('Wednesday');
    RAISE NOTICE 'Wednesday: Judy Z not found — using most-liked Wednesday mic (%)', v_mic_id;
  ELSE
    RAISE NOTICE 'Wednesday default set to Judy Z mic (%)', v_mic_id;
  END IF;
  IF v_mic_id IS NOT NULL THEN
    UPDATE public.motd_weekly_defaults SET mic_unique_identifier = v_mic_id, updated_at = now() WHERE day_of_week = 3;
    IF NOT FOUND THEN INSERT INTO public.motd_weekly_defaults (day_of_week, mic_unique_identifier) VALUES (3, v_mic_id); END IF;
  END IF;

  -- Thursday (4): Knockouts comedy mic
  SELECT unique_identifier::uuid INTO v_mic_id
    FROM public.open_mics_historical
    WHERE active = true AND (open_mic ILIKE '%Knockout%' OR venue_name ILIKE '%Knockout%')
    ORDER BY COALESCE(verification_count, 0) DESC LIMIT 1;
  IF v_mic_id IS NULL THEN
    v_mic_id := pg_temp.most_liked_for_day('Thursday');
    RAISE NOTICE 'Thursday: Knockouts not found — using most-liked Thursday mic (%)', v_mic_id;
  ELSE
    RAISE NOTICE 'Thursday default set to Knockouts mic (%)', v_mic_id;
  END IF;
  IF v_mic_id IS NOT NULL THEN
    UPDATE public.motd_weekly_defaults SET mic_unique_identifier = v_mic_id, updated_at = now() WHERE day_of_week = 4;
    IF NOT FOUND THEN INSERT INTO public.motd_weekly_defaults (day_of_week, mic_unique_identifier) VALUES (4, v_mic_id); END IF;
  END IF;

  -- Friday (5): Drew 1pm hourlong GVCC mic
  SELECT unique_identifier::uuid INTO v_mic_id
    FROM public.open_mics_historical
    WHERE active = true AND (open_mic ILIKE '%GVCC%' OR venue_name ILIKE '%GVCC%' OR open_mic ILIKE '%Greenwich Village Comedy%')
    ORDER BY COALESCE(verification_count, 0) DESC LIMIT 1;
  IF v_mic_id IS NULL THEN
    v_mic_id := pg_temp.most_liked_for_day('Friday');
    RAISE NOTICE 'Friday: GVCC not found — using most-liked Friday mic (%)', v_mic_id;
  ELSE
    RAISE NOTICE 'Friday default set to GVCC mic (%)', v_mic_id;
  END IF;
  IF v_mic_id IS NOT NULL THEN
    UPDATE public.motd_weekly_defaults SET mic_unique_identifier = v_mic_id, updated_at = now() WHERE day_of_week = 5;
    IF NOT FOUND THEN INSERT INTO public.motd_weekly_defaults (day_of_week, mic_unique_identifier) VALUES (5, v_mic_id); END IF;
  END IF;

  -- Saturday (6): Tiny Cupboard 11:45 mic
  SELECT unique_identifier::uuid INTO v_mic_id
    FROM public.open_mics_historical
    WHERE active = true AND (open_mic ILIKE '%Tiny Cupboard%' OR venue_name ILIKE '%Tiny Cupboard%')
    ORDER BY COALESCE(verification_count, 0) DESC LIMIT 1;
  IF v_mic_id IS NULL THEN
    v_mic_id := pg_temp.most_liked_for_day('Saturday');
    RAISE NOTICE 'Saturday: Tiny Cupboard not found — using most-liked Saturday mic (%)', v_mic_id;
  ELSE
    RAISE NOTICE 'Saturday default set to Tiny Cupboard mic (%)', v_mic_id;
  END IF;
  IF v_mic_id IS NOT NULL THEN
    UPDATE public.motd_weekly_defaults SET mic_unique_identifier = v_mic_id, updated_at = now() WHERE day_of_week = 6;
    IF NOT FOUND THEN INSERT INTO public.motd_weekly_defaults (day_of_week, mic_unique_identifier) VALUES (6, v_mic_id); END IF;
  END IF;

END $$;
