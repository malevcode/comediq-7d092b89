-- =============================================
-- MIC SOCIAL FEATURES - TABLES & RLS POLICIES
-- =============================================

-- 1. MIC COMMENTS TABLE (180 character limit)
CREATE TABLE public.mic_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mic_unique_identifier UUID NOT NULL,
  user_id UUID NOT NULL,
  comment_text TEXT NOT NULL CHECK (length(comment_text) <= 180),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mic_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments
CREATE POLICY "Anyone can view comments"
ON public.mic_comments FOR SELECT
USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "Users can insert their own comments"
ON public.mic_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.mic_comments FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.mic_comments FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_mic_comments_mic ON public.mic_comments(mic_unique_identifier);
CREATE INDEX idx_mic_comments_user ON public.mic_comments(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_mic_comments_updated_at
BEFORE UPDATE ON public.mic_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. SAVED MICS TABLE (Bookmarks)
CREATE TABLE public.saved_mics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mic_unique_identifier UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, mic_unique_identifier)
);

-- Enable RLS
ALTER TABLE public.saved_mics ENABLE ROW LEVEL SECURITY;

-- Users can view their own saves
CREATE POLICY "Users can view their own saves"
ON public.saved_mics FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own saves
CREATE POLICY "Users can insert their own saves"
ON public.saved_mics FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saves
CREATE POLICY "Users can delete their own saves"
ON public.saved_mics FOR DELETE
USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_saved_mics_user ON public.saved_mics(user_id);

-- 3. MIC PLAYLISTS TABLE
CREATE TABLE public.mic_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL CHECK (length(name) <= 100),
  description TEXT CHECK (length(description) <= 300),
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mic_playlists ENABLE ROW LEVEL SECURITY;

-- Users can view their own playlists + public playlists
CREATE POLICY "Users can view own and public playlists"
ON public.mic_playlists FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

-- Users can insert their own playlists
CREATE POLICY "Users can insert their own playlists"
ON public.mic_playlists FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own playlists
CREATE POLICY "Users can update their own playlists"
ON public.mic_playlists FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own playlists
CREATE POLICY "Users can delete their own playlists"
ON public.mic_playlists FOR DELETE
USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_mic_playlists_user ON public.mic_playlists(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_mic_playlists_updated_at
BEFORE UPDATE ON public.mic_playlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. MIC PLAYLIST ITEMS TABLE
CREATE TABLE public.mic_playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES public.mic_playlists(id) ON DELETE CASCADE,
  mic_unique_identifier UUID NOT NULL,
  notes TEXT CHECK (length(notes) <= 180),
  order_index INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (playlist_id, mic_unique_identifier)
);

-- Enable RLS
ALTER TABLE public.mic_playlist_items ENABLE ROW LEVEL SECURITY;

-- Users can view items in playlists they can view
CREATE POLICY "Users can view items in accessible playlists"
ON public.mic_playlist_items FOR SELECT
USING (
  playlist_id IN (
    SELECT id FROM public.mic_playlists
    WHERE user_id = auth.uid() OR is_public = true
  )
);

-- Users can insert items to their own playlists
CREATE POLICY "Users can insert items to own playlists"
ON public.mic_playlist_items FOR INSERT
WITH CHECK (
  playlist_id IN (
    SELECT id FROM public.mic_playlists
    WHERE user_id = auth.uid()
  )
);

-- Users can update items in their own playlists
CREATE POLICY "Users can update items in own playlists"
ON public.mic_playlist_items FOR UPDATE
USING (
  playlist_id IN (
    SELECT id FROM public.mic_playlists
    WHERE user_id = auth.uid()
  )
);

-- Users can delete items from their own playlists
CREATE POLICY "Users can delete items from own playlists"
ON public.mic_playlist_items FOR DELETE
USING (
  playlist_id IN (
    SELECT id FROM public.mic_playlists
    WHERE user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX idx_mic_playlist_items_playlist ON public.mic_playlist_items(playlist_id);
CREATE INDEX idx_mic_playlist_items_mic ON public.mic_playlist_items(mic_unique_identifier);

-- 5. HELPER VIEWS
CREATE VIEW public.mic_comment_counts AS
SELECT mic_unique_identifier, COUNT(*) as comment_count
FROM public.mic_comments
GROUP BY mic_unique_identifier;

CREATE VIEW public.mic_saved_counts AS
SELECT mic_unique_identifier, COUNT(*) as saved_count
FROM public.saved_mics
GROUP BY mic_unique_identifier;