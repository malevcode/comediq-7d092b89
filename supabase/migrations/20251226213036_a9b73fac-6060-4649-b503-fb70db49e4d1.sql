-- Step 1: Enable signup for all active mics
UPDATE public.open_mics_historical 
SET signup_enabled = true 
WHERE active = true;

-- Step 2: Create a function to get or create the next host record for auto-events
-- This allows authenticated users to create events for mics without verified hosts
CREATE OR REPLACE FUNCTION public.get_or_create_system_host(mic_id_param uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  host_record_id uuid;
BEGIN
  -- First check if there's already a verified host
  SELECT id INTO host_record_id
  FROM mic_hosts
  WHERE mic_id = mic_id_param AND is_verified = true
  LIMIT 1;
  
  IF host_record_id IS NOT NULL THEN
    RETURN host_record_id;
  END IF;
  
  -- Check for any existing host record for this user
  SELECT id INTO host_record_id
  FROM mic_hosts
  WHERE mic_id = mic_id_param AND user_id = auth.uid()
  LIMIT 1;
  
  IF host_record_id IS NOT NULL THEN
    RETURN host_record_id;
  END IF;
  
  -- Create a new host record for this user (unverified, for auto-events)
  INSERT INTO mic_hosts (user_id, mic_id, is_verified)
  VALUES (auth.uid(), mic_id_param, false)
  RETURNING id INTO host_record_id;
  
  RETURN host_record_id;
END;
$$;

-- Step 3: Update RLS policy on mic_signup_events to allow authenticated users to create events
-- for mics without verified hosts using the new function
DROP POLICY IF EXISTS "Verified hosts can create events" ON mic_signup_events;

CREATE POLICY "Authenticated users can create events"
ON mic_signup_events
FOR INSERT
TO authenticated
WITH CHECK (
  host_id IN (
    SELECT id FROM mic_hosts WHERE user_id = auth.uid()
  )
);

-- Step 4: Add RLS policy for verified hosts to update their mic info
CREATE POLICY "Verified hosts can update their mic info"
ON open_mics_historical
FOR UPDATE
TO authenticated
USING (
  unique_identifier IN (
    SELECT mic_id FROM mic_hosts 
    WHERE user_id = auth.uid() AND is_verified = true
  )
)
WITH CHECK (
  unique_identifier IN (
    SELECT mic_id FROM mic_hosts 
    WHERE user_id = auth.uid() AND is_verified = true
  )
);