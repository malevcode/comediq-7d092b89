-- One night off, without taking the listing down.
--
-- A recurring mic sometimes skips a date: a holiday, the host is away, the
-- venue is shut. Before this there was nowhere to record that, so the only
-- way to express it was to deactivate the whole mic.
--
-- Read by everyone, because the map and the listings have to hide a skipped
-- date for every visitor, not just the host. Written only by the mic's
-- creator or an admin.
--
-- ADD ONLY. No DROP, no DELETE, no UPDATE. Every statement is either
-- CREATE ... IF NOT EXISTS or guarded by a catalogue check, so running it
-- twice is safe and nothing existing is touched.

CREATE TABLE IF NOT EXISTS "public"."mic_skips" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "mic_id" "text" NOT NULL,
  "skip_date" "date" NOT NULL,
  "reason" "text",
  "created_by" "uuid" DEFAULT "auth"."uid"(),
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  CONSTRAINT "mic_skips_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "mic_skips_mic_id_fkey" FOREIGN KEY ("mic_id")
    REFERENCES "public"."open_mics_historical"("unique_identifier") ON DELETE CASCADE,
  CONSTRAINT "mic_skips_created_by_fkey" FOREIGN KEY ("created_by")
    REFERENCES "auth"."users"("id") ON DELETE SET NULL,
  -- A date is either skipped or it is not; saying so twice is a mistake, and
  -- the unique constraint is what makes "tap to un-skip" idempotent.
  CONSTRAINT "mic_skips_unique_per_date" UNIQUE ("mic_id", "skip_date")
);

COMMENT ON TABLE "public"."mic_skips" IS
  'Dates a recurring mic is not happening. Hidden from the map and from listings on that date.';
COMMENT ON COLUMN "public"."mic_skips"."reason" IS
  'Optional, shown to comics, e.g. Holiday / Host away / Venue closed / Other.';

CREATE INDEX IF NOT EXISTS "mic_skips_mic_id_idx" ON "public"."mic_skips" ("mic_id");
CREATE INDEX IF NOT EXISTS "mic_skips_skip_date_idx" ON "public"."mic_skips" ("skip_date");

ALTER TABLE "public"."mic_skips" ENABLE ROW LEVEL SECURITY;

-- Policies are created only if absent, rather than dropped and recreated, so
-- an existing policy of the same name is left exactly as it is.

-- Everyone can see that a date is off, signed in or not. A comic turning up
-- to a cancelled mic is the whole problem this table exists to prevent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "pg_policies"
    WHERE "schemaname" = 'public' AND "tablename" = 'mic_skips'
      AND "policyname" = 'mic_skips_select_anyone'
  ) THEN
    CREATE POLICY "mic_skips_select_anyone"
      ON "public"."mic_skips" FOR SELECT
      TO "authenticated", "anon"
      USING (true);
  END IF;
END
$$;

-- Writers: the mic's creator, or an admin. The admin test is the same pair of
-- helpers every other policy in this schema uses, so admin behaviour stays
-- consistent.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "pg_policies"
    WHERE "schemaname" = 'public' AND "tablename" = 'mic_skips'
      AND "policyname" = 'mic_skips_insert_creator_or_admin'
  ) THEN
    CREATE POLICY "mic_skips_insert_creator_or_admin"
      ON "public"."mic_skips" FOR INSERT
      TO "authenticated"
      WITH CHECK (
        (
          EXISTS (
            SELECT 1 FROM "public"."open_mics_historical" "m"
            WHERE "m"."unique_identifier" = "mic_skips"."mic_id"
              AND "m"."creator_id" = "auth"."uid"()
          )
          AND "created_by" = "auth"."uid"()
        )
        OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")
        OR "public"."is_current_user_admin"()
      );
  END IF;
END
$$;

-- Un-skipping a date deletes that one skip row. This is the only DELETE the
-- feature performs, it is row-scoped by RLS to the mic's own creator, and it
-- removes a "this night is off" marker, never a mic, a signup or a set.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "pg_policies"
    WHERE "schemaname" = 'public' AND "tablename" = 'mic_skips'
      AND "policyname" = 'mic_skips_delete_creator_or_admin'
  ) THEN
    CREATE POLICY "mic_skips_delete_creator_or_admin"
      ON "public"."mic_skips" FOR DELETE
      TO "authenticated"
      USING (
        EXISTS (
          SELECT 1 FROM "public"."open_mics_historical" "m"
          WHERE "m"."unique_identifier" = "mic_skips"."mic_id"
            AND "m"."creator_id" = "auth"."uid"()
        )
        OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")
        OR "public"."is_current_user_admin"()
      );
  END IF;
END
$$;

-- No UPDATE policy is granted, so a skip row can never be rewritten in place.
-- Changing a reason is a delete plus an insert.

GRANT SELECT ON TABLE "public"."mic_skips" TO "anon";
GRANT SELECT, INSERT, DELETE ON TABLE "public"."mic_skips" TO "authenticated";
GRANT ALL ON TABLE "public"."mic_skips" TO "service_role";
