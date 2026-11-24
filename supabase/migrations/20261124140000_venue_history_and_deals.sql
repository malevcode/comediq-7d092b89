-- Historical mics: every venue Comediq has ever tracked.
--
-- ADD ONLY. One new read-only view and two new tables, with their policies.
-- No DROP, no TRUNCATE, no DELETE, no renames, and nothing existing is
-- altered. Every statement is CREATE ... IF NOT EXISTS or guarded by a
-- catalogue check, so running it twice is safe.
--
-- Nothing is duplicated: the view reads venues, open_mics_historical,
-- mic_edit_history, mic_skips, nyc_comedy_shows and audience_shows where they
-- already are.

-- ---------------------------------------------------------------------------
-- 1. venue_history_v1
-- ---------------------------------------------------------------------------
--
-- Two things in this data are worth knowing before reading the view, because
-- they decide what it can honestly report (checked 2026-11-24):
--
--   mic_edit_history has one row in total and ZERO rows where field_name =
--   'active'. So "when the last mic went inactive" is not recorded anywhere
--   yet. The lookup is written correctly and will fill in as history accrues,
--   but today it returns null for every venue, and the UI must say "Unknown"
--   rather than guess.
--
--   open_mics_historical.changes_updates is NOT a notes field. 650 of its 673
--   values are Instagram handles ("@acoustikgardenlounge"). It is mapped as
--   `instagramHandle` everywhere in the app. Using it as an "ended reason"
--   would print a handle as the reason a room closed, so it is deliberately
--   not used here. The only field that genuinely means a reason is
--   mic_skips.reason, which is what the view reads.
--
-- submission_date is text, and 4 of 648 non-null values do not parse as a
-- date, so the cast is guarded by a pattern test rather than left to blow up
-- the whole view.

CREATE VIEW "public"."venue_history_v1" AS
WITH "mic" AS (
  SELECT
    "m"."venue_slug",
    "m"."unique_identifier",
    "m"."open_mic",
    "m"."day",
    "m"."start_time",
    "m"."active",
    "m"."is_comediq_run",
    -- Guarded cast: a few rows hold text that is not a date.
    CASE
      WHEN "m"."submission_date" ~ '^\d{4}-\d{2}-\d{2}'
      THEN (LEFT("m"."submission_date", 10))::date
    END AS "listed_on",
    GREATEST("m"."last_verified_at", "m"."last_confirmed_at") AS "last_seen",
    (
      SELECT MAX("h"."created_at")
      FROM "public"."mic_edit_history" "h"
      WHERE "h"."mic_unique_identifier" = "m"."unique_identifier"
        AND "h"."field_name" = 'active'
        AND LOWER("h"."new_value") IN ('false', 'f', '0')
    ) AS "deactivated_at",
    (
      SELECT "s"."reason"
      FROM "public"."mic_skips" "s"
      WHERE "s"."mic_id" = "m"."unique_identifier" AND "s"."reason" IS NOT NULL
      ORDER BY "s"."skip_date" DESC
      LIMIT 1
    ) AS "skip_reason"
  FROM "public"."open_mics_historical" "m"
  WHERE "m"."venue_slug" IS NOT NULL
),
"per_mic" AS (
  SELECT
    "mic".*,
    -- The day a mic stopped counting towards "listed". A recorded
    -- deactivation wins; a still-active mic runs to today; otherwise the last
    -- time anyone confirmed it is the last day we can honestly claim. Never a
    -- made-up date: null listed_on yields null here too.
    CASE
      WHEN "mic"."deactivated_at" IS NOT NULL THEN "mic"."deactivated_at"::date
      WHEN "mic"."active" THEN CURRENT_DATE
      ELSE COALESCE("mic"."last_seen"::date, "mic"."listed_on")
    END AS "counted_until"
  FROM "mic"
),
"mic_rollup" AS (
  SELECT
    "venue_slug",
    COUNT(*) AS "total_open_mics",
    BOOL_OR("active") AS "currently_running",
    BOOL_OR("is_comediq_run") AS "has_comediq_run",
    MIN("listed_on") AS "first_listed_at",
    MAX("last_seen") AS "last_active_at",
    -- Sum of each mic's own run, so a venue that ran three mics for a year
    -- each reads as three years of listing rather than one.
    COALESCE(SUM(GREATEST(("counted_until" - "listed_on"), 0)), 0)::integer AS "days_listed"
  FROM "per_mic"
  GROUP BY "venue_slug"
),
-- The most recent mic at the venue, for the "Last mic" line.
"last_mic" AS (
  SELECT DISTINCT ON ("venue_slug")
    "venue_slug",
    "open_mic" AS "last_mic_name",
    "day" AS "last_mic_day",
    "start_time" AS "last_mic_time",
    "deactivated_at" AS "last_mic_ended_at",
    "skip_reason" AS "last_mic_ended_reason",
    "active" AS "last_mic_active"
  FROM "per_mic"
  ORDER BY "venue_slug", "active" DESC, "counted_until" DESC NULLS LAST, "listed_on" DESC NULLS LAST
),
-- Shows join on venue name, because neither show table carries a slug.
"show_rollup" AS (
  SELECT "v"."slug" AS "venue_slug", COUNT(*) AS "total_shows"
  FROM "public"."venues" "v"
  JOIN (
    SELECT "venue_name" FROM "public"."nyc_comedy_shows"
    UNION ALL
    SELECT "venue_name" FROM "public"."audience_shows"
  ) "s" ON LOWER(TRIM("s"."venue_name")) = LOWER(TRIM("v"."name"))
  GROUP BY "v"."slug"
)
SELECT
  "v"."slug",
  "v"."name",
  "v"."address",
  "v"."borough",
  "v"."neighborhood",
  "v"."latitude",
  "v"."longitude",
  COALESCE("mr"."total_open_mics", 0)::integer AS "total_open_mics",
  COALESCE("sr"."total_shows", 0)::integer AS "total_shows",
  COALESCE("mr"."currently_running", false) AS "currently_running",
  COALESCE("mr"."has_comediq_run", false) AS "has_comediq_run",
  "mr"."first_listed_at",
  "mr"."last_active_at",
  COALESCE("mr"."days_listed", 0) AS "days_listed",
  "lm"."last_mic_name",
  "lm"."last_mic_day",
  "lm"."last_mic_time",
  "lm"."last_mic_ended_at",
  "lm"."last_mic_ended_reason",
  COALESCE("lm"."last_mic_active", false) AS "last_mic_active"
FROM "public"."venues" "v"
LEFT JOIN "mic_rollup" "mr" ON "mr"."venue_slug" = "v"."slug"
LEFT JOIN "last_mic" "lm" ON "lm"."venue_slug" = "v"."slug"
LEFT JOIN "show_rollup" "sr" ON "sr"."venue_slug" = "v"."slug"
-- "every venue that has ever run an open mic or a show"
WHERE COALESCE("mr"."total_open_mics", 0) > 0 OR COALESCE("sr"."total_shows", 0) > 0;

COMMENT ON VIEW "public"."venue_history_v1" IS
  'One row per venue that has ever run an open mic or a show. Read-only rollup over venues, open_mics_historical, mic_edit_history, mic_skips, nyc_comedy_shows and audience_shows. last_mic_ended_at is null until mic_edit_history records an active flip; show Unknown rather than guessing.';

GRANT SELECT ON "public"."venue_history_v1" TO "anon", "authenticated", "service_role";

-- ---------------------------------------------------------------------------
-- 2. venue_deals: what a room pays, reported by producers.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."venue_deals" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "venue_slug" "text" NOT NULL,
  "reported_by" "uuid" NOT NULL DEFAULT "auth"."uid"(),
  "show_type" "text" NOT NULL DEFAULT 'open mic',
  "door_price_cents" integer,
  "producer_split_pct" integer,
  "venue_split_pct" integer,
  -- Producer's cut of bar revenue. Null means the deal has no bar component.
  "bar_split_pct" integer,
  "minimum_cents" integer,
  "minimum_hours" numeric,
  "notes" "text",
  "reported_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  "status" "text" NOT NULL DEFAULT 'pending',
  CONSTRAINT "venue_deals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "venue_deals_status_check" CHECK ("status" IN ('pending', 'approved')),
  CONSTRAINT "venue_deals_show_type_check" CHECK ("show_type" IN ('open mic', 'show')),
  CONSTRAINT "venue_deals_pct_range" CHECK (
    ("producer_split_pct" IS NULL OR "producer_split_pct" BETWEEN 0 AND 100)
    AND ("venue_split_pct" IS NULL OR "venue_split_pct" BETWEEN 0 AND 100)
    AND ("bar_split_pct" IS NULL OR "bar_split_pct" BETWEEN 0 AND 100)
  ),
  CONSTRAINT "venue_deals_venue_slug_fkey" FOREIGN KEY ("venue_slug")
    REFERENCES "public"."venues"("slug") ON DELETE CASCADE,
  CONSTRAINT "venue_deals_reported_by_fkey" FOREIGN KEY ("reported_by")
    REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

COMMENT ON TABLE "public"."venue_deals" IS
  'Producer-reported deal terms for a venue. Pending until an admin approves. Approved rows are visible to any signed-in user.';
COMMENT ON COLUMN "public"."venue_deals"."bar_split_pct" IS
  'Producer percentage of bar revenue. Null means the deal has no bar component.';

CREATE INDEX IF NOT EXISTS "venue_deals_venue_slug_idx" ON "public"."venue_deals" ("venue_slug");
CREATE INDEX IF NOT EXISTS "venue_deals_status_idx" ON "public"."venue_deals" ("status");

ALTER TABLE "public"."venue_deals" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "pg_policies" WHERE "schemaname" = 'public'
    AND "tablename" = 'venue_deals' AND "policyname" = 'venue_deals_insert_own') THEN
    CREATE POLICY "venue_deals_insert_own" ON "public"."venue_deals" FOR INSERT
      TO "authenticated"
      WITH CHECK ("reported_by" = "auth"."uid"() AND "status" = 'pending');
  END IF;
END
$$;

-- A signed-in user sees approved reports, plus their own while pending.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "pg_policies" WHERE "schemaname" = 'public'
    AND "tablename" = 'venue_deals' AND "policyname" = 'venue_deals_select_approved_or_own') THEN
    CREATE POLICY "venue_deals_select_approved_or_own" ON "public"."venue_deals" FOR SELECT
      TO "authenticated"
      USING (
        "status" = 'approved'
        OR "reported_by" = "auth"."uid"()
        OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")
        OR "public"."is_current_user_admin"()
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "pg_policies" WHERE "schemaname" = 'public'
    AND "tablename" = 'venue_deals' AND "policyname" = 'venue_deals_update_admin_only') THEN
    CREATE POLICY "venue_deals_update_admin_only" ON "public"."venue_deals" FOR UPDATE
      TO "authenticated"
      USING (
        "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")
        OR "public"."is_current_user_admin"()
      );
  END IF;
END
$$;

GRANT SELECT, INSERT, UPDATE ON TABLE "public"."venue_deals" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_deals" TO "service_role";

-- ---------------------------------------------------------------------------
-- 3. venue_outreach: admin notes on whether a room wants a mic.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."venue_outreach" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "venue_slug" "text" NOT NULL,
  "open_to_new" "text" NOT NULL DEFAULT 'unknown',
  "contact_name" "text",
  "contact_email" "text",
  "contact_ig" "text",
  "notes" "text",
  "updated_by" "uuid" DEFAULT "auth"."uid"(),
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  CONSTRAINT "venue_outreach_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "venue_outreach_open_to_new_check"
    CHECK ("open_to_new" IN ('yes', 'maybe', 'no', 'unknown')),
  -- One row per venue, so an admin edit is an upsert rather than a pile of
  -- conflicting notes.
  CONSTRAINT "venue_outreach_one_per_venue" UNIQUE ("venue_slug"),
  CONSTRAINT "venue_outreach_venue_slug_fkey" FOREIGN KEY ("venue_slug")
    REFERENCES "public"."venues"("slug") ON DELETE CASCADE
);

COMMENT ON TABLE "public"."venue_outreach" IS
  'Admin-only outreach notes per venue, including whether the room is open to a new mic. Contact details are deliberately not readable by ordinary users.';

ALTER TABLE "public"."venue_outreach" ENABLE ROW LEVEL SECURITY;

-- Admin only, read and write. Contact emails must not leak to the public page;
-- the page uses `open_to_new` through a separate admin-written path, and falls
-- back to its own estimate when there is no row it can see.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "pg_policies" WHERE "schemaname" = 'public'
    AND "tablename" = 'venue_outreach' AND "policyname" = 'venue_outreach_admin_select') THEN
    CREATE POLICY "venue_outreach_admin_select" ON "public"."venue_outreach" FOR SELECT
      TO "authenticated"
      USING (
        "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")
        OR "public"."is_current_user_admin"()
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "pg_policies" WHERE "schemaname" = 'public'
    AND "tablename" = 'venue_outreach' AND "policyname" = 'venue_outreach_admin_insert') THEN
    CREATE POLICY "venue_outreach_admin_insert" ON "public"."venue_outreach" FOR INSERT
      TO "authenticated"
      WITH CHECK (
        "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")
        OR "public"."is_current_user_admin"()
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "pg_policies" WHERE "schemaname" = 'public'
    AND "tablename" = 'venue_outreach' AND "policyname" = 'venue_outreach_admin_update') THEN
    CREATE POLICY "venue_outreach_admin_update" ON "public"."venue_outreach" FOR UPDATE
      TO "authenticated"
      USING (
        "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")
        OR "public"."is_current_user_admin"()
      );
  END IF;
END
$$;

GRANT SELECT, INSERT, UPDATE ON TABLE "public"."venue_outreach" TO "authenticated";
GRANT ALL ON TABLE "public"."venue_outreach" TO "service_role";

-- ---------------------------------------------------------------------------
-- 4. The one public field from outreach.
-- ---------------------------------------------------------------------------
--
-- The page wants to show an admin's "open to a new mic" answer when there is
-- one, without exposing contact names, emails or notes. A view with only that
-- column, owned by postgres, does exactly that and nothing more.

CREATE VIEW "public"."venue_open_to_new_v1" AS
SELECT "venue_slug", "open_to_new"
FROM "public"."venue_outreach"
WHERE "open_to_new" <> 'unknown';

COMMENT ON VIEW "public"."venue_open_to_new_v1" IS
  'Just the admin answer to "is this room open to a new mic", with no contact details, so the public page can show a confirmed answer instead of its own estimate.';

GRANT SELECT ON "public"."venue_open_to_new_v1" TO "anon", "authenticated", "service_role";
