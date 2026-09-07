-- Allow shows to be listed before the host confirms a start time.
--
-- Some shows arrive from hosts as "next show is Oct 3" with no venue and no
-- time yet. Previously show_time was NOT NULL, which meant listing those shows
-- required inventing a start time. A fabricated "8:00 PM" on a card is worse
-- than showing nothing, so the column is now nullable and the UI renders
-- "Time TBA" when it is null.

ALTER TABLE public.audience_shows ALTER COLUMN show_time DROP NOT NULL;
