-- Add custom stage time to profile_open_mics for user-specified stage time
ALTER TABLE public.profile_open_mics 
ADD COLUMN custom_stage_time integer DEFAULT NULL;

-- Add stage time minutes to profile_custom_shows
ALTER TABLE public.profile_custom_shows 
ADD COLUMN stage_time_minutes integer DEFAULT 5;

-- Add comment for documentation
COMMENT ON COLUMN public.profile_open_mics.custom_stage_time IS 'User-specified stage time in minutes, defaults to 5 if not set';
COMMENT ON COLUMN public.profile_custom_shows.stage_time_minutes IS 'Stage time in minutes for custom shows, defaults to 5';