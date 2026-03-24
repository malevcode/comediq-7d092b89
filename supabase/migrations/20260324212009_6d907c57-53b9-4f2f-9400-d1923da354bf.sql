
-- Add guest columns to mic_signups for anonymous signups
ALTER TABLE public.mic_signups 
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN guest_name text,
  ADD COLUMN guest_email text,
  ADD COLUMN guest_phone text;

-- Allow anon users to insert signups (guest flow)
CREATE POLICY "Anon users can create guest signups"
  ON public.mic_signups
  FOR INSERT
  TO anon
  WITH CHECK (guest_email IS NOT NULL AND user_id IS NULL);

-- Allow anon users to view their signups (by event, for display)
CREATE POLICY "Anon can view signups for active events"
  ON public.mic_signups
  FOR SELECT
  TO anon
  USING (event_id IN (
    SELECT id FROM mic_signup_events WHERE is_active = true
  ));
