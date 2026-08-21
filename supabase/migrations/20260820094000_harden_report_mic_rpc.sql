create table if not exists public.mic_flags (
  id uuid primary key default gen_random_uuid(),
  mic_unique_identifier text references public.open_mics_historical(unique_identifier) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  month text not null,
  created_at timestamptz default now()
);

alter table public.mic_flags
  add column if not exists mic_unique_identifier text references public.open_mics_historical(unique_identifier) on delete cascade,
  add column if not exists user_id uuid references auth.users(id),
  add column if not exists month text,
  add column if not exists created_at timestamptz default now();

create unique index if not exists mic_flags_unique_user_month_idx
  on public.mic_flags (mic_unique_identifier, user_id, month);

alter table public.point_transactions
  add column if not exists mic_unique_identifier text references public.open_mics_historical(unique_identifier) on delete set null,
  add column if not exists type text,
  add column if not exists amount numeric,
  add column if not exists created_at timestamptz default now();

alter table public.user_points
  add column if not exists points numeric default 0,
  add column if not exists updated_at timestamptz default now();

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

grant execute on function public.report_mic(text) to authenticated;
grant execute on function public.admin_deactivate_flagged_mic(text) to authenticated;

notify pgrst, 'reload schema';
