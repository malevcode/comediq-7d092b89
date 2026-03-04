
-- Create enums for mic status, frequency, and signup method
CREATE TYPE public.mic_status AS ENUM ('trial', 'verified', 'pending');
CREATE TYPE public.mic_frequency AS ENUM ('weekly', 'bi_weekly', '1st_of_month', '2nd_of_month', '3rd_of_month', '4th_of_month', 'last_of_month', 'one_off');
CREATE TYPE public.signup_method AS ENUM ('in_person', 'online', 'comediq_direct', 'other');

-- Add new columns to open_mics_historical
ALTER TABLE public.open_mics_historical
  ADD COLUMN IF NOT EXISTS submission_date timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS status public.mic_status DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS verification_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frequency public.mic_frequency DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS legacy_tag text,
  ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS signup_method public.signup_method DEFAULT 'in_person',
  ADD COLUMN IF NOT EXISTS signup_url text;

-- Backfill all existing records as legacy verified weekly mics
UPDATE public.open_mics_historical
SET 
  legacy_tag = 'Pre-March 2026',
  status = 'verified',
  frequency = 'weekly'
WHERE legacy_tag IS NULL;

-- Add same columns to open_mics_requests for new submissions
ALTER TABLE public.open_mics_requests
  ADD COLUMN IF NOT EXISTS frequency public.mic_frequency DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS signup_method public.signup_method DEFAULT 'in_person',
  ADD COLUMN IF NOT EXISTS signup_url text;
