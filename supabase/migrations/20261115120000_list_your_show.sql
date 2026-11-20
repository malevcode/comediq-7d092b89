-- /list-your-show: shows imported from a ticket link.
--
-- source_platform: eventbrite | posh | luma | partiful.
-- source_url: the producer's original ticket page. Unique, so the same link cannot be posted twice.
--   (Not the same as the existing "source" column, which must stay null for self-submitted shows.)
alter table public.audience_shows
  add column if not exists source_platform text,
  add column if not exists source_url text;

create unique index if not exists audience_shows_source_url_key
  on public.audience_shows (source_url)
  where source_url is not null;

-- Rate limit log for the parse-show-link edge function (about 10 parses per user or IP per hour).
-- Only the service role touches it: RLS on, no policies.
create table if not exists public.show_parse_requests (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index if not exists show_parse_requests_key_created_idx
  on public.show_parse_requests (key, created_at);
alter table public.show_parse_requests enable row level security;
