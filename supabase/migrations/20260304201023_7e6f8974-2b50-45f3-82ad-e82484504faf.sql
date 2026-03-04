
-- Trigger function: When a new verification is inserted, increment verification_count
-- and update status to 'verified' if count reaches 2
CREATE OR REPLACE FUNCTION public.handle_mic_verification_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_count integer;
  current_status text;
BEGIN
  -- Increment verification_count
  UPDATE open_mics_historical
  SET verification_count = COALESCE(verification_count, 0) + 1
  WHERE unique_identifier = NEW.mic_unique_identifier
  RETURNING verification_count, status::text INTO current_count, current_status;

  -- If count >= 2 and status is 'trial', promote to 'verified'
  IF current_count >= 2 AND current_status = 'trial' THEN
    UPDATE open_mics_historical
    SET status = 'verified'
    WHERE unique_identifier = NEW.mic_unique_identifier;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on mic_verifications
DROP TRIGGER IF EXISTS on_verification_increment_count ON mic_verifications;
CREATE TRIGGER on_verification_increment_count
  AFTER INSERT ON mic_verifications
  FOR EACH ROW
  EXECUTE FUNCTION handle_mic_verification_count();

-- Function to move expired trial mics to pending (called by cron or edge function)
CREATE OR REPLACE FUNCTION public.expire_trial_mics()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE open_mics_historical
  SET status = 'pending'
  WHERE status = 'trial'
    AND verification_count < 2
    AND submission_date < now() - interval '14 days';
  
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
