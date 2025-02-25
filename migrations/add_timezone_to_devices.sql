-- Add timezone column to devices table
ALTER TABLE devices ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';

-- Add comment to the column
COMMENT ON COLUMN devices.timezone IS 'Device timezone (e.g., America/New_York, Europe/London)';

-- Update existing records to use UTC timezone
UPDATE devices SET timezone = 'UTC' WHERE timezone IS NULL; 