-- Add cover_image_url column to open_mics_historical
ALTER TABLE open_mics_historical 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Create storage bucket for mic covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('mic-covers', 'mic-covers', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: Anyone can view mic covers
CREATE POLICY "Anyone can view mic covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'mic-covers');

-- RLS policy: Verified hosts can upload/update/delete mic covers
-- Using simpler policy - verified hosts can manage covers
CREATE POLICY "Verified hosts can manage mic covers"
ON storage.objects FOR ALL
USING (
  bucket_id = 'mic-covers' AND
  EXISTS (
    SELECT 1 FROM mic_hosts
    WHERE mic_hosts.user_id = auth.uid()
    AND mic_hosts.is_verified = true
  )
)
WITH CHECK (
  bucket_id = 'mic-covers' AND
  EXISTS (
    SELECT 1 FROM mic_hosts
    WHERE mic_hosts.user_id = auth.uid()
    AND mic_hosts.is_verified = true
  )
);