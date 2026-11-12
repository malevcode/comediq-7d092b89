-- Mic of the Day becomes an auction. Run AFTER 20261111120000_mic_of_the_day_draw.sql.
-- Safe to run more than once.
--
-- The rules, in short:
--   * Dates before mic_of_the_day_config.paid_from (Dec 1, 2026): the first verified host to
--     claim an open date gets it free and cannot be outbid. Standing days are not claimable.
--   * From paid_from: the first claim costs start_price_cents ($15). Any other host can take
--     the spot by paying increment_cents ($5) more than the current holder paid: $20, $25...
--     A standing pick (Monday, Thursday) holds its day at $0 and can be taken for $15.
--   * Money is taken first (Stripe Checkout). The spot changes hands only when the payment
--     has succeeded.
--   * A host who is outbid after being pinned for less than refund_under_minutes (60) gets
--     the whole payment back automatically. Pinned time only counts on the day itself, so
--     being outbid before the day starts is always a full refund.
--   * A mic can only be claimed for a date it really runs on: weekly on its weekday, monthly
--     on its nth weekday, bi-weekly only with an anchor date, pop-ups only on listed dates.
--   * Every claim, takeover and refund is a row in mic_of_the_day_entries. Nothing is deleted.

-- ===== 1. Switch the draw off (left in place, not dropped) =====

revoke all on function public.motd_enter(uuid, date) from public, anon, authenticated;
revoke all on function public.motd_tick() from public, anon, authenticated;
revoke all on function public.motd_draw(date) from public, anon, authenticated;

-- ===== 2. Settings and columns =====

alter table public.mic_of_the_day_config
  add column if not exists start_price_cents integer not null default 1500,
  add column if not exists increment_cents integer not null default 500,
  add column if not exists refund_under_minutes integer not null default 60,
  add column if not exists free_claims_per_host integer not null default 1;

alter table public.mic_of_the_day_entries
  add column if not exists live_from timestamptz,        -- when this bid took the spot
  add column if not exists outbid_at timestamptz,
  add column if not exists listed_seconds integer,        -- time pinned on the day itself
  add column if not exists stripe_payment_intent text,
  add column if not exists refund_cents integer,          -- set when a refund is owed
  add column if not exists refund_reason text,
  add column if not exists refunded_at timestamptz,       -- set when Stripe has sent it
  add column if not exists stripe_refund_id text;

-- A host can now bid on the same date more than once (outbid, then bid again).
alter table public.mic_of_the_day_entries
  drop constraint if exists mic_of_the_day_entries_target_date_host_user_id_key;

-- pending: checkout started. paid / won: holds the spot (won = free). outbid: was replaced.
-- void: paid too late, someone else got there first (always refunded).
alter table public.mic_of_the_day_entries drop constraint if exists mic_of_the_day_entries_status_check;
alter table public.mic_of_the_day_entries add constraint mic_of_the_day_entries_status_check
  check (status in ('entered', 'won', 'lost', 'paid', 'forfeited', 'pending', 'outbid', 'void'));

alter table public.mic_of_the_day_entries drop constraint if exists mic_of_the_day_entries_source_check;
alter table public.mic_of_the_day_entries add constraint mic_of_the_day_entries_source_check
  check (source in ('draw', 'admin', 'bid', 'free'));

create index if not exists mic_of_the_day_entries_date on public.mic_of_the_day_entries (target_date);

-- ===== 3. Does this mic really run on this date? =====
-- Same rules as micKnownToRunOn in src/utils/micOccurrences.ts. When the schedule does not
-- pin the date down (bi-weekly with no "anchor 2026-10-21", custom with no "dates ..."),
-- the answer is no, so nobody is pinned on a night their mic is dark.
create or replace function public.motd_runs_on(p_mic_id text, p_date date)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_day text;
  v_freq text;
  v_text text;
  v_anchor date;
  v_nth integer;
  v_month_start date := date_trunc('month', p_date)::date;
  v_first date;
  v_last date;
begin
  select m.day, coalesce(m.frequency::text, 'weekly'), m.frequency_custom_text
  into v_day, v_freq, v_text
  from public.open_mics_historical m
  where m.unique_identifier::text = p_mic_id and m.active = true;
  if not found then
    return false;
  end if;

  if lower(trim(coalesce(v_day, ''))) <> lower(trim(to_char(p_date, 'Day'))) then
    return false;
  end if;

  if v_freq = 'weekly' then
    return true;
  end if;

  if v_freq = 'bi_weekly' then
    v_anchor := (substring(v_text from '(?i)anchor[:\s]+(\d{4}-\d{2}-\d{2})'))::date;
    return v_anchor is not null and (p_date - v_anchor) % 14 = 0;
  end if;

  if v_freq in ('one_off', 'custom') then
    return exists (
      select 1
      from regexp_split_to_table(
             coalesce(substring(v_text from '(?i)dates[:\s]+(\d{4}-\d{2}-\d{2}(?:\s*,\s*\d{4}-\d{2}-\d{2})*)'), ''),
             '\s*,\s*') as d
      where d <> '' and d::date = p_date
    );
  end if;

  if v_freq = 'last_of_month' then
    v_last := (v_month_start + interval '1 month' - interval '1 day')::date;
    return p_date > v_last - 7;
  end if;

  v_nth := case v_freq when '1st_of_month' then 1 when '2nd_of_month' then 2
                       when '3rd_of_month' then 3 when '4th_of_month' then 4 end;
  if v_nth is null then
    return false;
  end if;
  -- First date in the month that falls on this weekday, then step to the nth.
  v_first := v_month_start + ((extract(dow from p_date)::int - extract(dow from v_month_start)::int + 7) % 7);
  return p_date = v_first + (v_nth - 1) * 7;
end;
$$;

-- ===== 4. What a date resolves to, and what it costs to take =====
-- state: 'pinned' | 'cleared' | 'open'
-- price_cents: what a host pays to take the date now. 0 = free claim. null = not available.
drop function if exists public.motd_resolve(date);
create function public.motd_resolve(p_date date)
returns table (mic_id text, source text, state text, entry_id uuid,
               holder_user_id uuid, holder_price_cents integer, price_cents integer)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c public.mic_of_the_day_config;
  w public.mic_of_the_day_entries;
  s text;
  v_paid_day boolean;
begin
  select * into c from public.mic_of_the_day_config limit 1;
  v_paid_day := p_date >= c.paid_from;

  select * into w from public.mic_of_the_day_entries e
  where e.target_date = p_date and e.status in ('won', 'paid');

  if found then
    return query select
      w.mic_id, w.source,
      case when w.mic_id is null then 'cleared' else 'pinned' end,
      w.id, w.host_user_id, coalesce(w.price_paid_cents, 0),
      -- An admin pick or a free claim cannot be bought out. A paid spot can.
      case when v_paid_day and w.source = 'bid'
           then coalesce(w.price_paid_cents, 0) + c.increment_cents end;
    return;
  end if;

  select st.mic_id into s from public.mic_of_the_day_standing st
  where st.day_of_week = extract(dow from p_date)::int;
  if found then
    return query select s, 'standing'::text, 'pinned'::text, null::uuid, null::uuid, 0,
      case when v_paid_day then c.start_price_cents end;
    return;
  end if;

  return query select null::text, null::text, 'open'::text, null::uuid, null::uuid, 0,
    case when v_paid_day then c.start_price_cents else 0 end;
end;
$$;

-- The one call the site makes.
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
  v_user uuid := auth.uid();
  v_days jsonb;
  v_mine jsonb := '[]'::jsonb;
begin
  select * into c from public.mic_of_the_day_config limit 1;

  select jsonb_agg(jsonb_build_object(
           'date', d::date,
           'mic_id', r.mic_id,
           'source', r.source,
           'state', r.state,
           'price_cents', r.price_cents,
           'holder_price_cents', r.holder_price_cents,
           'mine', coalesce(v_user is not null and r.holder_user_id = v_user, false)
         ) order by d)
  into v_days
  from generate_series(v_today, v_today + c.days_ahead, interval '1 day') d
  cross join lateral public.motd_resolve(d::date) r;

  if v_user is not null then
    -- The host's latest finished bid per date, so the site can say "you were outbid".
    select coalesce(jsonb_agg(jsonb_build_object(
             'id', x.id, 'date', x.target_date, 'mic_id', x.mic_id, 'status', x.status,
             'price_cents', x.price_paid_cents, 'refund_cents', x.refund_cents)), '[]'::jsonb)
    into v_mine
    from (
      select distinct on (e.target_date) e.*
      from public.mic_of_the_day_entries e
      where e.host_user_id = v_user and e.target_date >= v_today
        and e.source in ('bid', 'free') and e.status in ('won', 'paid', 'outbid', 'void')
      order by e.target_date, e.created_at desc
    ) x;
  end if;

  return jsonb_build_object(
    'today', v_today,
    'config', jsonb_build_object(
      'paid_from', c.paid_from, 'start_price_cents', c.start_price_cents,
      'increment_cents', c.increment_cents, 'refund_under_minutes', c.refund_under_minutes),
    'days', coalesce(v_days, '[]'::jsonb),
    'mine', v_mine
  );
end;
$$;

-- ===== 5. Shared checks for a claim =====
create or replace function public.motd_check_claim(p_user uuid, p_mic_id text, p_date date)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c public.mic_of_the_day_config;
  v_today date := public.motd_today();
begin
  select * into c from public.mic_of_the_day_config limit 1;

  if p_user is null then
    raise exception 'Sign in to claim Mic of the Day.';
  end if;
  if p_date < v_today or p_date > v_today + c.days_ahead then
    raise exception 'You can claim today or up to % days ahead.', c.days_ahead;
  end if;
  if not exists (select 1 from public.mic_hosts h where h.user_id = p_user and h.mic_id::text = p_mic_id) then
    raise exception 'Claim this mic as its host first.';
  end if;
  if not public.motd_runs_on(p_mic_id, p_date) then
    raise exception 'That mic is not listed as running on %.', to_char(p_date, 'FMDay, Mon FMDD');
  end if;
end;
$$;

-- ===== 6. Free claim (dates before paid_from) =====
create or replace function public.motd_claim_free(p_mic_id text, p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  c public.mic_of_the_day_config;
  r record;
  v_id uuid;
begin
  perform public.motd_check_claim(v_user, p_mic_id, p_date);
  perform pg_advisory_xact_lock(8675309, (p_date - date '2000-01-01'));
  select * into c from public.mic_of_the_day_config limit 1;

  -- Free pins go live at once, so only hosts Comediq has verified can take one.
  if not exists (select 1 from public.mic_hosts h
                 where h.user_id = v_user and h.mic_id::text = p_mic_id and h.is_verified) then
    raise exception 'Your host claim is waiting for Comediq to verify it. You can claim a free day as soon as it is.';
  end if;

  select * into r from public.motd_resolve(p_date);
  if r.price_cents is distinct from 0 then
    raise exception 'That day is not free to claim.';
  end if;

  if (select count(*) from public.mic_of_the_day_entries e
      where e.host_user_id = v_user and e.source = 'free' and e.status = 'won') >= c.free_claims_per_host then
    raise exception 'The free launch offer is % day per host, and you have used it.', c.free_claims_per_host;
  end if;

  insert into public.mic_of_the_day_entries
    (target_date, mic_id, host_user_id, status, source, price_paid_cents, live_from)
  values (p_date, p_mic_id, v_user, 'won', 'free', 0, now())
  returning id into v_id;

  insert into public.mic_of_the_day_draw_log (target_date, event, winner_entry_id, detail)
  values (p_date, 'free_claim', v_id, 'Free launch claim.');
  return jsonb_build_object('id', v_id, 'date', p_date, 'mic_id', p_mic_id);
end;
$$;

-- ===== 7. Paid claim: start (called by create-checkout-session) =====
-- Returns the amount to charge. Starting a checkout does not hold the date; whoever's
-- payment succeeds first at the current price gets it.
create or replace function public.motd_start_bid(p_user uuid, p_mic_id text, p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_id uuid;
begin
  perform public.motd_check_claim(p_user, p_mic_id, p_date);

  select * into r from public.motd_resolve(p_date);
  if r.price_cents is null or r.price_cents <= 0 then
    raise exception 'That day cannot be bought right now.';
  end if;
  if r.holder_user_id = p_user then
    raise exception 'You already hold that day.';
  end if;

  insert into public.mic_of_the_day_entries
    (target_date, mic_id, host_user_id, status, source, price_paid_cents)
  values (p_date, p_mic_id, p_user, 'pending', 'bid', r.price_cents)
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'amount_cents', r.price_cents, 'date', p_date);
end;
$$;

-- ===== 8. Paid claim: finish (called by stripe-webhook after the payment succeeds) =====
-- Returns {result, refunds: [{entry_id, payment_intent, amount_cents}]}. The webhook sends
-- each refund through Stripe and then calls motd_mark_refunded. Calling this again for the
-- same entry is safe and returns any refunds that are still owed for that date.
drop function if exists public.motd_mark_paid(uuid, text, integer);
create or replace function public.motd_mark_paid(
  p_entry_id uuid, p_session_id text, p_amount_cents integer, p_payment_intent text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.mic_of_the_day_config;
  e public.mic_of_the_day_entries;
  r record;
  v_day_start timestamptz;
  v_listed integer;
  v_result text;
begin
  select * into e from public.mic_of_the_day_entries where id = p_entry_id;
  if not found then
    return jsonb_build_object('result', 'not_found', 'refunds', '[]'::jsonb);
  end if;
  perform pg_advisory_xact_lock(8675309, (e.target_date - date '2000-01-01'));
  select * into e from public.mic_of_the_day_entries where id = p_entry_id for update;
  select * into c from public.mic_of_the_day_config limit 1;

  if e.status = 'pending' then
    select * into r from public.motd_resolve(e.target_date);

    if r.price_cents is not null and r.price_cents > 0 and p_amount_cents >= r.price_cents
       and e.target_date >= public.motd_today() then
      -- Whoever held the spot is outbid. Under an hour pinned on the day: full refund.
      if r.entry_id is not null then
        v_day_start := e.target_date::timestamp at time zone 'America/New_York';
        select greatest(0, floor(extract(epoch from now() - greatest(h.live_from, v_day_start))))::integer
        into v_listed
        from public.mic_of_the_day_entries h where h.id = r.entry_id;

        update public.mic_of_the_day_entries h
        set status = 'outbid', outbid_at = now(), listed_seconds = v_listed,
            refund_cents = case when v_listed < c.refund_under_minutes * 60
                                 and coalesce(h.price_paid_cents, 0) > 0 then h.price_paid_cents end,
            refund_reason = case when v_listed < c.refund_under_minutes * 60
                                  and coalesce(h.price_paid_cents, 0) > 0
                                 then 'Outbid after ' || (v_listed / 60) || ' min pinned' end
        where h.id = r.entry_id;
      end if;

      update public.mic_of_the_day_entries
      set status = 'paid', paid_at = now(), live_from = now(), price_paid_cents = p_amount_cents,
          stripe_session_id = p_session_id, stripe_payment_intent = p_payment_intent
      where id = e.id;
      v_result := 'paid';
    else
      -- Someone else's payment landed first, or the day is over. Money goes straight back.
      update public.mic_of_the_day_entries
      set status = 'void', paid_at = now(), price_paid_cents = p_amount_cents,
          stripe_session_id = p_session_id, stripe_payment_intent = p_payment_intent,
          refund_cents = p_amount_cents, refund_reason = 'Spot was taken before this payment arrived'
      where id = e.id;
      v_result := 'too_late';
    end if;

    insert into public.mic_of_the_day_draw_log (target_date, event, winner_entry_id, detail)
    values (e.target_date, v_result, e.id, '$' || (p_amount_cents / 100) || ', Stripe session ' || coalesce(p_session_id, '?'));
  else
    v_result := 'already_' || e.status;
  end if;

  return jsonb_build_object(
    'result', v_result,
    'refunds', coalesce((
      select jsonb_agg(jsonb_build_object('entry_id', x.id, 'payment_intent', x.stripe_payment_intent,
                                          'amount_cents', x.refund_cents))
      from public.mic_of_the_day_entries x
      where x.target_date = e.target_date and x.refund_cents is not null
        and x.refunded_at is null and x.stripe_payment_intent is not null), '[]'::jsonb));
end;
$$;

create or replace function public.motd_mark_refunded(p_entry_id uuid, p_refund_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.mic_of_the_day_entries;
begin
  -- The Stripe webhook (service role) or an admin marking a refund sent by hand.
  if auth.uid() is not null and not public.motd_is_admin() then
    raise exception 'Admins only.';
  end if;
  update public.mic_of_the_day_entries
  set refunded_at = now(), stripe_refund_id = p_refund_id
  where id = p_entry_id and refund_cents is not null and refunded_at is null
  returning * into e;
  if e.id is not null then
    insert into public.mic_of_the_day_draw_log (target_date, event, winner_entry_id, detail)
    values (e.target_date, 'refunded', e.id, '$' || (e.refund_cents / 100) || '. ' || coalesce(e.refund_reason, ''));
  end if;
end;
$$;

-- ===== 9. Admin: override, clear, reset =====
--   set    pin p_mic_id on the date for free ("comp"), replacing whoever was there
--   clear  leave the date deliberately blank (also blanks a standing day)
--   reset  undo an admin set/clear, back to the standing pick or open
-- A paying host who is displaced is recorded as owed a full refund; it shows under
-- "Refunds owed" in Admin and is sent from the Stripe dashboard.
drop function if exists public.motd_admin_set_day(date, text, uuid);
create or replace function public.motd_admin_set_day(p_date date, p_action text, p_mic_id text default null)
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
  perform pg_advisory_xact_lock(8675309, (p_date - date '2000-01-01'));

  if p_action in ('set', 'clear') then
    if p_action = 'set' and p_mic_id is null then
      raise exception 'Pick a mic.';
    end if;
    update public.mic_of_the_day_entries
    set status = 'outbid', outbid_at = now(),
        refund_cents = case when source = 'bid' and coalesce(price_paid_cents, 0) > 0 then price_paid_cents end,
        refund_reason = case when source = 'bid' and coalesce(price_paid_cents, 0) > 0 then 'Replaced by Comediq' end
    where target_date = p_date and status in ('won', 'paid');
    insert into public.mic_of_the_day_entries
      (target_date, mic_id, host_user_id, status, source, price_paid_cents, live_from)
    values (p_date, case when p_action = 'set' then p_mic_id end, v_user, 'paid', 'admin', 0, now());
  elsif p_action = 'reset' then
    update public.mic_of_the_day_entries set status = 'outbid', outbid_at = now()
    where target_date = p_date and source = 'admin' and status in ('won', 'paid');
  else
    raise exception 'Unknown action %', p_action;
  end if;

  insert into public.mic_of_the_day_draw_log (target_date, event, detail)
  values (p_date, 'admin_' || p_action, coalesce(p_mic_id, ''));
  return public.motd_week();
end;
$$;

-- ===== 10. Who may call what =====
revoke all on function public.motd_runs_on(text, date) from public;
revoke all on function public.motd_resolve(date) from public;
revoke all on function public.motd_check_claim(uuid, text, date) from public;
revoke all on function public.motd_claim_free(text, date) from public;
revoke all on function public.motd_start_bid(uuid, text, date) from public;
revoke all on function public.motd_mark_paid(uuid, text, integer, text) from public;
revoke all on function public.motd_mark_refunded(uuid, text) from public;

grant execute on function public.motd_week() to anon, authenticated;
grant execute on function public.motd_claim_free(text, date) to authenticated;
grant execute on function public.motd_admin_set_day(date, text, text) to authenticated;
grant execute on function public.motd_mark_refunded(uuid, text) to authenticated, service_role;
grant execute on function public.motd_start_bid(uuid, text, date) to service_role;
grant execute on function public.motd_mark_paid(uuid, text, integer, text) to service_role;

-- ===== 11. Host claiming =====
-- claim_mic_host is what "Claim This Mic" and "This is my mic" call. It was missing on the
-- live database. The mic id is text here and the insert is built as a statement so it
-- works whether mic_hosts.mic_id is text or uuid. No ON CONFLICT: the live table has no
-- unique rule on (user_id, mic_id).
drop function if exists public.claim_mic_host(uuid);
create or replace function public.claim_mic_host(p_mic_id text)
returns public.mic_hosts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.mic_hosts;
begin
  if v_user is null then
    raise exception 'Must be authenticated';
  end if;
  if not exists (select 1 from public.open_mics_historical m where m.unique_identifier::text = p_mic_id) then
    raise exception 'That mic was not found.';
  end if;

  select * into v_row from public.mic_hosts h
  where h.user_id = v_user and h.mic_id::text = p_mic_id
  limit 1;

  if not found then
    execute format('insert into public.mic_hosts (user_id, mic_id, is_verified) values (%L, %L, false)',
                   v_user, p_mic_id);
    select * into v_row from public.mic_hosts h
    where h.user_id = v_user and h.mic_id::text = p_mic_id
    limit 1;
  end if;

  return v_row;
end;
$$;

revoke all on function public.claim_mic_host(text) from public;
grant execute on function public.claim_mic_host(text) to authenticated;
