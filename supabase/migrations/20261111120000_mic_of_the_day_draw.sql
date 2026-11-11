-- Mic of the Day (daily draw), the "By Comediq" flag, and Gdrink at Gnihton as a Comediq-run mic.
-- Safe to run more than once.
--
-- How the draw works, in short:
--   * Hosts enter one of their mics for a future date (motd_enter).
--   * Every hour pg_cron calls motd_tick(). On the first tick after midnight in New York it
--     draws one entry at random for that day. Mondays and Thursdays have standing picks and
--     skip the draw. If nobody entered, the day stays empty.
--   * Before mic_of_the_day_config.paid_from the win is free and pinned at once. From that
--     date the winner has until pay_by_hour (10 AM New York) to pay; unpaid means forfeited
--     and the tick redraws from the entries that are left.
--   * The site reads everything with ONE small call: motd_week().

-- ===== 1. "By Comediq" flag =====

alter table public.open_mics_historical
  add column if not exists is_comediq_run boolean not null default false;

comment on column public.open_mics_historical.is_comediq_run is
  'True for mics Comediq runs itself. Shows the "By Comediq" sticker.';

-- ===== 2. Gdrink at Gnihton: Comediq-run, sign-up on, admins as host =====
-- The row already exists (added from the poster). End time, set length and slot count are
-- left exactly as they are; nothing is guessed here.

update public.open_mics_historical
set is_comediq_run = true,
    signup_enabled = true,
    hosts_organizers = 'Comediq',
    status = 'verified',
    last_verified_at = now()
where unique_identifier = '21c4c8b9-8cc2-42d6-8a60-2534c75dfdaf';

insert into public.mic_hosts (user_id, mic_id, is_verified)
select p.user_id, m.unique_identifier, true
from public.profiles p
cross join public.open_mics_historical m
where p.isadmin = true
  and m.unique_identifier = '21c4c8b9-8cc2-42d6-8a60-2534c75dfdaf'
on conflict (user_id, mic_id) do update set is_verified = true;

-- ===== 3. Tables =====

-- One row of settings. Change a value here and the site follows; no code edit.
create table if not exists public.mic_of_the_day_config (
  id boolean primary key default true check (id),
  paid_from date not null default '2026-12-01',     -- first date a win costs money
  price_cents integer not null default 2500,
  pay_by_hour integer not null default 10,          -- New York hour the winner must pay by
  redraw_pay_hours integer not null default 2,      -- time a redrawn winner gets to pay
  days_ahead integer not null default 6,            -- how far ahead hosts can enter
  notify_url text                                   -- edge function that emails the winner
);
insert into public.mic_of_the_day_config (id, notify_url)
values (true, 'https://wwqoztrqprqksdubjwgj.supabase.co/functions/v1/motd-notify')
on conflict (id) do nothing;

-- Standing weekly picks. 0 = Sunday ... 6 = Saturday. These days skip the draw.
create table if not exists public.mic_of_the_day_standing (
  day_of_week smallint primary key check (day_of_week between 0 and 6),
  mic_id uuid not null references public.open_mics_historical(unique_identifier) on delete cascade
);
insert into public.mic_of_the_day_standing (day_of_week, mic_id)
select v.dow, m.unique_identifier
from (values
  (1, '0e94c622-2b8b-4c7c-a4d0-3f1937d3c1fd'::uuid),  -- Monday: Crash Landing Comedy
  (4, '21c4c8b9-8cc2-42d6-8a60-2534c75dfdaf'::uuid)   -- Thursday: Gdrink at Gnihton
) as v(dow, mic)
join public.open_mics_historical m on m.unique_identifier = v.mic
on conflict (day_of_week) do nothing;

create table if not exists public.mic_of_the_day_entries (
  id uuid primary key default gen_random_uuid(),
  target_date date not null,
  -- null only on an admin "clear" row, which means "this day is deliberately blank"
  mic_id uuid references public.open_mics_historical(unique_identifier) on delete cascade,
  host_user_id uuid not null,
  created_at timestamptz not null default now(),
  status text not null default 'entered'
    check (status in ('entered', 'won', 'lost', 'paid', 'forfeited')),
  source text not null default 'draw' check (source in ('draw', 'admin')),
  drawn_at timestamptz,
  pay_by timestamptz,            -- null on a free win
  paid_at timestamptz,
  price_paid_cents integer,
  stripe_session_id text,
  notified_at timestamptz,
  unique (target_date, host_user_id)                 -- one entry per host per date
);
-- One winner per date.
create unique index if not exists mic_of_the_day_one_winner
  on public.mic_of_the_day_entries (target_date) where status in ('won', 'paid');

create table if not exists public.mic_of_the_day_draw_log (
  id bigint generated always as identity primary key,
  target_date date not null,
  happened_at timestamptz not null default now(),
  event text not null,
  entry_count integer,
  winner_entry_id uuid,
  detail text
);
create index if not exists mic_of_the_day_draw_log_date on public.mic_of_the_day_draw_log (target_date);

create or replace function public.motd_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
     and (public.has_role(auth.uid(), 'admin') or public.is_current_user_admin());
$$;

-- Nobody reads these tables directly except admins. Everyone else goes through motd_week().
do $$
declare t text;
begin
  foreach t in array array['mic_of_the_day_config', 'mic_of_the_day_standing',
                           'mic_of_the_day_entries', 'mic_of_the_day_draw_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists "Admins manage %s" on public.%I', t, t);
    execute format(
      'create policy "Admins manage %s" on public.%I for all to authenticated
         using (public.motd_is_admin()) with check (public.motd_is_admin())', t, t);
  end loop;
end $$;

-- ===== 4. Reading =====

create or replace function public.motd_today()
returns date language sql stable as $$
  select (now() at time zone 'America/New_York')::date;
$$;

-- What a single date resolves to.
--   state: 'pinned' | 'awaiting_payment' | 'cleared' | 'open'
create or replace function public.motd_resolve(p_date date)
returns table (mic_id uuid, source text, state text, entry_id uuid)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  w public.mic_of_the_day_entries;
  s uuid;
begin
  select * into w from public.mic_of_the_day_entries e
  where e.target_date = p_date and e.status in ('won', 'paid');

  if found then
    if w.status = 'won' and w.pay_by is not null then
      return query select w.mic_id, w.source, 'awaiting_payment'::text, w.id;
    elsif w.mic_id is null then
      return query select null::uuid, w.source, 'cleared'::text, w.id;
    else
      return query select w.mic_id, w.source, 'pinned'::text, w.id;
    end if;
    return;
  end if;

  select st.mic_id into s from public.mic_of_the_day_standing st
  where st.day_of_week = extract(dow from p_date)::int;
  if found then
    return query select s, 'standing'::text, 'pinned'::text, null::uuid;
    return;
  end if;

  return query select null::uuid, null::text, 'open'::text, null::uuid;
end;
$$;

-- The one call the site makes: today plus the next few days, the settings, and the
-- signed-in host's own entries.
create or replace function public.motd_week()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c public.mic_of_the_day_config;
  v_today date := public.motd_today();
  v_days jsonb;
  v_mine jsonb := '[]'::jsonb;
begin
  select * into c from public.mic_of_the_day_config limit 1;

  select jsonb_agg(jsonb_build_object(
           'date', d::date,
           'mic_id', r.mic_id,
           'source', r.source,
           'state', r.state,
           'entries', (select count(*) from public.mic_of_the_day_entries e
                       where e.target_date = d::date and e.status = 'entered')
         ) order by d)
  into v_days
  from generate_series(v_today, v_today + c.days_ahead, interval '1 day') d
  cross join lateral public.motd_resolve(d::date) r;

  if auth.uid() is not null then
    select coalesce(jsonb_agg(jsonb_build_object(
             'id', e.id, 'date', e.target_date, 'mic_id', e.mic_id,
             'status', e.status, 'pay_by', e.pay_by)), '[]'::jsonb)
    into v_mine
    from public.mic_of_the_day_entries e
    where e.host_user_id = auth.uid() and e.target_date >= v_today and e.source = 'draw';
  end if;

  return jsonb_build_object(
    'today', v_today,
    'config', jsonb_build_object('paid_from', c.paid_from, 'price_cents', c.price_cents,
                                 'pay_by_hour', c.pay_by_hour),
    'days', coalesce(v_days, '[]'::jsonb),
    'mine', v_mine
  );
end;
$$;

-- ===== 5. Entering (always free) =====

create or replace function public.motd_enter(p_mic_id uuid, p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_today date := public.motd_today();
  c public.mic_of_the_day_config;
  v_state text;
  v_day text;
  v_verified boolean;
  v_row public.mic_of_the_day_entries;
begin
  if v_user is null then
    raise exception 'Sign in to enter Mic of the Day.';
  end if;
  select * into c from public.mic_of_the_day_config limit 1;

  if p_date <= v_today or p_date > v_today + c.days_ahead then
    raise exception 'You can enter for tomorrow up to % days ahead.', c.days_ahead;
  end if;

  select h.is_verified into v_verified from public.mic_hosts h
  where h.user_id = v_user and h.mic_id = p_mic_id;
  if not found then
    raise exception 'Claim this mic as its host first.';
  end if;

  select m.day into v_day from public.open_mics_historical m
  where m.unique_identifier = p_mic_id and m.active = true;
  if not found then
    raise exception 'That mic is not on Comediq right now.';
  end if;
  if lower(trim(v_day)) <> lower(trim(to_char(p_date, 'Day'))) then
    raise exception 'That mic runs on %, not on %.', trim(v_day), trim(to_char(p_date, 'Day'));
  end if;

  select r.state into v_state from public.motd_resolve(p_date) r;
  if v_state <> 'open' then
    raise exception 'That day already has a Mic of the Day.';
  end if;

  insert into public.mic_of_the_day_entries (target_date, mic_id, host_user_id)
  values (p_date, p_mic_id, v_user)
  on conflict (target_date, host_user_id) do update
    set mic_id = excluded.mic_id
    where public.mic_of_the_day_entries.status = 'entered'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'You already have an entry for that day.';
  end if;

  return jsonb_build_object('id', v_row.id, 'date', v_row.target_date,
                            'mic_id', v_row.mic_id, 'host_verified', v_verified);
end;
$$;

-- ===== 6. The draw =====

-- Draws one winner for a date, if the date still needs one. Returns the winning entry id.
create or replace function public.motd_draw(p_date date)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  c public.mic_of_the_day_config;
  v_count integer;
  v_winner uuid;
  v_pay_by timestamptz;
begin
  -- Two ticks at once must not both draw.
  perform pg_advisory_xact_lock(8675309, (p_date - date '2000-01-01'));
  select * into c from public.mic_of_the_day_config limit 1;

  if exists (select 1 from public.mic_of_the_day_entries
             where target_date = p_date and status in ('won', 'paid')) then
    return null;
  end if;

  if exists (select 1 from public.mic_of_the_day_standing
             where day_of_week = extract(dow from p_date)::int) then
    insert into public.mic_of_the_day_draw_log (target_date, event, detail)
    values (p_date, 'standing', 'Standing weekly pick, no draw.');
    return null;
  end if;

  -- Only entries whose host claim has been verified are in the hat.
  select count(*) into v_count
  from public.mic_of_the_day_entries e
  join public.mic_hosts h on h.user_id = e.host_user_id and h.mic_id = e.mic_id and h.is_verified
  where e.target_date = p_date and e.status = 'entered';

  if v_count = 0 then
    update public.mic_of_the_day_entries set status = 'lost'
    where target_date = p_date and status = 'entered';
    insert into public.mic_of_the_day_draw_log (target_date, event, entry_count, detail)
    values (p_date, 'empty', 0, 'No eligible entries. Day left empty.');
    return null;
  end if;

  -- gen_random_uuid() comes from the database's cryptographic random source, so every
  -- eligible entry has the same chance.
  select e.id into v_winner
  from public.mic_of_the_day_entries e
  join public.mic_hosts h on h.user_id = e.host_user_id and h.mic_id = e.mic_id and h.is_verified
  where e.target_date = p_date and e.status = 'entered'
  order by gen_random_uuid()
  limit 1;

  if p_date < c.paid_from then
    -- Free: pinned right away, everyone else is done.
    update public.mic_of_the_day_entries
    set status = 'won', drawn_at = now(), pay_by = null, price_paid_cents = 0
    where id = v_winner;
    update public.mic_of_the_day_entries set status = 'lost'
    where target_date = p_date and status = 'entered';
  else
    -- Paid: winner has until 10 AM New York. A redraw after that gets a short window.
    v_pay_by := (p_date::timestamp + make_interval(hours => c.pay_by_hour))
                  at time zone 'America/New_York';
    if v_pay_by <= now() then
      v_pay_by := now() + make_interval(hours => c.redraw_pay_hours);
    end if;
    update public.mic_of_the_day_entries
    set status = 'won', drawn_at = now(), pay_by = v_pay_by
    where id = v_winner;

    -- Ask the edge function to email the winner. Never let this stop the draw.
    if c.notify_url is not null then
      begin
        perform net.http_post(url := c.notify_url,
                              headers := '{"Content-Type": "application/json"}'::jsonb,
                              body := '{}'::jsonb);
      exception when others then
        insert into public.mic_of_the_day_draw_log (target_date, event, detail)
        values (p_date, 'notify_failed', sqlerrm);
      end;
    end if;
  end if;

  insert into public.mic_of_the_day_draw_log (target_date, event, entry_count, winner_entry_id, detail)
  values (p_date, 'drawn', v_count, v_winner,
          case when p_date < c.paid_from then 'Free win, pinned.'
               else 'Winner must pay by ' || to_char(v_pay_by at time zone 'America/New_York', 'HH12:MI AM') || ' ET.' end);
  return v_winner;
end;
$$;

-- Runs every hour. Does the midnight draw once per day, forfeits unpaid winners and redraws.
create or replace function public.motd_tick()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := public.motd_today();
  r record;
  v_forfeited integer := 0;
  v_drawn uuid;
begin
  -- The cron job and the service role may call this; a signed-in user must be an admin.
  if auth.uid() is not null and not public.motd_is_admin() then
    raise exception 'Admins only.';
  end if;

  for r in
    select id, target_date from public.mic_of_the_day_entries
    where status = 'won' and pay_by is not null and pay_by < now()
  loop
    update public.mic_of_the_day_entries set status = 'forfeited' where id = r.id;
    insert into public.mic_of_the_day_draw_log (target_date, event, winner_entry_id, detail)
    values (r.target_date, 'forfeited', r.id, 'Not paid in time.');
    v_forfeited := v_forfeited + 1;
    if r.target_date = v_today then
      perform public.motd_draw(r.target_date);
    end if;
  end loop;

  if not exists (select 1 from public.mic_of_the_day_draw_log
                 where target_date = v_today and event in ('drawn', 'empty', 'standing')) then
    v_drawn := public.motd_draw(v_today);
  end if;

  update public.mic_of_the_day_entries set status = 'lost'
  where status = 'entered' and target_date < v_today;

  return jsonb_build_object('date', v_today, 'drawn', v_drawn, 'forfeited', v_forfeited);
end;
$$;

-- Called by the Stripe webhook once the $25 Checkout payment has succeeded.
create or replace function public.motd_mark_paid(p_entry_id uuid, p_session_id text, p_amount_cents integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.mic_of_the_day_entries;
  v_result text;
begin
  select * into e from public.mic_of_the_day_entries where id = p_entry_id for update;
  if not found then
    return 'not_found';
  end if;

  if e.status = 'paid' then
    return 'already_paid';
  elsif e.status = 'won'
     or (e.status = 'forfeited' and e.target_date >= public.motd_today()
         and not exists (select 1 from public.mic_of_the_day_entries x
                         where x.target_date = e.target_date and x.status in ('won', 'paid'))) then
    update public.mic_of_the_day_entries
    set status = 'paid', paid_at = now(), price_paid_cents = p_amount_cents,
        stripe_session_id = p_session_id
    where id = e.id;
    update public.mic_of_the_day_entries set status = 'lost'
    where target_date = e.target_date and status = 'entered';
    v_result := case when e.status = 'won' then 'paid' else 'paid_late_reinstated' end;
  else
    -- Paid after the spot went to someone else. Needs a refund by hand.
    update public.mic_of_the_day_entries
    set stripe_session_id = p_session_id where id = e.id;
    v_result := 'paid_late_refund_needed';
  end if;

  insert into public.mic_of_the_day_draw_log (target_date, event, winner_entry_id, detail)
  values (e.target_date, v_result, e.id, 'Stripe session ' || coalesce(p_session_id, '?'));
  return v_result;
end;
$$;

-- ===== 7. Admin: override, comp, clear, reset =====
--   set    pin p_mic_id on the date (free), replacing whoever was there
--   clear  leave the date deliberately blank (also blanks a standing day)
--   comp   the drawn winner is pinned without paying
--   reset  undo an admin set/clear, back to the standing pick or the draw
create or replace function public.motd_admin_set_day(p_date date, p_action text, p_mic_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if not public.motd_is_admin() then
    raise exception 'Admins only.';
  end if;

  if p_action in ('set', 'clear') then
    if p_action = 'set' and p_mic_id is null then
      raise exception 'Pick a mic.';
    end if;
    update public.mic_of_the_day_entries set status = 'lost'
    where target_date = p_date and status in ('won', 'paid');
    insert into public.mic_of_the_day_entries
      (target_date, mic_id, host_user_id, status, source, drawn_at, price_paid_cents)
    values (p_date, case when p_action = 'set' then p_mic_id end, v_user, 'paid', 'admin', now(), 0)
    on conflict (target_date, host_user_id) do update
      set mic_id = excluded.mic_id, status = 'paid', source = 'admin',
          drawn_at = now(), pay_by = null, price_paid_cents = 0;
  elsif p_action = 'comp' then
    update public.mic_of_the_day_entries
    set status = 'paid', paid_at = now(), price_paid_cents = 0
    where target_date = p_date and status = 'won';
    if not found then
      raise exception 'No winner is waiting to pay on that date.';
    end if;
    update public.mic_of_the_day_entries set status = 'lost'
    where target_date = p_date and status = 'entered';
  elsif p_action = 'reset' then
    update public.mic_of_the_day_entries set status = 'lost'
    where target_date = p_date and source = 'admin' and status in ('won', 'paid');
  else
    raise exception 'Unknown action %', p_action;
  end if;

  insert into public.mic_of_the_day_draw_log (target_date, event, detail)
  values (p_date, 'admin_' || p_action, coalesce(p_mic_id::text, ''));
  return public.motd_week();
end;
$$;

-- ===== 8. Who may call what =====

revoke all on function public.motd_resolve(date) from public;
revoke all on function public.motd_week() from public;
revoke all on function public.motd_enter(uuid, date) from public;
revoke all on function public.motd_draw(date) from public;
revoke all on function public.motd_tick() from public;
revoke all on function public.motd_mark_paid(uuid, text, integer) from public;
revoke all on function public.motd_admin_set_day(date, text, uuid) from public;

grant execute on function public.motd_week() to anon, authenticated;
grant execute on function public.motd_enter(uuid, date) to authenticated;
grant execute on function public.motd_tick() to authenticated, service_role;
grant execute on function public.motd_admin_set_day(date, text, uuid) to authenticated;
grant execute on function public.motd_mark_paid(uuid, text, integer) to service_role;

-- ===== 9. The schedule =====
-- Hourly, so it lands on 12:00 AM New York in both summer and winter time (cron runs in UTC).

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid) from cron.job where jobname = 'mic-of-the-day-tick';
select cron.schedule('mic-of-the-day-tick', '0 * * * *', $$select public.motd_tick();$$);
