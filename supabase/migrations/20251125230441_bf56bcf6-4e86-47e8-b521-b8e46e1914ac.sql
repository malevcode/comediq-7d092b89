-- Add signup_enabled column to open_mics_historical table
ALTER TABLE open_mics_historical
ADD COLUMN signup_enabled BOOLEAN NOT NULL DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN open_mics_historical.signup_enabled IS 'Whether this mic has opted in to use Comediq for signup management';