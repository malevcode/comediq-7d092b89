-- Keep dashboard authorization consistent with the app.
-- The frontend treats either profiles.isadmin or user_roles.role = 'admin' as admin access,
-- so these admin tables need to recognize both paths too.

grant select, update on public.open_mics_requests to authenticated;
grant select, insert, update, delete on public.admin_todos to authenticated;

drop policy if exists "Admins can read open mic requests" on public.open_mics_requests;
create policy "Admins can read open mic requests"
on public.open_mics_requests
for select
to authenticated
using (public.has_role(auth.uid(), 'admin') or public.is_current_user_admin());

drop policy if exists "Admins can update open mic requests" on public.open_mics_requests;
create policy "Admins can update open mic requests"
on public.open_mics_requests
for update
to authenticated
using (public.has_role(auth.uid(), 'admin') or public.is_current_user_admin())
with check (public.has_role(auth.uid(), 'admin') or public.is_current_user_admin());

drop policy if exists "Admins can manage admin_todos" on public.admin_todos;
create policy "Admins can manage admin_todos"
on public.admin_todos
for all
to authenticated
using (public.has_role(auth.uid(), 'admin') or public.is_current_user_admin())
with check (public.has_role(auth.uid(), 'admin') or public.is_current_user_admin());
