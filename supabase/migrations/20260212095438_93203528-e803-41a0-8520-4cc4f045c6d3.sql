
-- Fix the ad_click_counts view to use SECURITY INVOKER
DROP VIEW IF EXISTS public.ad_click_counts;
CREATE VIEW public.ad_click_counts WITH (security_invoker = true) AS
  SELECT ad_id, COUNT(*) AS click_count
  FROM public.ad_clicks
  GROUP BY ad_id;
