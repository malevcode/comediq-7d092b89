-- Onboarding asks one question at signup: are you a comedian?
--
-- NULL means we have not asked yet, which is what drives the prompt. Once the
-- answer is in, true or false, the prompt never appears again. years_performing
-- already exists on this table and holds the follow-up answer, 0 through 10,
-- where 10 stands for "10 or more".
--
-- No new RLS is needed. "Users can update their own profile (except admin
-- status)" already covers this column, and it is not isadmin, so the existing
-- WITH CHECK leaves it writable by its owner.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_comedian boolean;

COMMENT ON COLUMN public.profiles.is_comedian IS
  'Signup answer. NULL means not asked yet, which is what triggers the prompt.';
