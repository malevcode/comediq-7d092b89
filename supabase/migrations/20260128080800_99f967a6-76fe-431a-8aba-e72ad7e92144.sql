-- Add status column to mic_verifications table
ALTER TABLE public.mic_verifications 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'verified' 
CHECK (status IN ('verified', 'unverified', 'cancelled'));

-- Add index for faster status lookups
CREATE INDEX IF NOT EXISTS idx_mic_verifications_status_lookup 
ON public.mic_verifications (mic_unique_identifier, verified_at DESC);