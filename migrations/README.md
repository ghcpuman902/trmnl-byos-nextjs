# Database Migrations

This directory contains SQL migration scripts for the Supabase database.

## Migration Files

- `add_timezone_to_devices.sql`: Adds a timezone field to the devices table to support device-specific timezones.

## How to Apply Migrations

1. Connect to your Supabase project using the Supabase CLI or web interface.
2. Run the SQL scripts in the order they are listed above.
3. Verify that the migrations have been applied successfully.

## Recent Changes

### Adding Timezone Support (add_timezone_to_devices.sql)

This migration adds a `timezone` field to the `devices` table to support device-specific timezones. The field defaults to 'UTC' for backward compatibility.

**Changes:**
- Added `timezone` column to `devices` table
- Updated application code to use device-specific timezone for refresh rate calculations
- Renamed `updateDeviceTracking` function to `updateDeviceRefreshStatus` for clarity 