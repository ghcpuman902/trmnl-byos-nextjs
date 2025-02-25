-- First, ensure all devices have a refresh_schedule based on their current refresh_interval
UPDATE devices
SET refresh_schedule = jsonb_build_object(
  'default_refresh_rate', refresh_interval,
  'time_ranges', jsonb_build_array(
    jsonb_build_object(
      'start_time', '00:00',
      'end_time', '07:00',
      'refresh_rate', 3600
    )
  )
)
WHERE refresh_schedule IS NULL;

-- Add a comment to indicate that refresh_interval is deprecated
COMMENT ON COLUMN devices.refresh_interval IS 'DEPRECATED: Use refresh_schedule.default_refresh_rate instead';

-- In the future, we can remove this column entirely with:
-- ALTER TABLE devices DROP COLUMN refresh_interval;
-- But for now, we'll keep it for backward compatibility 