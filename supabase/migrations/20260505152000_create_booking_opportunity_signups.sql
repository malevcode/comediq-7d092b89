-- Collect performer signups for booking opportunities on the Growth page.
CREATE TABLE IF NOT EXISTS public.booking_opportunity_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id text NOT NULL,
  opportunity_title text NOT NULL,
  user_id text,
  signup_mode text NOT NULL DEFAULT 'manual' CHECK (signup_mode IN ('account', 'manual')),
  name text,
  phone text,
  years_doing_standup text,
  performs_five_plus_weekly boolean,
  best_credit text,
  youtube_url text,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_opportunity_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit booking opportunity signups"
  ON public.booking_opportunity_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view booking opportunity signups"
  ON public.booking_opportunity_signups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()::text
        AND profiles.isadmin = true
    )
  );

CREATE POLICY "Admins can manage booking opportunity signups"
  ON public.booking_opportunity_signups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()::text
        AND profiles.isadmin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()::text
        AND profiles.isadmin = true
    )
  );

CREATE TRIGGER update_booking_opportunity_signups_updated_at
  BEFORE UPDATE ON public.booking_opportunity_signups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
