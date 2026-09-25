-- Signup now splits at the first question: comedian or audience member.
--
-- The two paths ask different things, so each gets the column it needs and
-- leaves the other NULL. A comedian has years_performing and
-- weekly_mic_spend_usd; an audience member has shows_seen_per_year. NULL on
-- any of them means it was never asked, which is different from zero.
--
-- No new RLS. "Users can update their own profile (except admin status)"
-- already covers both, and neither is isadmin.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shows_seen_per_year integer;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS affiliate_interested boolean;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_shows_seen_per_year_sane;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_shows_seen_per_year_sane
  CHECK (shows_seen_per_year IS NULL OR (shows_seen_per_year >= 0 AND shows_seen_per_year <= 500));

COMMENT ON COLUMN public.profiles.shows_seen_per_year IS
  'Audience answer. Comedy shows seen in a year; the signup slider tops out at 20, where 20 means "20 or more".';

COMMENT ON COLUMN public.profiles.affiliate_interested IS
  'Comedian opt-in: willing to post a Comediq story monthly to be considered for shows and bookings.';
