-- Create mic_verifications table for crowd-sourced verification
CREATE TABLE public.mic_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mic_unique_identifier UUID NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE public.mic_verifications 
ADD CONSTRAINT fk_mic_verifications_mic 
FOREIGN KEY (mic_unique_identifier) 
REFERENCES public.open_mics_historical(unique_identifier) ON DELETE CASCADE;

-- Indexes for efficient lookups
CREATE INDEX idx_mic_verifications_mic ON public.mic_verifications(mic_unique_identifier);
CREATE INDEX idx_mic_verifications_ip_mic ON public.mic_verifications(ip_hash, mic_unique_identifier);
CREATE INDEX idx_mic_verifications_date ON public.mic_verifications(verified_at DESC);

-- Enable RLS
ALTER TABLE public.mic_verifications ENABLE ROW LEVEL SECURITY;

-- Anyone can verify mics (public INSERT)
CREATE POLICY "Anyone can verify mics" ON public.mic_verifications
FOR INSERT WITH CHECK (true);

-- Anyone can read verifications
CREATE POLICY "Anyone can read verifications" ON public.mic_verifications
FOR SELECT USING (true);

-- View to get the most recent verification for each mic
CREATE VIEW public.mic_latest_verification AS
SELECT DISTINCT ON (mic_unique_identifier)
  mic_unique_identifier,
  verified_at,
  user_id
FROM public.mic_verifications
ORDER BY mic_unique_identifier, verified_at DESC;

-- Trigger function to auto-update last_verified in open_mics_historical
CREATE OR REPLACE FUNCTION public.update_mic_last_verified()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.open_mics_historical
  SET last_verified = TO_CHAR(NEW.verified_at, 'MM/DD/YYYY')
  WHERE unique_identifier = NEW.mic_unique_identifier;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER on_mic_verification
AFTER INSERT ON public.mic_verifications
FOR EACH ROW EXECUTE FUNCTION public.update_mic_last_verified();