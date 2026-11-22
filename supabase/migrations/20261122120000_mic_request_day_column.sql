-- One column `open_mics_requests` is missing: the day a host wants a mic
-- moved to.
--
-- Background: a host editing a live listing files the "needs approval" half
-- of the change into `open_mics_requests` (SPEC.md's save rule - venue, day,
-- time, price and signup method wait for an admin; banner, icon, tags,
-- description and skipped dates go live at once).
--
-- `open_mics_requests` already carries venue_name, location, time,
-- latest_end_time, frequency, frequency_custom_text, cost, signup_method,
-- signup_url and sign_up_instructions. It has `date` (a one-off show's date)
-- but no `day`, so "move this mic from Thursdays to Wednesdays" had nowhere
-- structured to go - it would have had to be squeezed into a free-text column
-- an admin then has to read and interpret.
--
-- `open_mics_historical.day` is plain text holding the full weekday name
-- ("Thursday"), so this matches it rather than introducing an enum.
--
-- Additive and idempotent. Nothing is removed or rewritten.

ALTER TABLE "public"."open_mics_requests"
  ADD COLUMN IF NOT EXISTS "day" "text";

COMMENT ON COLUMN "public"."open_mics_requests"."day" IS
  'Requested weekday, full name, e.g. "Thursday". Matches open_mics_historical.day. NULL means the request does not change the day.';
