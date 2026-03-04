
-- 1. Add points_balance to existing profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points_balance integer NOT NULL DEFAULT 0;

-- 2. Create recording_status enum
CREATE TYPE public.recording_status AS ENUM ('video_active', 'processing', 'audio_archived');

-- 3. Create points_ledger table
CREATE TABLE public.points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  amount integer NOT NULL,
  action_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Create recordings table
CREATE TABLE public.recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  status recording_status NOT NULL DEFAULT 'video_active',
  venue_name text,
  lat_long text,
  file_url text,
  transcription text,
  ai_summary jsonb,
  performance_metrics jsonb,
  scheduled_cleanup_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;

-- 6. RLS for points_ledger
CREATE POLICY "Users can view their own points" ON public.points_ledger
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert points" ON public.points_ledger
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all points" ON public.points_ledger
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

-- 7. RLS for recordings
CREATE POLICY "Users can view their own recordings" ON public.recordings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recordings" ON public.recordings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recordings" ON public.recordings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recordings" ON public.recordings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all recordings" ON public.recordings
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

-- 8. Index for scheduled cleanup queries
CREATE INDEX idx_recordings_cleanup ON public.recordings (scheduled_cleanup_at)
  WHERE status = 'video_active' AND scheduled_cleanup_at IS NOT NULL;

-- 9. Index for points ledger lookups
CREATE INDEX idx_points_ledger_user ON public.points_ledger (user_id, created_at DESC);

-- 10. Auto-set scheduled_cleanup_at to 7 days after creation
CREATE OR REPLACE FUNCTION public.set_recording_cleanup_date()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF NEW.scheduled_cleanup_at IS NULL THEN
    NEW.scheduled_cleanup_at := NEW.created_at + interval '7 days';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_recording_cleanup
  BEFORE INSERT ON public.recordings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_recording_cleanup_date();
