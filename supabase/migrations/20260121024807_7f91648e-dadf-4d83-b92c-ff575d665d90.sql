-- Policy 1: Allow admins to UPDATE any mic
CREATE POLICY "Admins can update all mics"
ON public.open_mics_historical
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.isadmin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.isadmin = true
  )
);

-- Policy 2: Allow admins to DELETE any mic
CREATE POLICY "Admins can delete all mics"
ON public.open_mics_historical
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.isadmin = true
  )
);

-- Policy 3: Allow admins to INSERT new mics
CREATE POLICY "Admins can insert mics"
ON public.open_mics_historical
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.isadmin = true
  )
);