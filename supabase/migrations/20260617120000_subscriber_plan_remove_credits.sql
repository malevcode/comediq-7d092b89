-- Replace credit-based subscriptions with a single $20/mo subscriber plan.
-- Removes the credit system entirely.

-- 1. Migrate any existing standard/premium users to free
UPDATE public.profiles
  SET subscription_plan = 'free'
  WHERE subscription_plan IN ('standard', 'premium');

-- 2. Replace the CHECK constraint to allow only free | subscriber
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_subscription_plan_check
  CHECK (subscription_plan IN ('free', 'subscriber'));

-- 3. Drop credit-related RPC functions
DROP FUNCTION IF EXISTS public.spend_credit(uuid, text);
DROP FUNCTION IF EXISTS public.admin_add_credits(uuid, integer, text, text, text);

-- 4. Drop credit transactions table
DROP TABLE IF EXISTS public.credit_transactions;

-- 5. Drop credits_balance column from profiles
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS credits_balance;
