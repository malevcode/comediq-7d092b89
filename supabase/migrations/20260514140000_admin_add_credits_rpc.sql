-- Called by the Stripe webhook Edge Function (service role) to atomically
-- credit a user's balance and update their plan in one transaction.

CREATE OR REPLACE FUNCTION public.admin_add_credits(
  p_user_id  UUID,
  p_delta    INTEGER,
  p_reason   TEXT,
  p_reference TEXT,
  p_plan     TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update balance and plan atomically
  UPDATE public.profiles
  SET
    credits_balance  = credits_balance + p_delta,
    subscription_plan = COALESCE(p_plan, subscription_plan)
  WHERE user_id = p_user_id;

  -- Write ledger row
  INSERT INTO public.credit_transactions (user_id, delta, reason, reference_id)
  VALUES (p_user_id, p_delta, p_reason, p_reference);
END;
$$;

-- Only service role may call this (webhook, admin scripts)
REVOKE EXECUTE ON FUNCTION public.admin_add_credits(UUID, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_add_credits(UUID, INTEGER, TEXT, TEXT, TEXT) TO service_role;
