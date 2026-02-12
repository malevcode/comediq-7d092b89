
-- Create banner_ads table
CREATE TABLE public.banner_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  external BOOLEAN DEFAULT true,
  position TEXT CHECK (position IN ('top', 'bottom')) DEFAULT 'top',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  icon_url TEXT,
  client_name TEXT,
  amount_paid NUMERIC,
  payment_method TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banner_ads ENABLE ROW LEVEL SECURITY;

-- Everyone can read ads (needed for marquee)
CREATE POLICY "Anyone can view active banner ads"
  ON public.banner_ads FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert banner ads"
  ON public.banner_ads FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND isadmin = true));

CREATE POLICY "Admins can update banner ads"
  ON public.banner_ads FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND isadmin = true));

CREATE POLICY "Admins can delete banner ads"
  ON public.banner_ads FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND isadmin = true));

-- Trigger for updated_at
CREATE TRIGGER update_banner_ads_updated_at
  BEFORE UPDATE ON public.banner_ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create ad_clicks table
CREATE TABLE public.ad_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.banner_ads(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID
);

ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone can insert clicks
CREATE POLICY "Anyone can record ad clicks"
  ON public.ad_clicks FOR INSERT
  WITH CHECK (true);

-- Only admins can view clicks
CREATE POLICY "Admins can view ad clicks"
  ON public.ad_clicks FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND isadmin = true));

-- Create a view for click counts
CREATE VIEW public.ad_click_counts AS
  SELECT ad_id, COUNT(*) AS click_count
  FROM public.ad_clicks
  GROUP BY ad_id;

-- Seed existing hardcoded ads
INSERT INTO public.banner_ads (label, href, external, position, sort_order, is_active) VALUES
  ('#MeThree', 'https://metoomvmt.org/', true, 'top', 0, true),
  ('Comediq Supports Safe Funny Spaces', '/', false, 'top', 1, true),
  ('Advertise!', 'https://docs.google.com/forms/d/e/1FAIpQLSe58Za3tfgyuUFNoVxQb_qAe3PPfVrnm4gciw_cklp-HPkKQg/viewform?usp=publish-editor', true, 'top', 2, true),
  ('Add A Mic', '/open-mics?addMic=true', false, 'bottom', 0, true),
  ('Add Your Show', 'https://forms.gle/6acD4UbmJyY45tzz9', true, 'bottom', 1, true),
  ('Feedback', 'https://docs.google.com/forms/d/e/1FAIpQLSeDk4FdZGDD1APBNCUzV1IhaylLiHSAnlmhUaUz503umv457A/viewform?usp=dialog', true, 'bottom', 2, true),
  ('Advertise!', 'https://docs.google.com/forms/d/e/1FAIpQLSe58Za3tfgyuUFNoVxQb_qAe3PPfVrnm4gciw_cklp-HPkKQg/viewform?usp=publish-editor', true, 'bottom', 3, true);

-- Likeable Podcast ad
INSERT INTO public.banner_ads (label, href, external, position, sort_order, is_active, icon_url, client_name, amount_paid, payment_method, start_date, end_date) VALUES
  ('Likeable Podcast', 'https://youtube.com/playlist?list=PLnHfEX5rBprYo7ASx3JK__PLnJCTvNFnx&si=lNB63gdc50CmuJJz', true, 'top', 3, true, '/images/likeable-podcast.png', 'Likeable Podcast', 140.00, 'venmo', '2026-02-12', '2026-03-12');
