-- Approve every show submitted on Comediq automatically, the same way new mics go live.
-- Rows that come from a partner source keep their own approval path.

create or replace function public.auto_approve_native_show()
returns trigger
language plpgsql
as $$
begin
  if new.source is null then
    new.verified := true;
  end if;
  return new;
end;
$$;

drop trigger if exists auto_approve_native_show on public.audience_shows;
create trigger auto_approve_native_show
  before insert on public.audience_shows
  for each row execute function public.auto_approve_native_show();

-- Publish what is already waiting (for example Evan Solomon's show).
update public.audience_shows
set verified = true
where source is null
  and verified = false
  and submitted_by is not null
  and status = 'active'
  and is_active = true;
