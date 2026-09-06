-- Editorial Comediq mic picks for daily recommendations and weekly top mics.

create extension if not exists pgcrypto;

create table if not exists public.comediq_mic_picks (
  id uuid primary key default gen_random_uuid(),
  pick_type text not null check (pick_type in ('daily', 'weekly_top')),
  feature_date date not null,
  rank integer not null default 1 check (rank > 0),
  mic_unique_identifier text not null,
  mic_snapshot jsonb not null,
  headline text,
  caption text,
  notes text,
  status text not null default 'planned' check (status in ('planned', 'posted', 'skipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pick_type, feature_date, rank),
  unique (pick_type, feature_date, mic_unique_identifier)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_comediq_mic_picks_updated_at on public.comediq_mic_picks;
create trigger set_comediq_mic_picks_updated_at
before update on public.comediq_mic_picks
for each row execute function public.set_updated_at();

create index if not exists comediq_mic_picks_feature_date_idx
on public.comediq_mic_picks (feature_date);

create index if not exists comediq_mic_picks_mic_unique_identifier_idx
on public.comediq_mic_picks (mic_unique_identifier);

comment on table public.comediq_mic_picks is
  'Editorial selections for Comediq mic of the day and weekly top mics.';

comment on column public.comediq_mic_picks.feature_date is
  'For daily picks, the posting date. For weekly_top picks, use the Sunday that starts the week.';

alter table public.comediq_mic_picks enable row level security;

grant select on public.comediq_mic_picks to anon, authenticated;
grant insert, update, delete on public.comediq_mic_picks to authenticated;

drop policy if exists "Anyone can view comediq mic picks" on public.comediq_mic_picks;
create policy "Anyone can view comediq mic picks"
on public.comediq_mic_picks
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage comediq mic picks" on public.comediq_mic_picks;
create policy "Admins can manage comediq mic picks"
on public.comediq_mic_picks
for all
to authenticated
using (public.has_role(auth.uid(), 'admin') or public.is_current_user_admin())
with check (public.has_role(auth.uid(), 'admin') or public.is_current_user_admin());
