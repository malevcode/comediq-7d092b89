alter table public.open_mics_historical
  add column if not exists last_confirmed_at timestamptz;

create table if not exists public.mic_confirmations (
  id uuid primary key default gen_random_uuid(),
  mic_unique_identifier text
    references public.open_mics_historical(unique_identifier)
    on delete cascade
    not null,
  user_id uuid references auth.users(id) not null,
  month text not null,
  created_at timestamptz default now(),
  unique (mic_unique_identifier, month)
);

create table if not exists public.mic_flags (
  id uuid primary key default gen_random_uuid(),
  mic_unique_identifier text
    references public.open_mics_historical(unique_identifier)
    on delete cascade
    not null,
  user_id uuid references auth.users(id) not null,
  month text not null,
  created_at timestamptz default now(),
  unique (mic_unique_identifier, user_id, month)
);

create table if not exists public.user_points (
  user_id uuid primary key references auth.users(id) on delete cascade,
  points numeric default 0,
  updated_at timestamptz default now()
);

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  mic_unique_identifier text references public.open_mics_historical(unique_identifier) on delete set null,
  type text not null,
  amount numeric not null,
  created_at timestamptz default now()
);

alter table public.user_points
  add column if not exists points numeric default 0,
  add column if not exists updated_at timestamptz default now();

alter table public.point_transactions
  add column if not exists mic_unique_identifier text references public.open_mics_historical(unique_identifier) on delete set null,
  add column if not exists type text,
  add column if not exists amount numeric,
  add column if not exists created_at timestamptz default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'point_transactions'
      and column_name = 'mic_id'
      and is_nullable = 'NO'
  ) then
    alter table public.point_transactions alter column mic_id drop not null;
  end if;
end $$;

alter table public.mic_confirmations enable row level security;
alter table public.mic_flags enable row level security;
alter table public.user_points enable row level security;
alter table public.point_transactions enable row level security;

create index if not exists mic_confirmations_month_mic_idx
  on public.mic_confirmations (month, mic_unique_identifier);

create index if not exists mic_flags_month_mic_idx
  on public.mic_flags (month, mic_unique_identifier);

create index if not exists point_transactions_user_created_idx
  on public.point_transactions (user_id, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'mic_confirmations' and policyname = 'Anyone can read mic confirmations'
  ) then
    create policy "Anyone can read mic confirmations"
      on public.mic_confirmations for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'mic_flags' and policyname = 'Users can read their own mic flags'
  ) then
    create policy "Users can read their own mic flags"
      on public.mic_flags for select to authenticated
      using (
        auth.uid() = user_id
        or exists (
          select 1 from public.profiles
          where profiles.user_id = auth.uid()
            and profiles.isadmin = true
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_points' and policyname = 'Users can read their own confirmation points'
  ) then
    create policy "Users can read their own confirmation points"
      on public.user_points for select to authenticated
      using (
        auth.uid() = user_id
        or exists (
          select 1 from public.profiles
          where profiles.user_id = auth.uid()
            and profiles.isadmin = true
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'point_transactions' and policyname = 'Users can read their own confirmation point transactions'
  ) then
    create policy "Users can read their own confirmation point transactions"
      on public.point_transactions for select to authenticated
      using (
        auth.uid() = user_id
        or exists (
          select 1 from public.profiles
          where profiles.user_id = auth.uid()
            and profiles.isadmin = true
        )
      );
  end if;
end $$;

create or replace function public.award_mic_point(
  p_user_id uuid,
  p_mic_unique_identifier text,
  p_type text,
  p_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.point_transactions (user_id, mic_unique_identifier, type, amount)
  values (p_user_id, p_mic_unique_identifier, p_type, p_amount);

  insert into public.user_points (user_id, points, updated_at)
  values (p_user_id, p_amount, now())
  on conflict (user_id)
  do update set
    points = coalesce(public.user_points.points, 0) + excluded.points,
    updated_at = now();
end;
$$;

create or replace function public.confirm_mic(p_mic_unique_identifier text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_month text := to_char(now(), 'YYYY-MM');
  v_inserted_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.open_mics_historical
    where unique_identifier = p_mic_unique_identifier
  ) then
    raise exception 'Mic not found';
  end if;

  insert into public.mic_confirmations (mic_unique_identifier, user_id, month)
  values (p_mic_unique_identifier, v_user_id, v_month)
  on conflict (mic_unique_identifier, month) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    return jsonb_build_object(
      'status', 'already_confirmed',
      'month', v_month
    );
  end if;

  update public.open_mics_historical
  set last_confirmed_at = now()
  where unique_identifier = p_mic_unique_identifier;

  perform public.award_mic_point(v_user_id, p_mic_unique_identifier, 'confirm', 1);

  return jsonb_build_object(
    'status', 'confirmed',
    'month', v_month,
    'points_awarded', 1
  );
end;
$$;

create or replace function public.report_mic(p_mic_unique_identifier text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_month text := to_char(now(), 'YYYY-MM');
  v_inserted_id uuid;
  v_flag_count integer;
  v_flagger uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.open_mics_historical
    where unique_identifier = p_mic_unique_identifier
  ) then
    raise exception 'Mic not found';
  end if;

  insert into public.mic_flags (mic_unique_identifier, user_id, month)
  values (p_mic_unique_identifier, v_user_id, v_month)
  on conflict (mic_unique_identifier, user_id, month) do nothing
  returning id into v_inserted_id;

  select count(distinct user_id)
  into v_flag_count
  from public.mic_flags
  where mic_unique_identifier = p_mic_unique_identifier
    and month = v_month;

  if v_inserted_id is null then
    return jsonb_build_object(
      'status', 'already_reported',
      'month', v_month,
      'flag_count', v_flag_count,
      'threshold', 2
    );
  end if;

  if v_flag_count >= 2 then
    update public.open_mics_historical
    set active = false
    where unique_identifier = p_mic_unique_identifier;

    for v_flagger in
      select user_id
      from public.mic_flags
      where mic_unique_identifier = p_mic_unique_identifier
        and month = v_month
      order by created_at asc
      limit 2
    loop
      if not exists (
        select 1 from public.point_transactions
        where user_id = v_flagger
          and mic_unique_identifier = p_mic_unique_identifier
          and type = 'flag_auto'
          and to_char(created_at, 'YYYY-MM') = v_month
      ) then
        perform public.award_mic_point(v_flagger, p_mic_unique_identifier, 'flag_auto', 0.5);
      end if;
    end loop;

    return jsonb_build_object(
      'status', 'deactivated',
      'month', v_month,
      'flag_count', v_flag_count,
      'threshold', 2,
      'points_awarded_each', 0.5
    );
  end if;

  return jsonb_build_object(
    'status', 'reported',
    'month', v_month,
    'flag_count', v_flag_count,
    'threshold', 2
  );
end;
$$;

create or replace function public.admin_deactivate_flagged_mic(p_mic_unique_identifier text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_month text := to_char(now(), 'YYYY-MM');
  v_flag_count integer;
  v_flagger uuid;
begin
  if v_admin_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.profiles
    where user_id = v_admin_id
      and isadmin = true
  ) then
    raise exception 'Admin privileges required';
  end if;

  update public.open_mics_historical
  set active = false
  where unique_identifier = p_mic_unique_identifier;

  select count(distinct user_id)
  into v_flag_count
  from public.mic_flags
  where mic_unique_identifier = p_mic_unique_identifier
    and month = v_month;

  for v_flagger in
    select distinct user_id
    from public.mic_flags
    where mic_unique_identifier = p_mic_unique_identifier
      and month = v_month
  loop
    if not exists (
      select 1 from public.point_transactions
      where user_id = v_flagger
        and mic_unique_identifier = p_mic_unique_identifier
        and type in ('flag_auto', 'flag_manual_bonus')
        and to_char(created_at, 'YYYY-MM') = v_month
    ) then
      perform public.award_mic_point(v_flagger, p_mic_unique_identifier, 'flag_manual_bonus', 1);
    end if;
  end loop;

  return jsonb_build_object(
    'status', 'deactivated',
    'month', v_month,
    'flag_count', v_flag_count
  );
end;
$$;

grant execute on function public.confirm_mic(text) to authenticated;
grant execute on function public.report_mic(text) to authenticated;
grant execute on function public.admin_deactivate_flagged_mic(text) to authenticated;
