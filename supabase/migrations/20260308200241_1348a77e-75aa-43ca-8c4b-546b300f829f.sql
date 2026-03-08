
-- Trigger to award +2 points when a mic verification is inserted (only for authenticated users)
CREATE OR REPLACE FUNCTION public.handle_verification_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only award points if user is authenticated
  IF NEW.user_id IS NOT NULL THEN
    -- Award +2 points
    UPDATE profiles SET points_balance = points_balance + 2
    WHERE user_id = NEW.user_id;

    -- Log to points ledger
    INSERT INTO points_ledger (user_id, amount, action_type, metadata)
    VALUES (
      NEW.user_id, 
      2, 
      'mic_verification', 
      jsonb_build_object(
        'mic_unique_identifier', NEW.mic_unique_identifier,
        'verified_at', NEW.verified_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on mic_verifications
DROP TRIGGER IF EXISTS on_verification_award_points ON mic_verifications;
CREATE TRIGGER on_verification_award_points
  AFTER INSERT ON mic_verifications
  FOR EACH ROW
  EXECUTE FUNCTION handle_verification_points();
