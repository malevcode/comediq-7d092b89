CREATE OR REPLACE FUNCTION public.email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE lower(email) = lower(trim(p_email))
  );
$$;

REVOKE ALL ON FUNCTION public.email_exists(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_exists(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.email_account_status(p_email TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT COALESCE(
    (
      SELECT CASE
        WHEN email_confirmed_at IS NOT NULL OR confirmed_at IS NOT NULL THEN 'confirmed'
        ELSE 'unconfirmed'
      END
      FROM auth.users
      WHERE lower(email) = lower(trim(p_email))
      LIMIT 1
    ),
    'none'
  );
$$;

REVOKE ALL ON FUNCTION public.email_account_status(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_account_status(TEXT) TO anon, authenticated;
