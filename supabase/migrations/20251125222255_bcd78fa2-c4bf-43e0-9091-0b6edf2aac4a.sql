-- Create enums for signup system
CREATE TYPE public.signup_mode AS ENUM ('first_come', 'lottery', 'bucket');
CREATE TYPE public.signup_status AS ENUM ('confirmed', 'waitlist', 'lottery_pending', 'cancelled');

-- Create mic_hosts table
CREATE TABLE public.mic_hosts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  mic_id UUID NOT NULL REFERENCES public.open_mics_historical(unique_identifier) ON DELETE CASCADE,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, mic_id)
);

-- Create mic_signup_events table
CREATE TABLE public.mic_signup_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mic_id UUID NOT NULL REFERENCES public.open_mics_historical(unique_identifier) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES public.mic_hosts(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_time TIME,
  signup_mode signup_mode NOT NULL DEFAULT 'first_come',
  total_spots INTEGER NOT NULL DEFAULT 15,
  spots_remaining INTEGER NOT NULL DEFAULT 15,
  signup_opens_at TIMESTAMP WITH TIME ZONE,
  signup_closes_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mic_signups table
CREATE TABLE public.mic_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.mic_signup_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  signup_order INTEGER,
  status signup_status NOT NULL DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.mic_hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mic_signup_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mic_signups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mic_hosts
CREATE POLICY "Hosts can view their own records"
ON public.mic_hosts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all hosts"
ON public.mic_hosts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.isadmin = true
));

CREATE POLICY "Users can request to be hosts"
ON public.mic_hosts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update host records"
ON public.mic_hosts FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.isadmin = true
));

-- RLS Policies for mic_signup_events
CREATE POLICY "Anyone can view active signup events"
ON public.mic_signup_events FOR SELECT
USING (is_active = true);

CREATE POLICY "Hosts can view their own events"
ON public.mic_signup_events FOR SELECT
USING (host_id IN (
  SELECT id FROM public.mic_hosts 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Verified hosts can create events"
ON public.mic_signup_events FOR INSERT
WITH CHECK (
  host_id IN (
    SELECT id FROM public.mic_hosts 
    WHERE user_id = auth.uid() 
    AND is_verified = true
  )
);

CREATE POLICY "Hosts can update their own events"
ON public.mic_signup_events FOR UPDATE
USING (host_id IN (
  SELECT id FROM public.mic_hosts 
  WHERE user_id = auth.uid()
));

-- RLS Policies for mic_signups
CREATE POLICY "Anyone can view signups for active events"
ON public.mic_signups FOR SELECT
USING (
  event_id IN (
    SELECT id FROM public.mic_signup_events 
    WHERE is_active = true
  )
);

CREATE POLICY "Users can view their own signups"
ON public.mic_signups FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Hosts can view signups for their events"
ON public.mic_signups FOR SELECT
USING (
  event_id IN (
    SELECT mse.id FROM public.mic_signup_events mse
    JOIN public.mic_hosts mh ON mse.host_id = mh.id
    WHERE mh.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create signups"
ON public.mic_signups FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signups"
ON public.mic_signups FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Hosts can update signups for their events"
ON public.mic_signups FOR UPDATE
USING (
  event_id IN (
    SELECT mse.id FROM public.mic_signup_events mse
    JOIN public.mic_hosts mh ON mse.host_id = mh.id
    WHERE mh.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_mic_hosts_user_id ON public.mic_hosts(user_id);
CREATE INDEX idx_mic_hosts_mic_id ON public.mic_hosts(mic_id);
CREATE INDEX idx_mic_signup_events_mic_id ON public.mic_signup_events(mic_id);
CREATE INDEX idx_mic_signup_events_host_id ON public.mic_signup_events(host_id);
CREATE INDEX idx_mic_signup_events_event_date ON public.mic_signup_events(event_date);
CREATE INDEX idx_mic_signups_event_id ON public.mic_signups(event_id);
CREATE INDEX idx_mic_signups_user_id ON public.mic_signups(user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_mic_hosts_updated_at
BEFORE UPDATE ON public.mic_hosts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mic_signup_events_updated_at
BEFORE UPDATE ON public.mic_signup_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mic_signups_updated_at
BEFORE UPDATE ON public.mic_signups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();