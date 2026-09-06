CREATE POLICY "users_can_insert_own_mic_requests"
ON public.open_mics_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_read_own_mic_requests"
ON public.open_mics_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

GRANT SELECT, INSERT ON public.open_mics_requests TO authenticated;