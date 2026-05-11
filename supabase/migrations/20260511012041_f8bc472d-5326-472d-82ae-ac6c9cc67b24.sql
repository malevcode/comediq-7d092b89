CREATE TABLE public."App_waitlist" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  instagram TEXT,
  years_doing_comedy TEXT,
  interested_affiliate BOOLEAN NOT NULL DEFAULT false,
  interested_beta_tester BOOLEAN NOT NULL DEFAULT false,
  interested_showcase_booking BOOLEAN NOT NULL DEFAULT false,
  just_curious BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public."App_waitlist" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the app waitlist"
ON public."App_waitlist"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view app waitlist"
ON public."App_waitlist"
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_admin WHERE user_admin.user_id = auth.uid() AND user_admin.is_admin = true));