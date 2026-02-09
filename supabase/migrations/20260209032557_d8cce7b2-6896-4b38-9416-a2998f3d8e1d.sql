-- Allow authenticated users to update public-facing columns on open_mics_historical
-- This enables community editing like the original Google Sheet
CREATE POLICY "Authenticated users can update public mic info"
  ON open_mics_historical
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);