-- Keep top sponsorships separate from the bottom navigation ads.
UPDATE public.banner_ads
SET is_active = false
WHERE position = 'top';

UPDATE public.banner_ads
SET position = 'top',
    sort_order = 0,
    is_active = true,
    href = 'https://youtube.com/@davidsticklecomedy?si=LvLAmg2NElpPN3qx',
    external = true,
    client_name = 'Likeable Podcast'
WHERE label = 'Likeable Podcast';

INSERT INTO public.banner_ads (
  label,
  href,
  external,
  position,
  sort_order,
  is_active,
  client_name
)
SELECT
  'Likeable Podcast',
  'https://youtube.com/@davidsticklecomedy?si=LvLAmg2NElpPN3qx',
  true,
  'top',
  0,
  true,
  'Likeable Podcast'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.banner_ads
  WHERE label = 'Likeable Podcast'
    AND position = 'top'
);

INSERT INTO public.banner_ads (
  label,
  href,
  external,
  position,
  sort_order,
  is_active,
  client_name
)
SELECT
  'Comediq Premium',
  'https://docs.google.com/forms/d/1JPZVSQKoRJBUKmxBWLMTrT67g_XRa3RsVBlqsG7sonQ/edit',
  true,
  'top',
  1,
  true,
  'Comediq Premium'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.banner_ads
  WHERE label = 'Comediq Premium'
    AND position = 'top'
);

UPDATE public.banner_ads
SET position = 'top',
    sort_order = CASE WHEN label = 'Likeable Podcast' THEN 0 ELSE 1 END,
    is_active = true
WHERE label IN ('Likeable Podcast', 'Comediq Premium');
