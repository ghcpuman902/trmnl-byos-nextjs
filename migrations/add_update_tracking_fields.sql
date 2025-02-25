-- Add columns to track update timing
ALTER TABLE devices ADD COLUMN last_update_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE devices ADD COLUMN next_expected_update TIMESTAMP WITH TIME ZONE;
ALTER TABLE devices ADD COLUMN last_refresh_duration INTEGER; -- in seconds

-- Add comments to explain the columns
COMMENT ON COLUMN devices.last_update_time IS 'Timestamp of the last successful update request from the device';
COMMENT ON COLUMN devices.next_expected_update IS 'Timestamp when the device is expected to request its next update';
COMMENT ON COLUMN devices.last_refresh_duration IS 'The refresh duration (in seconds) that was sent to the device in the last update'; 