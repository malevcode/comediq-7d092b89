
CREATE TABLE public.weekly_top_mics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mic_unique_identifier uuid NOT NULL,
  mic_name text NOT NULL,
  venue_name text,
  borough text,
  neighborhood text,
  day text,
  start_time text,
  cost text,
  like_count integer NOT NULL DEFAULT 0,
  rank integer NOT NULL,
  week_start date NOT NULL DEFAULT date_trunc('week', now())::date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_top_mics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read weekly top mics"
  ON public.weekly_top_mics FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage weekly top mics"
  ON public.weekly_top_mics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_weekly_top_mics_week ON public.weekly_top_mics (week_start);
