
-- 1. Add 'custom' to mic_frequency enum
ALTER TYPE public.mic_frequency ADD VALUE IF NOT EXISTS 'custom';

-- 2. Rename 'comediq_direct' to 'comediq_slots' in signup_method enum
ALTER TYPE public.signup_method RENAME VALUE 'comediq_direct' TO 'comediq_slots';

-- 3. Add frequency_custom_text column
ALTER TABLE public.open_mics_historical ADD COLUMN IF NOT EXISTS frequency_custom_text text;

-- 4. Add frequency_custom_text to open_mics_requests too
ALTER TABLE public.open_mics_requests ADD COLUMN IF NOT EXISTS frequency_custom_text text;

-- 5. Allow authenticated users to insert into open_mics_historical (for direct mic submission)
DROP POLICY IF EXISTS "Enable insert" ON public.open_mics_historical;
CREATE POLICY "Authenticated users can insert mics"
ON public.open_mics_historical
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. Allow anon users to insert into open_mics_historical too (for non-logged-in submissions)
CREATE POLICY "Anon users can insert mics"
ON public.open_mics_historical
FOR INSERT
TO anon
WITH CHECK (true);
