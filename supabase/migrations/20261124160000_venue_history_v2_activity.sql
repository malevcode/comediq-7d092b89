-- Activity status for the Historical mics map.
--
-- The map colours each venue by how alive it is. venue_history_v1 does not
-- carry the two facts that decision needs, so this adds a second view beside
-- it with those two extra columns.
--
-- ADD ONLY. venue_history_v1 is untouched and still works; this is a new
-- object, not a replacement. No DROP, no rename, no CREATE OR REPLACE.
--
-- Why a new view rather than altering the old one: adding a column to a view
-- means replacing it, and the rule here is add-only. v2 is the one the page
-- reads; v1 stays for anything else that already depends on it.

CREATE VIEW "public"."venue_history_v2" AS
SELECT
  "h".*,
  -- Does this room take sign-ups through Comediq? Read from the mics that are
  -- actually running, because a long-dead mic that once used Comediq slots
  -- says nothing about the room today.
  COALESCE((
    SELECT BOOL_OR(
      "m"."signup_method"::text = 'comediq_slots' OR COALESCE("m"."slots_enabled", false)
    )
    FROM "public"."open_mics_historical" "m"
    WHERE "m"."venue_slug" = "h"."slug" AND "m"."active"
  ), false) AS "comediq_signup",
  -- The last time anyone confirmed one of the venue's RUNNING mics.
  -- venue_history_v1.last_active_at is the maximum across every mic ever at
  -- the venue, which is the right number for history but the wrong one for
  -- "is this still true", because a dead mic's old confirmation would make a
  -- stale room look fresh.
  (
    SELECT MAX(GREATEST("m"."last_verified_at", "m"."last_confirmed_at"))
    FROM "public"."open_mics_historical" "m"
    WHERE "m"."venue_slug" = "h"."slug" AND "m"."active"
  ) AS "active_last_verified_at"
FROM "public"."venue_history_v1" "h";

COMMENT ON VIEW "public"."venue_history_v2" IS
  'venue_history_v1 plus the two fields the map colours by: whether a running mic takes Comediq sign-ups, and when a running mic was last confirmed. v1 is unchanged and still valid.';

GRANT SELECT ON "public"."venue_history_v2" TO "anon", "authenticated", "service_role";
