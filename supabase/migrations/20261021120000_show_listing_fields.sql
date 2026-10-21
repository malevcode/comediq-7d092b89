-- Fields the new show listing form collects.
--
-- laughpass_free_ticket / laughpass_ticket_limit: the host offers LaughPass
--   subscribers a free ticket (and how many per show) to help fill the room.
--   Redemption is not built yet, so nothing public reads these today.
-- confirm_active_agreed: the host promised to confirm the show is still on
--   one day before each show, so the listing can stay on Comediq.
-- last_confirmed_active_at: when they last did. Filled by the reminder job
--   once it exists.

alter table public.audience_shows
  add column if not exists laughpass_free_ticket boolean not null default false,
  add column if not exists laughpass_ticket_limit integer,
  add column if not exists confirm_active_agreed boolean not null default false,
  add column if not exists last_confirmed_active_at timestamptz;
