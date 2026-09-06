-- Keep MOTD admin controls consistent with the app's admin checks.
-- The frontend recognizes both profiles.isadmin and user_roles.role = 'admin'.

grant insert, update, delete on public.mic_of_the_day to authenticated;
grant insert, update, delete on public.motd_weekly_defaults to authenticated;
grant update, delete on public.motd_nominations to authenticated;

drop policy if exists "Admins can manage mic of the day" on public.mic_of_the_day;
create policy "Admins can manage mic of the day"
on public.mic_of_the_day
for all
to authenticated
using (public.has_role(auth.uid(), 'admin') or public.is_current_user_admin())
with check (public.has_role(auth.uid(), 'admin') or public.is_current_user_admin());

drop policy if exists "Admins manage weekly defaults" on public.motd_weekly_defaults;
create policy "Admins manage weekly defaults"
on public.motd_weekly_defaults
for all
to authenticated
using (public.has_role(auth.uid(), 'admin') or public.is_current_user_admin())
with check (public.has_role(auth.uid(), 'admin') or public.is_current_user_admin());

drop policy if exists "Admins manage nominations" on public.motd_nominations;
create policy "Admins manage nominations"
on public.motd_nominations
for all
to authenticated
using (public.has_role(auth.uid(), 'admin') or public.is_current_user_admin())
with check (public.has_role(auth.uid(), 'admin') or public.is_current_user_admin());
