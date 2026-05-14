-- Credit ledger: every credit change is an immutable row.
-- profiles.credits_balance is the derived sum (kept in sync by triggers).

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL,
  delta        INTEGER     NOT NULL,  -- positive = added, negative = spent
  reason       TEXT        NOT NULL,  -- 'subscription_renewal' | 'mic_signup' | 'admin_grant' | 'refund'
  reference_id TEXT,                  -- Stripe invoice ID or mic event ID
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_credits"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role inserts (webhook + admin). Authenticated users cannot insert directly.
CREATE POLICY "service_insert_credits"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Function: atomically deduct a credit for a mic signup.
-- Called from the frontend via RPC — prevents race conditions.
CREATE OR REPLACE FUNCTION public.spend_credit(
  p_user_id    UUID,
  p_reference  TEXT  -- mic event ID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  IF auth.uid() <> p_user_id THEN RETURN false; END IF;

  SELECT credits_balance INTO current_balance
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_balance IS NULL OR current_balance < 1 THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET credits_balance = credits_balance - 1
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, delta, reason, reference_id)
  VALUES (p_user_id, -1, 'mic_signup', p_reference);

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.spend_credit(UUID, TEXT) TO authenticated;

-- Index for per-user history queries
CREATE INDEX IF NOT EXISTS credit_transactions_user_id_idx
  ON public.credit_transactions (user_id, created_at DESC);
