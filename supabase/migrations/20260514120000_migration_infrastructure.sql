-- Migration infrastructure: map old Clerk IDs → new Supabase UUIDs.
-- Run this BEFORE seeding data from the old project.
-- Dropped in Phase 8 cleanup after migration window closes.

CREATE TABLE IF NOT EXISTS public._migration_id_map (
  clerk_id             TEXT PRIMARY KEY,
  supabase_uuid        UUID,
  email                TEXT,
  phone                TEXT,
  stage_name           TEXT,
  bio                  TEXT,
  headshot_url         TEXT,
  username             TEXT,
  isadmin              BOOLEAN NOT NULL DEFAULT false,
  points_balance       INTEGER NOT NULL DEFAULT 0,
  years_performing     INTEGER,
  role                 TEXT,
  migrated_at          TIMESTAMPTZ,
  status               TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'matched', 'admin_forced'))
);

ALTER TABLE public._migration_id_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no_public_access" ON public._migration_id_map FOR ALL USING (false);

-- Trigger: fires when a new Supabase auth user is created.
-- If their email matches a pending migration entry, auto-applies old profile data
-- and remaps all child table rows from the old Clerk ID to the new UUID.
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mrow public._migration_id_map%ROWTYPE;
BEGIN
  -- Try email match first
  SELECT * INTO mrow
  FROM public._migration_id_map
  WHERE email = NEW.email AND status = 'pending'
  LIMIT 1;

  -- Fallback: phone match (for phone-only Clerk accounts)
  IF mrow.clerk_id IS NULL AND NEW.phone IS NOT NULL THEN
    SELECT * INTO mrow
    FROM public._migration_id_map
    WHERE phone = regexp_replace(NEW.phone, '^\+1', '')
      AND status = 'pending'
    LIMIT 1;
  END IF;

  IF mrow.clerk_id IS NOT NULL THEN
    -- Apply migrated profile
    INSERT INTO public.profiles (
      user_id, username, stage_name, bio, headshot_url, phone,
      isadmin, points_balance, years_performing, role,
      subscription_plan, credits_balance
    ) VALUES (
      NEW.id, mrow.username, mrow.stage_name, mrow.bio, mrow.headshot_url,
      mrow.phone, mrow.isadmin, mrow.points_balance, mrow.years_performing,
      mrow.role, 'free', 0
    )
    ON CONFLICT (user_id) DO UPDATE SET
      username         = EXCLUDED.username,
      stage_name       = EXCLUDED.stage_name,
      bio              = EXCLUDED.bio,
      headshot_url     = EXCLUDED.headshot_url,
      phone            = EXCLUDED.phone,
      isadmin          = EXCLUDED.isadmin,
      points_balance   = EXCLUDED.points_balance,
      years_performing = EXCLUDED.years_performing,
      role             = EXCLUDED.role;

    -- Remap child table rows
    UPDATE public.user_visits      SET user_id = NEW.id::text  WHERE user_id = mrow.clerk_id;
    UPDATE public.saved_mics       SET user_id = NEW.id::text  WHERE user_id = mrow.clerk_id;
    UPDATE public.mic_playlists    SET user_id = NEW.id::text  WHERE user_id = mrow.clerk_id;
    UPDATE public.mic_playlist_items SET user_id = NEW.id::text WHERE user_id = mrow.clerk_id;
    UPDATE public.mic_comments     SET user_id = NEW.id::text  WHERE user_id = mrow.clerk_id;
    UPDATE public.points_ledger    SET user_id = NEW.id        WHERE user_id::text = mrow.clerk_id;
    UPDATE public.comedian_social_links SET user_id = NEW.id   WHERE user_id::text = mrow.clerk_id;
    UPDATE public.recordings       SET user_id = NEW.id        WHERE user_id::text = mrow.clerk_id;
    UPDATE public.mic_signups      SET user_id = NEW.id        WHERE user_id::text = mrow.clerk_id;

    -- Mark matched
    UPDATE public._migration_id_map
    SET supabase_uuid = NEW.id, status = 'matched', migrated_at = now()
    WHERE clerk_id = mrow.clerk_id;

  ELSE
    -- New user with no migration match — blank profile (AuthContext upsert handles this too)
    INSERT INTO public.profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- Phone-claim function: lets a signed-in user manually link their old phone account.
-- Called from /claim-account page for phone-only Clerk users.
CREATE OR REPLACE FUNCTION public.claim_account_by_phone(
  p_user_id UUID,
  p_phone   TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mrow public._migration_id_map%ROWTYPE;
BEGIN
  IF auth.uid() <> p_user_id THEN RETURN false; END IF;

  SELECT * INTO mrow
  FROM public._migration_id_map
  WHERE phone = p_phone AND status = 'pending'
  LIMIT 1;

  IF mrow.clerk_id IS NULL THEN RETURN false; END IF;

  UPDATE public.profiles SET
    username         = COALESCE(mrow.username, username),
    stage_name       = COALESCE(mrow.stage_name, stage_name),
    bio              = COALESCE(mrow.bio, bio),
    headshot_url     = COALESCE(mrow.headshot_url, headshot_url),
    phone            = mrow.phone,
    isadmin          = mrow.isadmin,
    points_balance   = mrow.points_balance,
    years_performing = COALESCE(mrow.years_performing, years_performing),
    role             = COALESCE(mrow.role, role)
  WHERE user_id = p_user_id;

  UPDATE public.user_visits      SET user_id = p_user_id::text  WHERE user_id = mrow.clerk_id;
  UPDATE public.saved_mics       SET user_id = p_user_id::text  WHERE user_id = mrow.clerk_id;
  UPDATE public.mic_playlists    SET user_id = p_user_id::text  WHERE user_id = mrow.clerk_id;
  UPDATE public.mic_comments     SET user_id = p_user_id::text  WHERE user_id = mrow.clerk_id;
  UPDATE public.points_ledger    SET user_id = p_user_id        WHERE user_id::text = mrow.clerk_id;
  UPDATE public.recordings       SET user_id = p_user_id        WHERE user_id::text = mrow.clerk_id;

  UPDATE public._migration_id_map
  SET supabase_uuid = p_user_id, status = 'matched', migrated_at = now()
  WHERE clerk_id = mrow.clerk_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_account_by_phone(UUID, TEXT) TO authenticated;
