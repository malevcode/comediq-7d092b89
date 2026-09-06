-- Dispatch a GitHub refresh of public/mics.json whenever open mic data changes.
--
-- Required Supabase setup:
--   1. Deploy the dispatch-mics-json-refresh Edge Function.
--   2. Set Edge Function secrets:
--      - GITHUB_MICS_REFRESH_TOKEN: GitHub token with repository dispatch access.
--      - MICS_JSON_REFRESH_WEBHOOK_SECRET: a random shared secret.
--      - GITHUB_REPOSITORY: optional, defaults to malevcode/comediq-7d092b89.
--      - MICS_JSON_REFRESH_REF: optional, defaults to main.
--   3. Set the same shared secret in Supabase Vault:
--      select vault.create_secret(
--        '<secret>',
--        'mics_json_refresh_webhook_secret',
--        'Shared secret for open_mics_historical -> mics.json refresh dispatch'
--      );
--
-- The GitHub workflow waits 150 seconds before exporting, so updates land
-- two minutes and thirty seconds after the database change.

create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create or replace function public.dispatch_mics_json_refresh()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  webhook_secret text;
  function_url text := 'https://wwqoztrqprqksdubjwgj.supabase.co/functions/v1/dispatch-mics-json-refresh';
  payload jsonb;
begin
  select decrypted_secret
  into webhook_secret
  from vault.decrypted_secrets
  where name = 'mics_json_refresh_webhook_secret'
  order by updated_at desc
  limit 1;

  if webhook_secret is null or webhook_secret = '' then
    raise warning 'Vault secret mics_json_refresh_webhook_secret is not configured; skipping mics.json refresh dispatch';
    return null;
  end if;

  payload := jsonb_build_object(
    'type', tg_op,
    'table', tg_table_name,
    'schema', tg_table_schema
  );

  perform net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-mics-refresh-secret', webhook_secret
    ),
    body := payload
  );

  return null;
end;
$$;

drop trigger if exists dispatch_mics_json_refresh_on_open_mics_historical on public.open_mics_historical;

create trigger dispatch_mics_json_refresh_on_open_mics_historical
after insert or update or delete on public.open_mics_historical
for each statement
execute function public.dispatch_mics_json_refresh();
