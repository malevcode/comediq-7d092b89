
CREATE TABLE public.user_mic_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mic_id uuid NOT NULL,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  checkin_date date NOT NULL DEFAULT CURRENT_DATE
);

CREATE UNIQUE INDEX user_mic_checkins_unique_per_day 
  ON public.user_mic_checkins (user_id, mic_id, checkin_date);

ALTER TABLE public.user_mic_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checkins"
  ON public.user_mic_checkins FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checkins"
  ON public.user_mic_checkins FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checkins"
  ON public.user_mic_checkins FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
