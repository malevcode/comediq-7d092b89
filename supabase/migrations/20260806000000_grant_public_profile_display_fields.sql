-- Allow comment/profile display lookups to read only public profile fields.
-- The view is used by the current app code. The column-level grant/policy keeps
-- older deployed clients from failing when they still query profiles directly.

CREATE OR REPLACE VIEW public.profile_display AS
SELECT
  user_id,
  username,
  stage_name
FROM public.profiles;

GRANT SELECT ON public.profile_display TO anon, authenticated;

GRANT SELECT (user_id, username, stage_name)
ON public.profiles
TO anon, authenticated;

CREATE POLICY IF NOT EXISTS "profiles_public_display_fields_select"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);
