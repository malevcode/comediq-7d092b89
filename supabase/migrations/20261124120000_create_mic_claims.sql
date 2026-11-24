-- Claiming a mic: a host says "these rooms are mine", an admin approves.
--
-- Background. There are already two ways a mic ends up attached to a person:
--
--   open_mics_historical.creator_id   the person who listed it. This is what
--                                     the host Manage tab reads, so it is what
--                                     makes a mic editable by its host.
--   mic_hosts                         the older claim table, 47 rows, with
--                                     is_verified as its pending flag. It
--                                     grants hosting but does NOT set
--                                     creator_id, so a mic claimed that way
--                                     never shows up in Manage.
--
-- That gap is what this adds: a claim queue whose approval sets creator_id, so
-- an approved claim actually lands in the host's Manage tab. mic_hosts and
-- claim_mic_hosts are untouched and keep working.
--
-- ADD ONLY. No DROP, no DELETE, no TRUNCATE, no renames. Policies and the
-- function use new names rather than replacing anything, and every statement
-- is either CREATE ... IF NOT EXISTS or guarded by a catalogue check, so
-- running this twice is safe.

-- ---------------------------------------------------------------------------
-- 1. The claims table.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."mic_claims" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "mic_id" "text" NOT NULL,
  "user_id" "uuid" NOT NULL DEFAULT "auth"."uid"(),
  -- text plus a CHECK rather than a new enum type: one fewer object to
  -- migrate, and the three values are not going to grow.
  "status" "text" NOT NULL DEFAULT 'pending',
  "note" "text",
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  CONSTRAINT "mic_claims_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "mic_claims_status_check"
    CHECK ("status" IN ('pending', 'approved', 'rejected')),
  CONSTRAINT "mic_claims_mic_id_fkey" FOREIGN KEY ("mic_id")
    REFERENCES "public"."open_mics_historical"("unique_identifier") ON DELETE CASCADE,
  CONSTRAINT "mic_claims_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  -- One live claim per person per mic. Re-claiming the same mic is a mistake,
  -- and this is what makes the claim screen safe to submit twice.
  CONSTRAINT "mic_claims_one_per_user_per_mic" UNIQUE ("mic_id", "user_id")
);

COMMENT ON TABLE "public"."mic_claims" IS
  'Host claims on mics, pending an admin. Approving sets open_mics_historical.creator_id, which is what puts the mic in the host Manage tab.';
COMMENT ON COLUMN "public"."mic_claims"."note" IS
  'Optional message from the claimer, e.g. how to verify they host it.';

CREATE INDEX IF NOT EXISTS "mic_claims_user_id_idx" ON "public"."mic_claims" ("user_id");
CREATE INDEX IF NOT EXISTS "mic_claims_mic_id_idx" ON "public"."mic_claims" ("mic_id");
CREATE INDEX IF NOT EXISTS "mic_claims_status_idx" ON "public"."mic_claims" ("status");

ALTER TABLE "public"."mic_claims" ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. Policies. Created only if absent, never dropped and recreated.
-- ---------------------------------------------------------------------------

-- A signed-in user files their own claims, and only their own.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "pg_policies" WHERE "schemaname" = 'public'
      AND "tablename" = 'mic_claims' AND "policyname" = 'mic_claims_insert_own'
  ) THEN
    CREATE POLICY "mic_claims_insert_own"
      ON "public"."mic_claims" FOR INSERT
      TO "authenticated"
      WITH CHECK ("user_id" = "auth"."uid"() AND "status" = 'pending');
  END IF;
END
$$;

-- You can read your own claims; an admin reads all of them.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "pg_policies" WHERE "schemaname" = 'public'
      AND "tablename" = 'mic_claims' AND "policyname" = 'mic_claims_select_own_or_admin'
  ) THEN
    CREATE POLICY "mic_claims_select_own_or_admin"
      ON "public"."mic_claims" FOR SELECT
      TO "authenticated"
      USING (
        "user_id" = "auth"."uid"()
        OR "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")
        OR "public"."is_current_user_admin"()
      );
  END IF;
END
$$;

-- Only an admin changes a claim's status. There is deliberately no DELETE
-- policy: a decided claim is a record, not something to clear away.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "pg_policies" WHERE "schemaname" = 'public'
      AND "tablename" = 'mic_claims' AND "policyname" = 'mic_claims_update_admin_only'
  ) THEN
    CREATE POLICY "mic_claims_update_admin_only"
      ON "public"."mic_claims" FOR UPDATE
      TO "authenticated"
      USING (
        "public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")
        OR "public"."is_current_user_admin"()
      );
  END IF;
END
$$;

GRANT SELECT, INSERT, UPDATE ON TABLE "public"."mic_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."mic_claims" TO "service_role";

-- ---------------------------------------------------------------------------
-- 3. Approving a claim, in one step.
-- ---------------------------------------------------------------------------

-- Approving means two writes that must not come apart: mark the claim
-- approved, and set the mic's creator_id to the claimer. Doing it in the
-- client would leave a mic approved but unowned if the second call failed.
--
-- Takes an array so one claim and "approve all from this user" are the same
-- call. Returns how many claims it approved.
--
-- Named _v1 and created only if absent, so nothing existing is replaced.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "pg_proc" "p"
    JOIN "pg_namespace" "n" ON "n"."oid" = "p"."pronamespace"
    WHERE "n"."nspname" = 'public' AND "p"."proname" = 'approve_mic_claims_v1'
  ) THEN
    CREATE FUNCTION "public"."approve_mic_claims_v1"("p_claim_ids" "uuid"[])
      RETURNS integer
      LANGUAGE "plpgsql"
      SECURITY DEFINER
      SET "search_path" = 'public'
    AS $fn$
    DECLARE
      v_claim record;
      v_count integer := 0;
    BEGIN
      IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sign in first.';
      END IF;

      IF NOT (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR public.is_current_user_admin()
      ) THEN
        RAISE EXCEPTION 'Only an admin can approve a claim.';
      END IF;

      FOR v_claim IN
        SELECT id, mic_id, user_id
        FROM public.mic_claims
        WHERE id = ANY(p_claim_ids) AND status = 'pending'
      LOOP
        -- Scoped UPDATEs: one claim row, and one mic row by its own id.
        UPDATE public.mic_claims
        SET status = 'approved'
        WHERE id = v_claim.id;

        -- This is the point of the whole feature: creator_id is what the host
        -- Manage tab reads. COALESCE so an existing owner is never overwritten
        -- by a later claim - that case needs a human, not a silent handover.
        UPDATE public.open_mics_historical
        SET creator_id = COALESCE(creator_id, v_claim.user_id)
        WHERE unique_identifier = v_claim.mic_id;

        v_count := v_count + 1;
      END LOOP;

      RETURN v_count;
    END
    $fn$;
  END IF;
END
$$;

GRANT EXECUTE ON FUNCTION "public"."approve_mic_claims_v1"("uuid"[]) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."approve_mic_claims_v1"("uuid"[]) TO "service_role";

COMMENT ON FUNCTION "public"."approve_mic_claims_v1"("uuid"[]) IS
  'Admin-only. Marks each pending claim approved and sets the mic''s creator_id to the claimer, so the mic appears in their Manage tab. Never overwrites an existing creator_id.';
