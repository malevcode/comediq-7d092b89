
-- Add sponsor-related columns to banner_ads
ALTER TABLE public.banner_ads
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS cta_text text DEFAULT 'Learn More';

-- Add placement column to ad_clicks to distinguish where the click came from
ALTER TABLE public.ad_clicks
  ADD COLUMN IF NOT EXISTS placement text DEFAULT 'banner';
