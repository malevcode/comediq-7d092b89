-- ShowTN menu view. Run this AFTER RUN_ME_pending.sql (it needs the laughpass_free_ticket column from it).
-- Safe to run more than once.

-- ===== showtn_next_shows view (ShowTN) =====
-- ShowTN's Browse page reads this view. It is a safe, read-only window onto the
-- Comediq Laugh-tab listings (public.audience_shows) in the same Supabase project.
-- Only shows that are live on comediq.us appear here: verified, active, a real dated
-- show (not a repeating template), from Comediq itself or an approved partner venue.

create or replace view public.showtn_next_shows as
select
  s.id,
  s.title,
  s.venue_name                                   as venue,
  s.borough                                      as neighborhood,
  'New York'::text                               as city,
  ((s.show_date::text || ' ' || coalesce(s.show_time::text, '20:00'))::timestamp
     at time zone 'America/New_York')            as show_date,
  s.description,
  case when coalesce(s.showtn_eligible, false) or coalesce(s.laughpass_free_ticket, false)
       then 'pro' else 'free' end                as tier,
  s.image_url,
  coalesce(s.ticket_url, s.external_ticket_url)  as ticket_url,
  s.ticket_price,
  coalesce(s.laughpass_free_ticket, false)       as laughpass_free_ticket,
  coalesce(s.is_featured, false)                 as is_featured
from public.audience_shows s
where s.verified is true
  and s.status = 'active'
  and s.is_active is true
  and coalesce(s.is_recurring, false) = false
  and s.show_date::date >= (now() at time zone 'America/New_York')::date
  and (
    s.source is null
    or exists (
      select 1 from public.venue_sources v
      where v.source_key = s.source
        and v.permission_status = 'approved'
        and v.is_active is true
    )
  );

grant select on public.showtn_next_shows to anon, authenticated;
