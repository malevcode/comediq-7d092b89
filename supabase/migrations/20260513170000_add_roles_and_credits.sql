-- Add user roles, subscription plan, and credits balance to profiles.
-- role: null = not yet onboarded (triggers onboarding flow on next login)
-- subscription_plan: free | premium
-- credits_balance: paid credits for mic signups (distinct from gamification points_balance)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT
    CHECK (role IN ('performer', 'host', 'showrunner', 'admin')),
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_plan IN ('free', 'premium')),
  ADD COLUMN IF NOT EXISTS credits_balance INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- RLS: users can read their own role and plan; admins can read all
CREATE POLICY IF NOT EXISTS "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
