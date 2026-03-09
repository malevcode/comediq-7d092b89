
-- Create user_plans table for "Plan to Hit" feature
CREATE TABLE public.user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mic_unique_identifier UUID NOT NULL REFERENCES public.open_mics_historical(unique_identifier) ON DELETE CASCADE,
  planned_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, mic_unique_identifier, planned_date)
);

ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- Users can view their own plans
CREATE POLICY "Users can view own plans" ON public.user_plans
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own plans
CREATE POLICY "Users can insert own plans" ON public.user_plans
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own plans
CREATE POLICY "Users can update own plans" ON public.user_plans
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own plans
CREATE POLICY "Users can delete own plans" ON public.user_plans
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins full access to user_plans" ON public.user_plans
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));
