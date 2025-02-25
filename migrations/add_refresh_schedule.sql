-- Add refresh_schedule column to devices table
ALTER TABLE devices ADD COLUMN refresh_schedule JSONB;

-- Update existing devices with a default night-time sleep schedule
UPDATE devices
SET refresh_schedule = '{
  "default_refresh_rate": 60,
  "time_ranges": [
    {
      "start_time": "00:00",
      "end_time": "07:00",
      "refresh_rate": 3600
    }
  ]
}'::JSONB;

-- Add comment to explain the column
COMMENT ON COLUMN devices.refresh_schedule IS 'JSON object containing refresh rate schedule with time ranges and rates';

-- Create an index for faster queries if needed
CREATE INDEX idx_devices_refresh_schedule ON devices USING GIN (refresh_schedule); 