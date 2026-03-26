ALTER TABLE growth_opportunities ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'submitted';

-- Allow users to see their own submissions regardless of is_active
CREATE POLICY "Users can view their own submissions"
ON growth_opportunities
FOR SELECT
TO authenticated
USING (auth.uid() = submitted_by);