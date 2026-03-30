
-- Award 100 points on new profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Set initial points balance
  UPDATE profiles SET points_balance = 100 WHERE user_id = NEW.user_id;
  
  -- Log to points ledger
  INSERT INTO points_ledger (user_id, amount, action_type, reason)
  VALUES (NEW.user_id, 100, 'account_creation', 'Welcome bonus for creating an account');
  
  RETURN NEW;
END;
$$;

-- Trigger after profile insert
DROP TRIGGER IF EXISTS on_profile_created_award_points ON profiles;
CREATE TRIGGER on_profile_created_award_points
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_points();
