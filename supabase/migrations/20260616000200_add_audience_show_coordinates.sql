alter table public.audience_shows
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists geocoded_at timestamptz,
  add column if not exists geocoding_provider text,
  add column if not exists geocoding_score double precision,
  add column if not exists geocoding_match_address text;

create index if not exists audience_shows_coordinates_idx
  on public.audience_shows (latitude, longitude)
  where latitude is not null and longitude is not null;
