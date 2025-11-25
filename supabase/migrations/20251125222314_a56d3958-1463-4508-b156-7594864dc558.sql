-- Fix search_path security warning for update_updated_at_column function
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the triggers
CREATE TRIGGER update_mic_hosts_updated_at
BEFORE UPDATE ON public.mic_hosts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mic_signup_events_updated_at
BEFORE UPDATE ON public.mic_signup_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mic_signups_updated_at
BEFORE UPDATE ON public.mic_signups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();