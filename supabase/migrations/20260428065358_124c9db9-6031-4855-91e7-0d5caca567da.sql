
-- 1. Nominations table
CREATE TABLE public.motd_nominations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mic_unique_identifier uuid NOT NULL,
  nominated_by uuid NOT NULL,
  nomination_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/New_York')::date),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mic_unique_identifier, nomination_date)
);

-- One nomination per user per day
CREATE UNIQUE INDEX motd_nominations_user_day_idx
  ON public.motd_nominations (nominated_by, nomination_date);

ALTER TABLE public.motd_nominations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view nominations"
  ON public.motd_nominations FOR SELECT USING (true);

CREATE POLICY "Authenticated users can nominate"
  ON public.motd_nominations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = nominated_by);

CREATE POLICY "Users can withdraw their own nomination"
  ON public.motd_nominations FOR DELETE TO authenticated
  USING (auth.uid() = nominated_by);

CREATE POLICY "Admins manage nominations"
  ON public.motd_nominations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND isadmin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND isadmin = true));

-- 2. Votes table
CREATE TABLE public.motd_nomination_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nomination_id uuid NOT NULL REFERENCES public.motd_nominations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (nomination_id, user_id)
);

ALTER TABLE public.motd_nomination_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes"
  ON public.motd_nomination_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.motd_nomination_votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own vote"
  ON public.motd_nomination_votes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 3. Weekly defaults table (Sun=0..Sat=6)
CREATE TABLE public.motd_weekly_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week smallint NOT NULL UNIQUE CHECK (day_of_week BETWEEN 0 AND 6),
  mic_unique_identifier uuid NOT NULL,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.motd_weekly_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weekly defaults"
  ON public.motd_weekly_defaults FOR SELECT USING (true);

CREATE POLICY "Admins manage weekly defaults"
  ON public.motd_weekly_defaults FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND isadmin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND isadmin = true));

-- 4. Add admin-lock flag to mic_of_the_day
ALTER TABLE public.mic_of_the_day
  ADD COLUMN IF NOT EXISTS is_admin_locked boolean NOT NULL DEFAULT false;

-- 5. Tally view
CREATE OR REPLACE VIEW public.motd_nomination_tallies AS
SELECT
  n.id AS nomination_id,
  n.mic_unique_identifier,
  n.nomination_date,
  n.nominated_by,
  n.created_at,
  COALESCE(COUNT(v.id), 0) AS vote_count
FROM public.motd_nominations n
LEFT JOIN public.motd_nomination_votes v ON v.nomination_id = n.id
GROUP BY n.id;

-- 6. Resolver function
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

  -- Priority 4: auto-pick — most-verified active mic running that weekday
  day_label := TRIM(TO_CHAR(target_date, 'Day'));
  SELECT unique_identifier INTO result
  FROM public.open_mics_historical
  WHERE active = true
    AND day ILIKE day_label
  ORDER BY COALESCE(verification_count, 0) DESC, submission_date DESC NULLS LAST
  LIMIT 1;

  RETURN result;
END;
$$;
