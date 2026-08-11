-- Repair Supabase security advisor findings for public schema tables/views.
-- This migration is intentionally idempotent and preserves public read surfaces
-- needed by the app while keeping management/private data behind admin policies.

-- ---------------------------------------------------------------------------
-- Tables exposed through PostgREST
-- ---------------------------------------------------------------------------

ALTER TABLE public.gcal_clicks ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.gcal_clicks TO authenticated;
DROP POLICY IF EXISTS "Users can record own Google Calendar clicks" ON public.gcal_clicks;
CREATE POLICY "Users can record own Google Calendar clicks"
ON public.gcal_clicks
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can view Google Calendar clicks" ON public.gcal_clicks;
CREATE POLICY "Admins can view Google Calendar clicks"
ON public.gcal_clicks
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

ALTER TABLE public.growth_opportunities ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.growth_opportunities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.growth_opportunities TO authenticated;
DROP POLICY IF EXISTS "Anyone can view active opportunities" ON public.growth_opportunities;
CREATE POLICY "Anyone can view active opportunities"
ON public.growth_opportunities
FOR SELECT
TO anon, authenticated
USING (is_active IS TRUE AND COALESCE(status, 'approved') = 'approved');
DROP POLICY IF EXISTS "Users can view own submitted opportunities" ON public.growth_opportunities;
CREATE POLICY "Users can view own submitted opportunities"
ON public.growth_opportunities
FOR SELECT
TO authenticated
USING (submitted_by = auth.uid());
DROP POLICY IF EXISTS "Authenticated users can submit opportunities" ON public.growth_opportunities;
CREATE POLICY "Authenticated users can submit opportunities"
ON public.growth_opportunities
FOR INSERT
TO authenticated
WITH CHECK (submitted_by = auth.uid());
DROP POLICY IF EXISTS "Admins have full access to opportunities" ON public.growth_opportunities;
CREATE POLICY "Admins have full access to opportunities"
ON public.growth_opportunities
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

ALTER TABLE public.venue_sources ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.venue_sources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.venue_sources TO authenticated;
DROP POLICY IF EXISTS "Anyone can view approved venue sources" ON public.venue_sources;
CREATE POLICY "Anyone can view approved venue sources"
ON public.venue_sources
FOR SELECT
TO anon, authenticated
USING (is_active IS TRUE AND permission_status = 'approved');
DROP POLICY IF EXISTS "Admins can manage venue_sources" ON public.venue_sources;
CREATE POLICY "Admins can manage venue_sources"
ON public.venue_sources
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.waitlist TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.waitlist TO authenticated;
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
CREATE POLICY "Anyone can join waitlist"
ON public.waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can manage waitlist" ON public.waitlist;
CREATE POLICY "Admins can manage waitlist"
ON public.waitlist
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

ALTER TABLE public.weekly_top_mics ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.weekly_top_mics TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.weekly_top_mics TO authenticated;
DROP POLICY IF EXISTS "Anyone can read weekly top mics" ON public.weekly_top_mics;
CREATE POLICY "Anyone can read weekly top mics"
ON public.weekly_top_mics
FOR SELECT
TO anon, authenticated
USING (true);
DROP POLICY IF EXISTS "Admins can manage weekly top mics" ON public.weekly_top_mics;
CREATE POLICY "Admins can manage weekly top mics"
ON public.weekly_top_mics
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

ALTER TABLE public.mic_of_the_day ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.mic_of_the_day TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mic_of_the_day TO authenticated;
DROP POLICY IF EXISTS "Anyone can view mic of the day" ON public.mic_of_the_day;
CREATE POLICY "Anyone can view mic of the day"
ON public.mic_of_the_day
FOR SELECT
TO anon, authenticated
USING (true);
DROP POLICY IF EXISTS "Verified hosts can claim mic of the day" ON public.mic_of_the_day;
CREATE POLICY "Verified hosts can claim mic of the day"
ON public.mic_of_the_day
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = claimed_by
  AND EXISTS (
    SELECT 1
    FROM public.mic_hosts
    WHERE mic_hosts.user_id = auth.uid()
      AND mic_hosts.mic_id = mic_of_the_day.mic_unique_identifier
      AND mic_hosts.is_verified IS TRUE
  )
);
DROP POLICY IF EXISTS "Admins can manage mic of the day" ON public.mic_of_the_day;
CREATE POLICY "Admins can manage mic of the day"
ON public.mic_of_the_day
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

ALTER TABLE public.motd_weekly_defaults ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.motd_weekly_defaults TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.motd_weekly_defaults TO authenticated;
DROP POLICY IF EXISTS "Anyone can view weekly defaults" ON public.motd_weekly_defaults;
CREATE POLICY "Anyone can view weekly defaults"
ON public.motd_weekly_defaults
FOR SELECT
TO anon, authenticated
USING (true);
DROP POLICY IF EXISTS "Admins manage weekly defaults" ON public.motd_weekly_defaults;
CREATE POLICY "Admins manage weekly defaults"
ON public.motd_weekly_defaults
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

ALTER TABLE public.audience_shows ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.audience_shows TO anon, authenticated;
GRANT INSERT ON public.audience_shows TO anon, authenticated;
GRANT UPDATE, DELETE ON public.audience_shows TO authenticated;
DROP POLICY IF EXISTS "Anyone can view verified active shows" ON public.audience_shows;
CREATE POLICY "Anyone can view verified active shows"
ON public.audience_shows
FOR SELECT
TO anon, authenticated
USING (
  verified IS TRUE
  AND COALESCE(status, 'active') = 'active'
  AND COALESCE(is_active, true) IS TRUE
  AND (
    source IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.venue_sources vs
      WHERE vs.source_key = audience_shows.source
        AND vs.is_active IS TRUE
        AND vs.permission_status = 'approved'
    )
  )
);
DROP POLICY IF EXISTS "Anyone can submit unverified audience shows" ON public.audience_shows;
CREATE POLICY "Anyone can submit unverified audience shows"
ON public.audience_shows
FOR INSERT
TO anon, authenticated
WITH CHECK (
  COALESCE(verified, false) IS FALSE
  AND COALESCE(status, 'active') = 'active'
);
DROP POLICY IF EXISTS "Admins can manage audience shows" ON public.audience_shows;
CREATE POLICY "Admins can manage audience shows"
ON public.audience_shows
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

-- ---------------------------------------------------------------------------
-- Views should evaluate permissions/RLS as the querying user.
-- ---------------------------------------------------------------------------

ALTER VIEW IF EXISTS public.open_mics_display SET (security_invoker = true);
ALTER VIEW IF EXISTS public.ad_click_counts SET (security_invoker = true);
ALTER VIEW IF EXISTS public.ad_revenue_summary SET (security_invoker = true);
ALTER VIEW IF EXISTS public.mic_latest_verification SET (security_invoker = true);
ALTER VIEW IF EXISTS public.motd_nomination_tallies SET (security_invoker = true);
ALTER VIEW IF EXISTS public.mic_like_counts SET (security_invoker = true);
ALTER VIEW IF EXISTS public.mic_comment_counts SET (security_invoker = true);
ALTER VIEW IF EXISTS public.mic_saved_counts SET (security_invoker = true);
ALTER VIEW IF EXISTS public.profile_display SET (security_invoker = true);
