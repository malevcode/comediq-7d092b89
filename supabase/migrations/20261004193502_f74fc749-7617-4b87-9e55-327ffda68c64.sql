-- slug helper
create or replace function public.slugify_text(t text)
returns text language sql immutable set search_path = public as $$
  select trim(both '-' from regexp_replace(lower(coalesce(t,'')), '[^a-z0-9]+', '-', 'g'))
$$;

-- parse legacy "last_verified" text (M/D, M/D/YY, M/D/YYYY, M.D.YYYY)
create or replace function public.parse_last_verified(t text)
returns timestamptz language plpgsql stable set search_path = public as $$
declare parts text[]; m int; d int; y int; dt date;
begin
  if t is null then return null; end if;
  parts := regexp_match(trim(t), '^(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?$');
  if parts is null then return null; end if;
  m := parts[1]::int; d := parts[2]::int;
  if parts[3] is null then
    y := extract(year from now())::int;
    begin dt := make_date(y, m, d); exception when others then return null; end;
    if dt > current_date then dt := make_date(y - 1, m, d); end if;
  else
    y := parts[3]::int; if y < 100 then y := y + 2000; end if;
    begin dt := make_date(y, m, d); exception when others then return null; end;
  end if;
  if dt > current_date then return null; end if;
  return dt::timestamptz + interval '12 hours';
end $$;

-- venues
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  address text,
  borough text,
  neighborhood text,
  city text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.venues to anon, authenticated;
grant insert, update, delete on public.venues to authenticated;
grant all on public.venues to service_role;
alter table public.venues enable row level security;
create policy "Venues are public" on public.venues for select using (true);
create policy "Admins manage venues" on public.venues for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger venues_updated_at before update on public.venues
  for each row execute function public.update_updated_at_column();

alter table public.open_mics_historical
  add column if not exists slug text,
  add column if not exists venue_slug text,
  add column if not exists last_verified_at timestamptz;

-- backfill venues
with v as (
  select public.slugify_text(venue_name) base, trim(venue_name) name, coalesce(nullif(trim(city),''),'New York') city,
         location, borough, neighborhood, latitude, longitude, active
  from public.open_mics_historical
  where public.slugify_text(venue_name) <> ''
), g as (
  select base, city,
    (array_agg(name order by active desc nulls last))[1] name,
    (array_agg(location order by active desc nulls last) filter (where location is not null))[1] address,
    (array_agg(borough order by active desc nulls last) filter (where borough is not null))[1] borough,
    (array_agg(neighborhood order by active desc nulls last) filter (where neighborhood is not null))[1] neighborhood,
    (array_agg(latitude) filter (where latitude is not null))[1] latitude,
    (array_agg(longitude) filter (where longitude is not null))[1] longitude,
    count(*) over (partition by base) ncity
  from v group by base, city
)
insert into public.venues (slug, name, address, borough, neighborhood, city, latitude, longitude)
select case when ncity > 1 then base || '-' || public.slugify_text(city) else base end,
       name, address, borough, neighborhood, city, latitude, longitude
from g on conflict (slug) do nothing;

update public.open_mics_historical m set venue_slug = v.slug
from public.venues v
where public.slugify_text(m.venue_name) <> ''
  and (v.slug = public.slugify_text(m.venue_name) || '-' || public.slugify_text(coalesce(nullif(trim(m.city),''),'New York'))
       or (v.slug = public.slugify_text(m.venue_name) and coalesce(v.city,'New York') = coalesce(nullif(trim(m.city),''),'New York')));

-- backfill mic slugs (active mics claim clean slugs first)
with b as (
  select unique_identifier,
    coalesce(nullif(public.slugify_text(open_mic),''), nullif(public.slugify_text(venue_name),''), 'mic') base,
    row_number() over (partition by coalesce(nullif(public.slugify_text(open_mic),''), nullif(public.slugify_text(venue_name),''), 'mic')
                       order by active desc nulls last, unique_identifier) rn
  from public.open_mics_historical
)
update public.open_mics_historical m
set slug = case when b.rn = 1 then b.base else b.base || '-' || left(md5(m.unique_identifier), 6) end
from b where b.unique_identifier = m.unique_identifier and m.slug is null;

update public.open_mics_historical
set last_verified_at = nullif(greatest(coalesce(last_confirmed_at,'-infinity'), coalesce(public.parse_last_verified(last_verified),'-infinity')), '-infinity');

create unique index if not exists open_mics_historical_slug_key on public.open_mics_historical (slug);
create index if not exists open_mics_historical_venue_slug_idx on public.open_mics_historical (venue_slug);

-- keep slugs/venues/verification current
create or replace function public.open_mics_seo_fields()
returns trigger language plpgsql security definer set search_path = public as $$
declare base text; vbase text; vcity text; vslug text;
begin
  if new.slug is null or new.slug = '' then
    base := coalesce(nullif(public.slugify_text(new.open_mic),''), nullif(public.slugify_text(new.venue_name),''), 'mic');
    if exists (select 1 from public.open_mics_historical where slug = base and unique_identifier <> new.unique_identifier) then
      base := base || '-' || left(md5(new.unique_identifier), 6);
    end if;
    new.slug := base;
  end if;
  if new.venue_slug is null and public.slugify_text(new.venue_name) <> '' then
    vbase := public.slugify_text(new.venue_name);
    vcity := coalesce(nullif(trim(new.city),''),'New York');
    select slug into vslug from public.venues
      where (slug = vbase and coalesce(city,'New York') = vcity) or slug = vbase || '-' || public.slugify_text(vcity) limit 1;
    if vslug is null then
      vslug := case when exists (select 1 from public.venues where slug = vbase) then vbase || '-' || public.slugify_text(vcity) else vbase end;
      insert into public.venues (slug, name, address, borough, neighborhood, city, latitude, longitude)
      values (vslug, trim(new.venue_name), new.location, new.borough, new.neighborhood, vcity, new.latitude, new.longitude)
      on conflict (slug) do nothing;
    end if;
    new.venue_slug := vslug;
  end if;
  if tg_op = 'INSERT' or new.last_confirmed_at is distinct from old.last_confirmed_at or new.last_verified is distinct from old.last_verified then
    new.last_verified_at := nullif(greatest(coalesce(new.last_verified_at,'-infinity'), coalesce(new.last_confirmed_at,'-infinity'),
                                            coalesce(public.parse_last_verified(new.last_verified),'-infinity')), '-infinity');
  end if;
  return new;
end $$;

create trigger open_mics_seo_fields before insert or update on public.open_mics_historical
  for each row execute function public.open_mics_seo_fields();