-- Remove stale/outdated banner ads that were previously cleaned from the UI
DELETE FROM banner_ads WHERE id IN (
  '014b00a9-d942-419a-b337-602c56a3aadd', -- Likeable Podcast
  '83903c03-2a78-4451-bfbb-b024b9a1befa'  -- Comediq Book Me Mic
);
