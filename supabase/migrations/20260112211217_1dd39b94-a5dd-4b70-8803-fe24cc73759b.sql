-- Add ticketing/RSVP columns to audience_shows
ALTER TABLE public.audience_shows
ADD COLUMN IF NOT EXISTS price_cents integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allows_rsvp boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS external_ticket_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS capacity integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rsvp_count integer DEFAULT 0;

-- Create ticket_purchases table for future Stripe integration
CREATE TABLE public.ticket_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id uuid NOT NULL REFERENCES public.audience_shows(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  total_cents integer NOT NULL,
  stripe_payment_id text,
  stripe_checkout_id text,
  status text NOT NULL DEFAULT 'pending',
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create show_rsvps table for free show RSVPs
CREATE TABLE public.show_rsvps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id uuid NOT NULL REFERENCES public.audience_shows(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  party_size integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(show_id, user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.ticket_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_rsvps ENABLE ROW LEVEL SECURITY;

-- Policies for ticket_purchases
CREATE POLICY "Users can view their own ticket purchases"
ON public.ticket_purchases
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ticket purchases"
ON public.ticket_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all ticket purchases"
ON public.ticket_purchases
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true
));

-- Policies for show_rsvps
CREATE POLICY "Users can view their own RSVPs"
ON public.show_rsvps
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create RSVPs"
ON public.show_rsvps
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSVPs"
ON public.show_rsvps
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RSVPs"
ON public.show_rsvps
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view RSVPs for shows"
ON public.show_rsvps
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage all RSVPs"
ON public.show_rsvps
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.isadmin = true
));

-- Create function to update RSVP count
CREATE OR REPLACE FUNCTION public.update_show_rsvp_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE audience_shows 
    SET rsvp_count = COALESCE(rsvp_count, 0) + NEW.party_size
    WHERE id = NEW.show_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE audience_shows 
    SET rsvp_count = GREATEST(0, COALESCE(rsvp_count, 0) - OLD.party_size)
    WHERE id = OLD.show_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    UPDATE audience_shows 
    SET rsvp_count = GREATEST(0, COALESCE(rsvp_count, 0) - OLD.party_size)
    WHERE id = OLD.show_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for RSVP count updates
CREATE TRIGGER update_rsvp_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.show_rsvps
FOR EACH ROW
EXECUTE FUNCTION public.update_show_rsvp_count();

-- Create updated_at trigger for ticket_purchases
CREATE TRIGGER update_ticket_purchases_updated_at
BEFORE UPDATE ON public.ticket_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for show_rsvps
CREATE TRIGGER update_show_rsvps_updated_at
BEFORE UPDATE ON public.show_rsvps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();