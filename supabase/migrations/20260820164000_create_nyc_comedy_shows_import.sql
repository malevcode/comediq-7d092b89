create table if not exists public.nyc_comedy_shows_import (
  id uuid primary key default gen_random_uuid(),
  active boolean not null default false,
  show_name text not null,
  venue_name text,
  location_detail text,
  day text,
  frequency text not null default 'weekly',
  frequency_custom_text text,
  start_time text,
  booker text,
  borough text,
  instagram_url text,
  show_type text,
  import_batch text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nyc_comedy_shows_import_day_idx
  on public.nyc_comedy_shows_import (day, start_time);

create index if not exists nyc_comedy_shows_import_frequency_idx
  on public.nyc_comedy_shows_import (frequency);

create index if not exists nyc_comedy_shows_import_venue_idx
  on public.nyc_comedy_shows_import (venue_name);

create index if not exists nyc_comedy_shows_import_active_idx
  on public.nyc_comedy_shows_import (active);
