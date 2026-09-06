CREATE POLICY "users_can_insert_trial_open_mics"
ON public.open_mics_historical
FOR INSERT
TO authenticated
WITH CHECK (
  creator_id = auth.uid()
  AND status = 'trial'::mic_status
);