ALTER TABLE public.profile_custom_shows
  ADD COLUMN IF NOT EXISTS rating numeric(3,1)
    CHECK (rating >= 1 AND rating <= 10);
