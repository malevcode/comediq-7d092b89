-- Add missing columns to match the form fields
ALTER TABLE open_mics_requests
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS venue_type text,
  ADD COLUMN IF NOT EXISTS cost text,
  ADD COLUMN IF NOT EXISTS stage_time text,
  ADD COLUMN IF NOT EXISTS sign_up_instructions text,
  ADD COLUMN IF NOT EXISTS hosts_organizers text,
  ADD COLUMN IF NOT EXISTS changes_updates text,
  ADD COLUMN IF NOT EXISTS other_rules text,
  ADD COLUMN IF NOT EXISTS city text DEFAULT 'New York',
  ADD COLUMN IF NOT EXISTS host_phone text,
  ADD COLUMN IF NOT EXISTS latest_end_time text,
  ADD COLUMN IF NOT EXISTS open_mic text;

-- Fix type mismatches: change date to text (stores weekday name)
-- and time to text (stores free-form time string)
ALTER TABLE open_mics_requests
  ALTER COLUMN date TYPE text USING date::text,
  ALTER COLUMN time TYPE text USING time::text;

-- Allow anonymous users to submit mic requests too
CREATE POLICY "Allow anonymous inserts"
  ON open_mics_requests FOR INSERT
  TO anon
  WITH CHECK (true);