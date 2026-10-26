-- Day-before text confirmations for mic hosts. See docs/HOST_TEXT_CONFIRMATION_PLAN.md.
--
-- Phone numbers are private. Both tables have row level security on, and only
-- the host can read their own contact row. Nothing here is exported to mics.json.

create table if not exists public.mic_host_contacts (
  id uuid primary key default gen_random_uuid(),
  mic_id uuid not null references public.open_mics_historical(unique_identifier) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  phone text not null,                 -- E.164, e.g. +12125550123
  consent_at timestamptz not null,     -- when they ticked the consent box
  verified_at timestamptz,             -- when they replied YES to the first text
  opted_out_at timestamptz,            -- STOP, or they turned it off
  created_at timestamptz not null default now(),
  unique (mic_id, user_id)
);

create table if not exists public.mic_confirmation_texts (
  id uuid primary key default gen_random_uuid(),
  mic_id uuid not null references public.open_mics_historical(unique_identifier) on delete cascade,
  phone text not null,
  kind text not null check (kind in ('verify', 'confirm')),
  occurrence_date date not null,       -- the show date a confirm text is about
  body text not null,
  status text not null default 'sent', -- sent | failed
  provider_id text,
  sent_at timestamptz not null default now(),
  reply text,
  replied_at timestamptz,
  unique (mic_id, phone, kind, occurrence_date)
);

alter table public.mic_host_contacts enable row level security;
alter table public.mic_confirmation_texts enable row level security;

drop policy if exists "Hosts can read their own contact" on public.mic_host_contacts;
create policy "Hosts can read their own contact"
  on public.mic_host_contacts for select to authenticated
  using (user_id = auth.uid());
-- No insert/update/delete policies: hosts go through set_host_confirmation_contact.
-- mic_confirmation_texts has no policies at all: only the service key touches it.

-- Turn a typed phone number into +E.164, or raise. US numbers may be typed with
-- or without the country code; anything else must start with +.
create or replace function public.normalize_phone(p_phone text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
begin
  if left(trim(coalesce(p_phone, '')), 1) = '+' then
    if length(digits) between 8 and 15 then return '+' || digits; end if;
  elsif length(digits) = 10 then
    return '+1' || digits;
  elsif length(digits) = 11 and left(digits, 1) = '1' then
    return '+' || digits;
  end if;
  raise exception 'Enter a phone number like (212) 555-0123';
end $$;

-- A verified host turns confirmation texts on or off for a mic they host.
create or replace function public.set_host_confirmation_contact(
  p_mic_id uuid,
  p_phone text,
  p_consent boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
begin
  if auth.uid() is null then
    raise exception 'Please sign in first';
  end if;

  if not exists (
    select 1 from public.mic_hosts
    where user_id = auth.uid() and mic_id = p_mic_id and is_verified = true
  ) then
    raise exception 'Only a verified host of this mic can turn on confirmation texts';
  end if;

  if not p_consent then
    update public.mic_host_contacts
      set opted_out_at = now()
      where mic_id = p_mic_id and user_id = auth.uid();
    return;
  end if;

  v_phone := public.normalize_phone(p_phone);

  insert into public.mic_host_contacts (mic_id, user_id, phone, consent_at)
  values (p_mic_id, auth.uid(), v_phone, now())
  on conflict (mic_id, user_id) do update
    set phone = excluded.phone,
        consent_at = now(),
        opted_out_at = null,
        -- a changed number must prove itself again
        verified_at = case when public.mic_host_contacts.phone = excluded.phone
                           then public.mic_host_contacts.verified_at else null end;
end $$;

revoke all on function public.set_host_confirmation_contact(uuid, text, boolean) from public, anon;
grant execute on function public.set_host_confirmation_contact(uuid, text, boolean) to authenticated;

-- Handles an incoming text reply. Called by the texting provider's webhook with
-- the service key, never from the browser. Returns what it did.
create or replace function public.apply_host_reply(p_phone text, p_body text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
  v_word text := upper(split_part(btrim(coalesce(p_body, '')), ' ', 1));
  v_text public.mic_confirmation_texts%rowtype;
begin
  v_phone := public.normalize_phone(p_phone);

  if v_word in ('STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT') then
    update public.mic_host_contacts set opted_out_at = now() where phone = v_phone;
    return 'stop';
  end if;

  select * into v_text
  from public.mic_confirmation_texts
  where phone = v_phone and reply is null
  order by sent_at desc
  limit 1;

  if not found or v_word not in ('YES', 'Y', 'NO', 'N') then
    return 'unknown';
  end if;

  update public.mic_confirmation_texts
    set reply = v_word, replied_at = now()
    where id = v_text.id;

  if v_word in ('NO', 'N') then
    return 'no';
  end if;

  if v_text.kind = 'verify' then
    update public.mic_host_contacts
      set verified_at = now()
      where mic_id = v_text.mic_id and phone = v_phone;
    return 'verified';
  end if;

  -- last_confirmed_at is what the cards already show as "Verified <date>".
  update public.open_mics_historical
    set last_confirmed_at = now()
    where unique_identifier = v_text.mic_id;
  return 'confirmed';
end $$;

revoke all on function public.apply_host_reply(text, text) from public, anon, authenticated;
grant execute on function public.apply_host_reply(text, text) to service_role;
