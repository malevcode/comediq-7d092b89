ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_plan IN ('free', 'premium')),
  ADD COLUMN IF NOT EXISTS credits_balance INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.book_me_mic_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 120),
  instagram_handle TEXT NOT NULL CHECK (char_length(instagram_handle) <= 80),
  phone_number TEXT NOT NULL CHECK (char_length(phone_number) <= 40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.book_me_mic_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Subscribers can create book me mic signups"
  ON public.book_me_mic_signups;

CREATE POLICY "Subscribers can create book me mic signups"
  ON public.book_me_mic_signups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.subscription_plan <> 'free'
    )
  );

CREATE INDEX IF NOT EXISTS idx_book_me_mic_signups_created_at
  ON public.book_me_mic_signups(created_at DESC);
