-- The scraper ingest upserts audience_shows with on_conflict=source,source_event_id.
-- PostgREST requires a matching unique/exclusion constraint for that conflict
-- target, so keep one canonical row per scraped source event before adding it.

with ranked as (
  select
    id,
    row_number() over (
      partition by source, source_event_id
      order by updated_at desc, created_at desc, id desc
    ) as row_number
  from public.audience_shows
  where source is not null
    and source_event_id is not null
)
delete from public.audience_shows audience_show
using ranked
where audience_show.id = ranked.id
  and ranked.row_number > 1;

alter table public.audience_shows
  add constraint audience_shows_source_source_event_id_key
  unique (source, source_event_id);
