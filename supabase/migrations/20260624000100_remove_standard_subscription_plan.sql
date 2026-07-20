UPDATE public.profiles
SET subscription_plan = 'premium'
WHERE subscription_plan = 'standard';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_plan_check
  CHECK (subscription_plan IN ('free', 'premium'));
