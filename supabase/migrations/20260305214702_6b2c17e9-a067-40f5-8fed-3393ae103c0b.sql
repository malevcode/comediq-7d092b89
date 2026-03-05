
-- 1. Add slots columns to open_mics_historical
ALTER TABLE public.open_mics_historical
  ADD COLUMN IF NOT EXISTS slots_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS slot_duration_minutes integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS price_per_slot numeric DEFAULT NULL;

-- 2. Create mic_bookings table for no-show/history tracking
CREATE TABLE public.mic_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signup_id uuid REFERENCES public.mic_signups(id) ON DELETE SET NULL,
  event_id uuid NOT NULL REFERENCES public.mic_signup_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'no_show', 'cancelled')),
  marked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS on mic_bookings
ALTER TABLE public.mic_bookings ENABLE ROW LEVEL SECURITY;

-- Hosts can insert bookings for their events
CREATE POLICY "Hosts can insert bookings for their events"
  ON public.mic_bookings FOR INSERT TO authenticated
  WITH CHECK (
    event_id IN (
      SELECT mse.id FROM mic_signup_events mse
      JOIN mic_hosts mh ON mse.host_id = mh.id
      WHERE mh.user_id = auth.uid()
    )
  );

-- Hosts can update bookings for their events
CREATE POLICY "Hosts can update bookings for their events"
  ON public.mic_bookings FOR UPDATE TO authenticated
  USING (
    event_id IN (
      SELECT mse.id FROM mic_signup_events mse
      JOIN mic_hosts mh ON mse.host_id = mh.id
      WHERE mh.user_id = auth.uid()
    )
  );

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
  ON public.mic_bookings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Hosts can view bookings for their events
CREATE POLICY "Hosts can view bookings for their events"
  ON public.mic_bookings FOR SELECT TO authenticated
  USING (
    event_id IN (
      SELECT mse.id FROM mic_signup_events mse
      JOIN mic_hosts mh ON mse.host_id = mh.id
      WHERE mh.user_id = auth.uid()
    )
  );

-- Admins full access
CREATE POLICY "Admins full access to mic_bookings"
  ON public.mic_bookings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true));

-- 4. No-show trigger: deduct 50 points and log to points_ledger
CREATE OR REPLACE FUNCTION public.handle_no_show_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'no_show' THEN
    UPDATE profiles SET points_balance = points_balance - 50
    WHERE user_id = NEW.user_id;

    INSERT INTO points_ledger (user_id, amount, action_type, metadata)
    VALUES (NEW.user_id, -50, 'no_show', jsonb_build_object('event_id', NEW.event_id, 'signup_id', NEW.signup_id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_no_show
  AFTER INSERT ON public.mic_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_no_show_points();

-- 5. Beta activation for the three mics
UPDATE public.open_mics_historical
SET slots_enabled = true, slot_duration_minutes = 5
WHERE unique_identifier IN (
  '0d6e6906-18a8-4a7b-89e4-e5d1b70dccb1',
  '0f7cb01c-8879-4ea3-a97b-0de90802490a',
  '18838f99-fd80-46f5-a6f9-dc9def84e863'
);
