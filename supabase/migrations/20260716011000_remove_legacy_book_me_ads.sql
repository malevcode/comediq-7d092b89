-- Remove retired Book Me ads from the admin-managed banner inventory.
DELETE FROM public.banner_ads
WHERE label ILIKE '%book me%'
   OR label ILIKE '%high line comedy club%'
   OR href ILIKE '%book-me%';
