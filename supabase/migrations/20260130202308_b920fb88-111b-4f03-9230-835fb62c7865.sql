-- Add policy to allow public read access to verified active shows
CREATE POLICY "Anyone can view verified active shows"
ON audience_shows FOR SELECT
USING (
  verified = true 
  AND status = 'active'
);