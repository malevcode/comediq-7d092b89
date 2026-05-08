CREATE OR REPLACE FUNCTION public.resolve_motd_for(target_date text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result text;
  dow int;
BEGIN
  -- 1. Admin-locked pick for this date
  SELECT mic_unique_identifier INTO result
  FROM public.mic_of_the_day
  WHERE claim_date = target_date AND is_admin_locked = true
  ORDER BY claimed_at DESC
  LIMIT 1;
  IF result IS NOT NULL THEN RETURN result; END IF;

  -- 2. Most-voted nomination for this date
  SELECT mic_unique_identifier INTO result
  FROM public.motd_nomination_tallies
  WHERE nomination_date = target_date
  ORDER BY vote_count DESC, created_at ASC
  LIMIT 1;
  IF result IS NOT NULL THEN RETURN result; END IF;

  -- 3. Weekly default for this day-of-week (0=Sun..6=Sat)
  dow := EXTRACT(DOW FROM target_date::date)::int;
  SELECT mic_unique_identifier INTO result
  FROM public.motd_weekly_defaults
  WHERE day_of_week = dow
  ORDER BY updated_at DESC
  LIMIT 1;
  IF result IS NOT NULL THEN RETURN result; END IF;

  -- 4. Most recent claim for the date
  SELECT mic_unique_identifier INTO result
  FROM public.mic_of_the_day
  WHERE claim_date = target_date
  ORDER BY claimed_at DESC
  LIMIT 1;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_motd_for(text) TO anon, authenticated;