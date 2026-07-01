-- The Likeable podcast listing is now rendered directly on the Growth page
-- (src/pages/GrowthOpportunities.tsx) with updated copy. Remove the older
-- seeded row so it doesn't show up as a duplicate card on the Podcasts tab.
DELETE FROM public.growth_opportunities
WHERE type = 'podcast' AND title = 'Likeable with David Stickle';
