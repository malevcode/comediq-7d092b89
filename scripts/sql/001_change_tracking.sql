-- Change tracking for open mics and audience shows.
--
-- Paste this whole file into the Supabase SQL editor and run it once. It is
-- idempotent, so running it again is harmless, including after this file has
-- been edited: the views are dropped and rebuilt rather than replaced in place,
-- because "create or replace view" refuses to add or reorder a column.
--
-- Why it lives at the database level rather than in the app: edits arrive from
-- four different places (the SQL editor, the admin tab, the apply-open-mic-
-- updates script, and host forms). Logging in any one of them would miss the
-- other three. A trigger sees all of them.
--
-- Nothing here changes mic or show data. It only records what happened.

-- ---------------------------------------------------------------------------
-- 1. The log
-- ---------------------------------------------------------------------------

create table if not exists public.data_change_log (
  id             bigint generated always as identity primary key,
  changed_at     timestamptz not null default now(),
  table_name     text        not null,
  row_id         text        not null,
  label          text,                  -- the mic or show name, so the log reads
  op             text        not null,  -- INSERT | UPDATE | DELETE
  actor_role     text,                  -- postgres = SQL editor, service_role =
                                        -- a script, authenticated = the app
  actor_uid      uuid,                  -- set when a signed-in user made it
  changed_fields jsonb,                 -- {"field": {"old": ..., "new": ...}}
  row_snapshot   jsonb                  -- full row, so a delete is recoverable
);

create index if not exists data_change_log_changed_at_idx
  on public.data_change_log (changed_at desc);
create index if not exists data_change_log_row_idx
  on public.data_change_log (table_name, row_id, changed_at desc);

-- Private ops data. No policies are created, so anon and authenticated cannot
-- read it. service_role and the SQL editor bypass RLS and still can.
alter table public.data_change_log enable row level security;

-- ---------------------------------------------------------------------------
-- 2. The trigger
-- ---------------------------------------------------------------------------

-- TG_ARGV[0] = the primary key column, TG_ARGV[1] = the column to use as a
-- human-readable label.
create or replace function public.log_data_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old     jsonb;
  v_new     jsonb;
  v_changed jsonb;
  v_uid     uuid;
  v_role    text;
begin
  if tg_op = 'INSERT' then
    v_old := null;
    v_new := to_jsonb(new);
  elsif tg_op = 'DELETE' then
    v_old := to_jsonb(old);
    v_new := null;
  else
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
  end if;

  -- Only log updates that actually changed something. Re-running a batch that
  -- is already applied should stay silent rather than fill the log with noise.
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(k, jsonb_build_object('old', v_old -> k, 'new', v_new -> k))
      into v_changed
      from jsonb_object_keys(v_new) as k
     where v_new -> k is distinct from v_old -> k;

    if v_changed is null then
      return null;
    end if;
  end if;

  -- auth.uid() does not exist outside Supabase, and is null in the SQL editor.
  begin
    v_uid := auth.uid();
  exception when others then
    v_uid := null;
  end;

  -- NOT current_user. This function is security definer, so current_user is the
  -- function's owner (postgres) no matter who made the change, which would have
  -- labelled every single row "SQL editor". PostgREST switches roles with
  -- SET LOCAL ROLE, which sets the role GUC, and that survives the definer
  -- switch. The GUC reads 'none' when nobody switched, which is the SQL editor.
  v_role := coalesce(nullif(current_setting('role', true), 'none'), session_user);

  insert into public.data_change_log (
    table_name, row_id, label, op, actor_role, actor_uid, changed_fields, row_snapshot
  ) values (
    tg_table_name,
    coalesce(v_new, v_old) ->> tg_argv[0],
    coalesce(v_new, v_old) ->> tg_argv[1],
    tg_op,
    v_role,
    v_uid,
    v_changed,
    coalesce(v_old, v_new)
  );

  return null;
end;
$$;

drop trigger if exists log_changes on public.open_mics_historical;
create trigger log_changes
after insert or update or delete on public.open_mics_historical
for each row execute function public.log_data_change('unique_identifier', 'open_mic');

drop trigger if exists log_changes on public.audience_shows;
create trigger log_changes
after insert or update or delete on public.audience_shows
for each row execute function public.log_data_change('id', 'title');

-- ---------------------------------------------------------------------------
-- 3. Export heartbeat, so "did my change go live" is answerable
-- ---------------------------------------------------------------------------

create table if not exists public.data_exports (
  id          bigint generated always as identity primary key,
  exported_at timestamptz not null default now(),
  source      text        not null default 'export-mics',
  row_count   integer
);

create index if not exists data_exports_exported_at_idx
  on public.data_exports (exported_at desc);

alter table public.data_exports enable row level security;

-- Supabase's default privileges grant anon and authenticated SELECT on new
-- tables in the public schema. RLS with no policies already returns them zero
-- rows; this removes the grant too, so a future policy cannot open it by
-- accident. Guarded because those roles only exist on Supabase.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on public.data_change_log from anon;
    revoke all on public.data_exports    from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on public.data_change_log from authenticated;
    revoke all on public.data_exports    from authenticated;
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- 4. The three views to actually look at
-- ---------------------------------------------------------------------------

-- "What did I change, and when?"
drop view if exists public.v_recent_changes;
create view public.v_recent_changes with (security_invoker = true) as
select
  l.changed_at,
  l.table_name,
  l.label,
  l.op,
  case l.actor_role
    when 'postgres'     then 'SQL editor'
    when 'service_role' then 'script'
    when 'authenticated' then 'app'
    else l.actor_role
  end as made_from,
  (
    select string_agg(
             k || ': ' ||
             coalesce(l.changed_fields -> k ->> 'old', '(empty)') || ' -> ' ||
             coalesce(l.changed_fields -> k ->> 'new', '(empty)'),
             ' | ' order by k)
      from jsonb_object_keys(l.changed_fields) as k
  ) as what_changed,
  l.row_id
from public.data_change_log l
-- id breaks the tie: every row in one batch shares a changed_at, so without it
-- a batch displays in arbitrary order.
order by l.changed_at desc, l.id desc;

-- "Is my change live on the site yet?"
--
-- Open mics are served from the exported mics.json, so a mic edit is only live
-- once an export has run since it. Audience shows are read straight from the
-- database by the Laugh tab, so a show edit is live immediately.
drop view if exists public.v_data_freshness;
create view public.v_data_freshness with (security_invoker = true) as
with mic as (
  select max(changed_at) as last_change
    from public.data_change_log
   where table_name = 'open_mics_historical'
), show as (
  select max(changed_at) as last_change
    from public.data_change_log
   where table_name = 'audience_shows'
), exp as (
  select max(exported_at) as last_export from public.data_exports
)
select
  mic.last_change                                   as last_mic_change,
  exp.last_export                                   as last_mic_export,
  case
    when mic.last_change is null then 'no mic changes logged yet'
    when exp.last_export is null then 'no export logged yet, run Refresh mics.json'
    when exp.last_export >= mic.last_change then 'live'
    else 'waiting for export'
  end                                               as mic_status,
  show.last_change                                  as last_show_change,
  case
    when show.last_change is null then 'no show changes logged yet'
    else 'live (shows are read straight from the database)'
  end                                               as show_status
from mic, show, exp;

-- "Which mics are going stale?"
--
-- last_verified is free text in mixed formats ('08/10/26', '07/23',
-- 'Unverified', ''), so it is shown raw rather than parsed into a date. The
-- trustworthy signals are last_confirmed_at and, from now on, the change log.
drop view if exists public.v_mic_staleness;
create view public.v_mic_staleness with (security_invoker = true) as
select
  m.open_mic,
  m.day,
  m.venue_name,
  m.status,
  m.last_confirmed_at,
  m.verification_count,
  m.last_verified                          as last_verified_raw,
  l.last_change                            as last_logged_change,
  -- export-mics.mjs filters on active=true and status<>'pending', so a pending
  -- mic is in the database but not on the site. Without this you can edit one
  -- for an hour and never see it appear.
  (m.status is distinct from 'pending')    as on_the_site,
  case
    when m.last_confirmed_at is not null
      then (now()::date - m.last_confirmed_at::date)
  end                                      as days_since_confirmed,
  m.unique_identifier
from public.open_mics_historical m
left join (
  select row_id, max(changed_at) as last_change
    from public.data_change_log
   where table_name = 'open_mics_historical'
   group by row_id
) l on l.row_id = m.unique_identifier
where m.active is true
order by m.last_confirmed_at asc nulls first;
