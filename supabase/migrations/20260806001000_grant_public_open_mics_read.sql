-- Allow the public open mics feed to read approved active rows.
-- Writes remain controlled by the existing insert/update policies.

GRANT SELECT ON public.open_mics_historical TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'open_mics_historical'
      AND policyname = 'open_mics_public_read_active_approved'
  ) THEN
    CREATE POLICY "open_mics_public_read_active_approved"
    ON public.open_mics_historical
    FOR SELECT
    TO anon, authenticated
    USING (
      active IS TRUE
      AND COALESCE(status, 'verified') <> 'pending'
    );
  END IF;
END $$;
