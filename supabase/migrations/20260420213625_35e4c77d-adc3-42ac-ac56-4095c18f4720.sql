CREATE TABLE public.mic_of_the_day (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mic_unique_identifier uuid NOT NULL,
  claimed_by uuid NOT NULL,
  claim_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/New_York')::date,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mic_of_the_day_unique_date UNIQUE (claim_date)
);

CREATE INDEX idx_mic_of_the_day_date ON public.mic_of_the_day(claim_date DESC);

ALTER TABLE public.mic_of_the_day ENABLE ROW LEVEL SECURITY;

-- Anyone can view
CREATE POLICY "Anyone can view mic of the day"
ON public.mic_of_the_day
FOR SELECT
USING (true);

-- Verified hosts can claim for their own mic
CREATE POLICY "Verified hosts can claim mic of the day"
ON public.mic_of_the_day
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = claimed_by
  AND EXISTS (
    SELECT 1 FROM public.mic_hosts
    WHERE mic_hosts.user_id = auth.uid()
      AND mic_hosts.mic_id = mic_of_the_day.mic_unique_identifier
      AND mic_hosts.is_verified = true
  )
);

-- Admins full access
CREATE POLICY "Admins can manage mic of the day"
ON public.mic_of_the_day
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND isadmin = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND isadmin = true)
);