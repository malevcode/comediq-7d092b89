INSERT INTO public.banner_ads (label, href, external, position, sort_order, is_active)
SELECT 'Likeable Podcast 👍', 'https://youtube.com/@davidsticklecomedy?si=LvLAmg2NElpPN3qx', true, 'top', 10, true
WHERE NOT EXISTS (SELECT 1 FROM public.banner_ads WHERE label ILIKE '%Likeable Podcast%');

DELETE FROM public.banner_ads WHERE label ILIKE '%St. Marks%' OR label ILIKE '%St Marks%' OR label ILIKE '%stmarks%';