-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stage_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headshot_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credit TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS years_performing INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create comedian_social_links table
CREATE TABLE IF NOT EXISTS comedian_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Enable RLS on comedian_social_links
ALTER TABLE comedian_social_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for comedian_social_links
CREATE POLICY "Users can view their own social links"
  ON comedian_social_links
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social links"
  ON comedian_social_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social links"
  ON comedian_social_links
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social links"
  ON comedian_social_links
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view social links"
  ON comedian_social_links
  FOR SELECT
  USING (true);

-- Create storage bucket for headshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('headshots', 'headshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for headshots
CREATE POLICY "Anyone can view headshots"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'headshots');

CREATE POLICY "Authenticated users can upload their own headshot"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'headshots' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own headshot"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'headshots' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own headshot"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'headshots' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add trigger to update updated_at on profiles
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at_trigger ON profiles;
CREATE TRIGGER update_profiles_updated_at_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();