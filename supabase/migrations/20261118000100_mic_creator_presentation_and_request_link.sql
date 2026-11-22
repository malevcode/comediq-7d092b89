-- Lets a mic's creator edit the presentation half of their own listing, and
-- lets a change request point at the mic it is changing.
--
-- Background: open_mics_historical already allows a logged-in user to INSERT
-- their own mic (policy users_can_insert_trial_open_mics: creator_id =
-- auth.uid() AND status = 'trial'), and only admins may UPDATE or DELETE
-- (admins_can_update_open_mics / admins_can_delete_open_mics). That split is
-- deliberate and stays exactly as it is.
--
-- The v3 host Manage screens need two things on top of it:
--
--   1. The spec's save rule says banner, map icon, tags and description go
--      live immediately, while venue, day, time, price and signup method wait
--      for admin approval. So the creator needs a way to change those four
--      columns and nothing else. Rather than granting them UPDATE on the
--      table and trying to fence it off, this adds one SECURITY DEFINER
--      function that can only ever touch those four columns. No new UPDATE
--      policy is created, so a creator still cannot UPDATE the table
--      directly.
--
--   2. open_mics_requests had no column linking a request to an existing mic,
--      so an edit request could not be told apart from a brand new mic
--      submission. This adds a nullable mic_id for that.
--
-- ADD ONLY. No DROP, no DELETE, no TRUNCATE, and the one UPDATE is inside the
-- function, scoped by a WHERE on a single unique_identifier.

-- ---------------------------------------------------------------------------
-- 1. Columns the designs need and the table does not have yet.
-- ---------------------------------------------------------------------------

-- The square banner at the top of a listing already exists as
-- cover_image_url, so only these three are new.
ALTER TABLE "public"."open_mics_historical"
  ADD COLUMN IF NOT EXISTS "map_icon_url" "text",
  ADD COLUMN IF NOT EXISTS "tags" "text"[],
  ADD COLUMN IF NOT EXISTS "description" "text";

COMMENT ON COLUMN "public"."open_mics_historical"."map_icon_url" IS
  'Circular image for the mic''s bubble on the map. Editable by the mic''s creator through update_own_mic_presentation_v1.';
COMMENT ON COLUMN "public"."open_mics_historical"."tags" IS
  'Short host-written labels, e.g. {"Free with Comediq","1 drink min"}. Editable by the creator.';
COMMENT ON COLUMN "public"."open_mics_historical"."description" IS
  'Host-written blurb shown on the listing. Editable by the creator. Distinct from other_rules, which is the house rules text.';

-- ---------------------------------------------------------------------------
-- 2. Link a change request to the mic it is about.
-- ---------------------------------------------------------------------------

ALTER TABLE "public"."open_mics_requests"
  ADD COLUMN IF NOT EXISTS "mic_id" "text";

COMMENT ON COLUMN "public"."open_mics_requests"."mic_id" IS
  'open_mics_historical.unique_identifier this request wants to change. NULL means the request is a brand new mic submission.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "pg_constraint" WHERE "conname" = 'open_mics_requests_mic_id_fkey'
  ) THEN
    ALTER TABLE "public"."open_mics_requests"
      ADD CONSTRAINT "open_mics_requests_mic_id_fkey"
      FOREIGN KEY ("mic_id")
      REFERENCES "public"."open_mics_historical"("unique_identifier")
      ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "open_mics_requests_mic_id_idx"
  ON "public"."open_mics_requests" ("mic_id");

-- Reading your own requests is what the Manage tab's Pending side shows.
-- The policy users_can_read_own_mic_requests already allows it and the
-- authenticated role already holds SELECT on the table, so nothing to add.

-- ---------------------------------------------------------------------------
-- 3. The creator-only presentation update.
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER so it can write past the admin-only UPDATE policy, but it
-- names the four columns itself, so there is no path from here to venue, day,
-- time, price, signup method or status. A NULL argument leaves that column
-- alone, which is why every parameter defaults to NULL.
--
-- Named _v1 and created only if absent, rather than CREATE OR REPLACE, so an
-- existing function is never overwritten. A future change adds _v2 beside it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "pg_proc" "p"
    JOIN "pg_namespace" "n" ON "n"."oid" = "p"."pronamespace"
    WHERE "n"."nspname" = 'public' AND "p"."proname" = 'update_own_mic_presentation_v1'
  ) THEN
    CREATE FUNCTION "public"."update_own_mic_presentation_v1"(
      "p_mic_id" "text",
      "p_cover_image_url" "text" DEFAULT NULL,
      "p_map_icon_url" "text" DEFAULT NULL,
      "p_tags" "text"[] DEFAULT NULL,
      "p_description" "text" DEFAULT NULL
    ) RETURNS "void"
      LANGUAGE "plpgsql"
      SECURITY DEFINER
      SET "search_path" = 'public'
    AS $fn$
    DECLARE
      v_creator uuid;
    BEGIN
      IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sign in to edit a listing.';
      END IF;

      SELECT creator_id INTO v_creator
      FROM public.open_mics_historical
      WHERE unique_identifier = p_mic_id;

      IF v_creator IS NULL THEN
        RAISE EXCEPTION 'That mic does not exist, or it has no creator.';
      END IF;

      -- Admins keep their own table-level policy; this function is only the
      -- creator's door, so it does not special-case them.
      IF v_creator <> auth.uid() THEN
        RAISE EXCEPTION 'You can only edit a listing you created.';
      END IF;

      -- Scoped UPDATE: one row, four presentation columns, and COALESCE so a
      -- NULL argument leaves the stored value alone rather than clearing it.
      UPDATE public.open_mics_historical
      SET
        cover_image_url = COALESCE(p_cover_image_url, cover_image_url),
        map_icon_url    = COALESCE(p_map_icon_url, map_icon_url),
        tags            = COALESCE(p_tags, tags),
        description     = COALESCE(p_description, description)
      WHERE unique_identifier = p_mic_id;
    END
    $fn$;
  END IF;
END
$$;

GRANT EXECUTE ON FUNCTION "public"."update_own_mic_presentation_v1"("text", "text", "text", "text"[], "text") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."update_own_mic_presentation_v1"("text", "text", "text", "text"[], "text") TO "service_role";

COMMENT ON FUNCTION "public"."update_own_mic_presentation_v1"("text", "text", "text", "text"[], "text") IS
  'Creator-only edit of a mic''s banner, map icon, tags and description. Anything that changes what a comic turns up to - venue, day, time, price, signup method - has to go through open_mics_requests for admin approval instead.';
