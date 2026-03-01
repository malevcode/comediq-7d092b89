
-- Analytics events table for full tracking (page views, clicks, feature usage)
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  user_id uuid,
  event_type text NOT NULL, -- 'page_view', 'click', 'feature_use'
  event_name text NOT NULL, -- e.g. 'view_open_mics', 'click_save_mic', 'click_signup'
  page_path text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for admin queries
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events (event_type);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events (session_id);
CREATE INDEX idx_analytics_events_page_path ON public.analytics_events (page_path);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (including anonymous visitors)
CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Admins can read analytics events"
ON public.analytics_events
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true
));

-- Admins can delete old events for cleanup
CREATE POLICY "Admins can delete analytics events"
ON public.analytics_events
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true
));
