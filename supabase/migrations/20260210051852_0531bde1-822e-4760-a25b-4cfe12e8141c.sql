-- Fix missing default for created_at on open_mics_requests
ALTER TABLE public.open_mics_requests ALTER COLUMN created_at SET DEFAULT now();

-- Backfill any null created_at values
UPDATE public.open_mics_requests SET created_at = '2026-02-10T00:00:00Z' WHERE created_at IS NULL;

-- Delete test record
DELETE FROM public.open_mics_requests WHERE show_title = 'Test Mic Submit' AND venue_name = 'Test Venue';