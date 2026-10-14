-- What a comedian actually spends to do open mics in a week: covers, drinks,
-- the whole night. Asked once at signup, alongside years doing comedy.
--
-- Whole dollars, not cents. This is a self-reported estimate off a slider, so
-- storing it to the penny would imply a precision the answer does not have.
-- NULL means never asked or skipped.
--
-- No new RLS. "Users can update their own profile (except admin status)"
-- already covers this column, and it is not isadmin.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_mic_spend_usd integer;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_weekly_mic_spend_usd_sane;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_weekly_mic_spend_usd_sane
  CHECK (weekly_mic_spend_usd IS NULL OR (weekly_mic_spend_usd >= 0 AND weekly_mic_spend_usd <= 1000));

COMMENT ON COLUMN public.profiles.weekly_mic_spend_usd IS
  'Self-reported weekly spend on open mics in whole dollars. The signup slider tops out at 150, where 150 means "150 or more".';
