create or replace function public.slugify_text(t text)
returns text language sql immutable set search_path = public as $$
  select trim(both '-' from regexp_replace(regexp_replace(lower(coalesce(t,'')), '[''’]', '', 'g'), '[^a-z0-9]+', '-', 'g'))
$$;

alter table public.open_mics_historical disable trigger open_mics_seo_fields;
update public.open_mics_historical set slug = null, venue_slug = null;
delete from public.venues;

with v as (
  select public.slugify_text(venue_name) base, trim(venue_name) name, coalesce(nullif(trim(city),''),'New York') city,
         location, borough, neighborhood, latitude, longitude, active
  from public.open_mics_historical where public.slugify_text(venue_name) <> ''
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

with b as (
  select unique_identifier,
    coalesce(nullif(public.slugify_text(open_mic),''), nullif(public.slugify_text(venue_name),''), 'mic') base,
    row_number() over (partition by coalesce(nullif(public.slugify_text(open_mic),''), nullif(public.slugify_text(venue_name),''), 'mic')
                       order by active desc nulls last, unique_identifier) rn
  from public.open_mics_historical
)
update public.open_mics_historical m
set slug = case when b.rn = 1 then b.base else b.base || '-' || left(md5(m.unique_identifier), 6) end
from b where b.unique_identifier = m.unique_identifier;

alter table public.open_mics_historical enable trigger open_mics_seo_fields;