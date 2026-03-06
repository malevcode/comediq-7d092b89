
CREATE OR REPLACE FUNCTION public.handle_no_show_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'no_show' THEN
    UPDATE profiles SET points_balance = points_balance - 5
    WHERE user_id = NEW.user_id;

    INSERT INTO points_ledger (user_id, amount, action_type, metadata)
    VALUES (NEW.user_id, -5, 'no_show', jsonb_build_object('event_id', NEW.event_id, 'signup_id', NEW.signup_id));
  END IF;
  RETURN NEW;
END;
$function$;
