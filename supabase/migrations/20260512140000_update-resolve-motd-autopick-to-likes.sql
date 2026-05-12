-- Update resolve_motd_for: auto-pick (priority 4) now orders by most likes
-- instead of verification_count, so the most popular mic wins when no
-- admin lock, votes, or weekly default is set.

CREATE OR REPLACE FUNCTION public.resolve_motd_for(target_date date)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result uuid;
  dow smallint;
  day_label text;
BEGIN
  -- Priority 1: admin-locked entry for that date
  SELECT mic_unique_identifier INTO result
  FROM public.mic_of_the_day
  WHERE claim_date = target_date AND is_admin_locked = true
  LIMIT 1;
  IF result IS NOT NULL THEN RETURN result; END IF;

  -- Priority 2: top-voted nomination for that date (tie-break: earliest nomination)
  SELECT t.mic_unique_identifier INTO result
  FROM public.motd_nomination_tallies t
  WHERE t.nomination_date = target_date
  ORDER BY t.vote_count DESC, t.created_at ASC
  LIMIT 1;
  IF result IS NOT NULL THEN RETURN result; END IF;

  -- Priority 3: admin-set weekly default for the weekday
  dow := EXTRACT(DOW FROM target_date)::smallint;
  SELECT mic_unique_identifier INTO result
  FROM public.motd_weekly_defaults
  WHERE day_of_week = dow
  LIMIT 1;
  IF result IS NOT NULL THEN RETURN result; END IF;

  -- Priority 4: auto-pick — most-liked active mic running that weekday
  day_label := TRIM(TO_CHAR(target_date, 'Day'));
  SELECT omh.unique_identifier::uuid INTO result
  FROM public.open_mics_historical omh
  LEFT JOIN public.mic_like_counts mlc
         ON mlc.mic_unique_identifier = omh.unique_identifier
  WHERE omh.active = true
    AND omh.day ILIKE day_label
  ORDER BY COALESCE(mlc.likes, 0) DESC, COALESCE(omh.verification_count, 0) DESC, omh.submission_date DESC NULLS LAST
  LIMIT 1;

  RETURN result;
END;
$$;
