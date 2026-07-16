-- Keep all displayed banner ads admin-managed and limited to the current offers.
UPDATE public.banner_ads
SET is_active = false
WHERE is_active = true;

INSERT INTO public.banner_ads (
  label,
  href,
  external,
  position,
  sort_order,
  is_active,
  client_name
)
VALUES
  (
    'Likeable Podcast',
    'https://youtube.com/@davidsticklecomedy?si=LvLAmg2NElpPN3qx',
    true,
    'top',
    0,
    true,
    'Likeable Podcast'
  ),
  (
    'Comediq Premium',
    'https://docs.google.com/forms/d/1JPZVSQKoRJBUKmxBWLMTrT67g_XRa3RsVBlqsG7sonQ/edit',
    true,
    'top',
    1,
    true,
    'Comediq Premium'
  );
