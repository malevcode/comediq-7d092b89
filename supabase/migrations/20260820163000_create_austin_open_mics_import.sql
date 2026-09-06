create table if not exists public.austin_open_mics_import (
  unique_identifier text primary key,
  source_unique_identifier text not null,
  open_mic text not null,
  venue_name text,
  location text,
  neighborhood text,
  city text default 'Austin',
  day text,
  day_of_week smallint check (day_of_week between 0 and 6),
  frequency text not null default 'weekly',
  frequency_custom_text text,
  schedule_occurrence text,
  start_time text,
  start_time_24h time,
  latest_end_time text,
  cost text,
  stage_time text,
  signup_method text,
  signup_url text,
  signup_enabled boolean not null default false,
  sign_up_instructions text,
  hosts_organizers text,
  instagram_handle text,
  status text,
  active boolean not null default true,
  other_rules text,
  changes_updates text,
  source_file text not null,
  source_row_number integer not null,
  import_batch text not null,
  city_slug text,
  venue_slug text,
  mic_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists austin_open_mics_import_day_idx
  on public.austin_open_mics_import (day_of_week, start_time_24h);

create index if not exists austin_open_mics_import_frequency_idx
  on public.austin_open_mics_import (frequency);

create index if not exists austin_open_mics_import_venue_idx
  on public.austin_open_mics_import (venue_slug);
