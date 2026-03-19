ALTER TABLE public.banner_ads DROP CONSTRAINT IF EXISTS banner_ads_position_check;
ALTER TABLE public.banner_ads ADD CONSTRAINT banner_ads_position_check
  CHECK (position = ANY (ARRAY['top', 'bottom', 'sponsor']));