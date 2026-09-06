GRANT INSERT, UPDATE, DELETE ON public.open_mics_historical TO authenticated;
GRANT ALL ON public.open_mics_historical TO service_role;

CREATE POLICY "admins_can_insert_open_mics"
ON public.open_mics_historical FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_current_user_admin());

CREATE POLICY "admins_can_update_open_mics"
ON public.open_mics_historical FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.is_current_user_admin())
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_current_user_admin());

CREATE POLICY "admins_can_delete_open_mics"
ON public.open_mics_historical FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.is_current_user_admin());