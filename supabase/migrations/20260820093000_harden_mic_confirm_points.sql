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

grant execute on function public.confirm_mic(text) to authenticated;
