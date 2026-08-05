-- Let authenticated users open signup sheets through the controlled host helper.
-- RLS still requires created events to use a host row owned by the current user.
CREATE OR REPLACE FUNCTION public.get_or_create_system_host(mic_id_param uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  host_record_id uuid;
BEGIN
  SELECT id INTO host_record_id
  FROM public.mic_hosts
  WHERE mic_id = mic_id_param
    AND is_verified = true
  LIMIT 1;

  IF host_record_id IS NOT NULL THEN
    RETURN host_record_id;
  END IF;

  SELECT id INTO host_record_id
  FROM public.mic_hosts
  WHERE mic_id = mic_id_param
    AND user_id = auth.uid()
  LIMIT 1;

  IF host_record_id IS NOT NULL THEN
    RETURN host_record_id;
  END IF;

  INSERT INTO public.mic_hosts (user_id, mic_id, is_verified)
  VALUES (auth.uid(), mic_id_param, false)
  RETURNING id INTO host_record_id;

  RETURN host_record_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_system_host(uuid) TO authenticated;
GRANT SELECT, INSERT ON public.mic_signup_events TO authenticated;

DROP POLICY IF EXISTS "Verified hosts can create events" ON public.mic_signup_events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.mic_signup_events;

CREATE POLICY "Authenticated users can create events"
ON public.mic_signup_events
FOR INSERT
TO authenticated
WITH CHECK (
  host_id IN (
    SELECT id
    FROM public.mic_hosts
    WHERE user_id = auth.uid()
  )
);
