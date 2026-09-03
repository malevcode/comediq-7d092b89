-- RUN ON OR AFTER 2026-09-11.
-- Partea Lab / Humor Section (@tonychoucomedy), Thursday 7:00 PM.
-- Venue is closing; 9/10/26 was the final date.
UPDATE public.open_mics_historical
SET active = false,
    other_rules = 'No longer running — venue closed after the final mic on 9/10/26.',
    last_verified = '09/10/26'
WHERE unique_identifier = '7904df9c-8a37-48d3-a5f2-2e35ae7d5cdc';
