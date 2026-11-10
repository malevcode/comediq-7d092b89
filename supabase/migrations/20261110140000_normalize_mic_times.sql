-- Keep every mic's times in one format: "7:00 PM" and "9:00 PM".
--
-- Why: a mic typed as "7PM" or "7-9" was saved as typed, so it sorted wrong (a bare
-- "7" can be read as 7 AM). Now the database cleans times itself on every insert and
-- update, whichever screen, script or sheet the mic came from.
--
-- Rules (same as src/utils/micTime.ts):
--   * "7", "7pm", "7:30p", "730", "19:30" all become "7:00 PM", "7:30 PM", ...
--   * Hours 1 to 12 with no AM or PM are PM. Comedy happens at night.
--   * "7-9" typed in the start box becomes start 7:00 PM and end 9:00 PM.
--   * An end time with no AM or PM at or before the start is after midnight
--     ("11" to "1" is 11:00 PM to 1:00 AM).
--   * Anything unreadable is left alone.

create or replace function public.normalize_mic_time(t text)
returns text
language plpgsql
immutable
as $$
declare
  m text[];
  h int;
  mi int;
  pm boolean;
begin
  if t is null then
    return null;
  end if;
  m := regexp_match(btrim(t), '^(\d{1,2})(?::?(\d{2}))?\s*([apAP])?\.?[mM]?\.?$');
  if m is null then
    return t;
  end if;
  h := m[1]::int;
  mi := coalesce(m[2], '0')::int;
  if mi > 59 or h > 23 then
    return t;
  end if;
  pm := case when m[3] is null then h <> 0 else lower(m[3]) = 'p' end;
  if h > 12 then
    h := h - 12;
  end if;
  if h = 0 then
    h := 12;
  end if;
  return h::text || ':' || lpad(mi::text, 2, '0') || ' ' || case when pm then 'PM' else 'AM' end;
end;
$$;

create or replace function public.mic_time_minutes(t text)
returns int
language sql
immutable
as $$
  select (((regexp_match(t, '^(\d{1,2}):(\d{2}) (AM|PM)$'))[1]::int % 12) * 60
          + ((regexp_match(t, '^(\d{1,2}):(\d{2}) (AM|PM)$'))[2]::int)
          + case when (regexp_match(t, '^(\d{1,2}):(\d{2}) (AM|PM)$'))[3] = 'PM' then 720 else 0 end);
$$;

create or replace function public.mic_minutes_label(total int)
returns text
language sql
immutable
as $$
  select (case when (total / 60) % 12 = 0 then 12 else (total / 60) % 12 end)::text
         || ':' || lpad((total % 60)::text, 2, '0')
         || ' ' || case when (total / 60) % 24 >= 12 then 'PM' else 'AM' end;
$$;

create or replace function public.normalize_open_mic_times()
returns trigger
language plpgsql
as $$
declare
  range_parts text[];
  start_text text := btrim(coalesce(new.start_time, ''));
  end_text text := btrim(coalesce(new.latest_end_time, ''));
  canon constant text := '^(1[0-2]|[1-9]):[0-5][0-9] (AM|PM)$';
  s text;
  e text;
begin
  -- "7-9" typed into the start box
  range_parts := regexp_match(start_text, '^(.+?)\s*[-–—]\s*(.+)$');
  if range_parts is not null
     and public.normalize_mic_time(range_parts[1]) ~ canon
     and public.normalize_mic_time(range_parts[2]) ~ canon then
    start_text := range_parts[1];
    if end_text = '' then
      end_text := range_parts[2];
    end if;
  end if;

  s := public.normalize_mic_time(start_text);
  e := public.normalize_mic_time(end_text);

  -- an end time with no AM or PM that is not after the start is after midnight
  if s ~ canon and e ~ canon and end_text !~* '[ap]\.?m?\.?\s*$'
     and public.mic_time_minutes(e) <= public.mic_time_minutes(s) then
    e := public.mic_minutes_label((public.mic_time_minutes(e) + 720) % 1440);
  end if;

  new.start_time := case when new.start_time is null then null else s end;
  new.latest_end_time := case when new.latest_end_time is null and end_text = '' then null else e end;
  return new;
end;
$$;

drop trigger if exists normalize_open_mic_times on public.open_mics_historical;
create trigger normalize_open_mic_times
  before insert or update of start_time, latest_end_time on public.open_mics_historical
  for each row execute function public.normalize_open_mic_times();

-- Fix the mics already saved in the old formats (for example "7PM", "9PM", "12:30", "10:00pm").
-- Touching the columns fires the trigger above, which rewrites them.
update public.open_mics_historical
set start_time = start_time, latest_end_time = latest_end_time
where start_time !~ '^(1[0-2]|[1-9]):[0-5][0-9] (AM|PM)$'
   or (latest_end_time is not null and latest_end_time !~ '^(1[0-2]|[1-9]):[0-5][0-9] (AM|PM)$');
