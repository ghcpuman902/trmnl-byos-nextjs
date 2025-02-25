# Dynamic Refresh Rate Schedule

This document explains the dynamic refresh rate schedule feature for TRMNL devices.

## Overview

The dynamic refresh rate schedule allows devices to adjust their refresh rate based on the time of day. This is particularly useful for:

- Conserving battery power during night hours
- Reducing unnecessary updates when users are less likely to view the device
- Providing more frequent updates during active usage hours

## Schema

The refresh schedule is stored in the `refresh_schedule` column of the `devices` table as a JSONB object with the following structure:

```json
{
  "default_refresh_rate": 60,
  "time_ranges": [
    {
      "start_time": "00:00",
      "end_time": "07:00",
      "refresh_rate": 3600
    },
    {
      "start_time": "22:00",
      "end_time": "00:00",
      "refresh_rate": 1800
    }
  ]
}
```

### Fields

- `default_refresh_rate`: The default refresh rate in seconds to use when no time range matches
- `time_ranges`: An array of time range objects, each containing:
  - `start_time`: The start time in 24-hour format (HH:MM)
  - `end_time`: The end time in 24-hour format (HH:MM)
  - `refresh_rate`: The refresh rate in seconds to use during this time range

## Timezone Support

Each device has a `timezone` field that determines which timezone to use when evaluating time ranges. The timezone should be specified in IANA timezone format (e.g., 'America/New_York', 'Europe/London', 'Asia/Tokyo').

If no timezone is specified for a device, UTC is used as the default.

### Example

A device with timezone 'America/New_York' and the following refresh schedule:

```json
{
  "default_refresh_rate": 60,
  "time_ranges": [
    {
      "start_time": "22:00",
      "end_time": "07:00",
      "refresh_rate": 3600
    }
  ]
}
```

Will use a refresh rate of 3600 seconds (1 hour) between 10:00 PM and 7:00 AM Eastern Time, and 60 seconds for the rest of the day.

## Update Tracking

The system tracks device updates with the following fields:

- `last_update_time`: Timestamp of when the device last requested an update
- `next_expected_update`: Timestamp of when the device is expected to request its next update
- `last_refresh_duration`: The refresh duration in seconds that was sent to the device in the last update

These fields enable:

1. Monitoring device health (detecting if a device has missed updates)
2. Displaying expected update times to users
3. Calculating device status (online, offline, delayed, etc.)

## Behavior

1. When a device requests an update, the system checks the current time
2. If the current time falls within any of the defined time ranges, the corresponding refresh rate is used
3. If no time range matches, the default refresh rate is used
4. If the request is triggered by a button press, the default refresh rate is always used regardless of time
5. If no refresh schedule is defined for the device, the system default refresh rate is used (60 seconds)
6. The system records the update time and calculates the next expected update time

## Time Range Handling

- Time ranges are inclusive of the start time and exclusive of the end time
- Time ranges can cross midnight (e.g., "22:00" to "07:00")
- If multiple time ranges overlap, the first matching range in the array is used

## Button Press Override

When a user presses the button on the back of the device, it will always use the default refresh rate for that request, ignoring any time-based rules. This ensures that user-initiated refreshes are always responsive.

## Device Status Determination

The system determines device status based on update tracking:

- **Online**: Device is updating on schedule
- **Updating**: Device is slightly overdue for an update (less than 10 minutes)
- **Delayed**: Device is significantly overdue for an update (more than 10 minutes)
- **Offline**: Device has not updated in more than 24 hours
- **Never Connected**: Device has never requested an update

## UI/UX Design Considerations

When designing the UI for configuring refresh schedules:

1. Use a visual timeline to represent the 24-hour day
2. Allow users to add, edit, and remove time ranges
3. Provide sensible defaults (e.g., slower refresh at night)
4. Include validation to prevent overlapping time ranges
5. Show estimated battery impact based on the configured schedule
6. Provide preset configurations (e.g., "Battery Saver", "Standard", "Always On")
7. Display device status with appropriate visual indicators
8. Show last update time and next expected update time in a human-readable format

## Example Configurations

### Battery Saver
```json
{
  "default_refresh_rate": 300,
  "time_ranges": [
    {
      "start_time": "22:00",
      "end_time": "08:00",
      "refresh_rate": 7200
    }
  ]
}
```

### Office Hours
```json
{
  "default_refresh_rate": 1800,
  "time_ranges": [
    {
      "start_time": "09:00",
      "end_time": "17:00",
      "refresh_rate": 60
    },
    {
      "start_time": "00:00",
      "end_time": "06:00",
      "refresh_rate": 7200
    }
  ]
}
```

### Always On
```json
{
  "default_refresh_rate": 60,
  "time_ranges": []
}
```

## Migration Notes

The `refresh_interval` field is now deprecated in favor of `refresh_schedule.default_refresh_rate`. For backward compatibility, the system will:

1. Continue to maintain the `refresh_interval` field
2. Use `refresh_schedule.default_refresh_rate` when available
3. Fall back to `refresh_interval` if no refresh schedule is defined

In a future update, the `refresh_interval` field may be removed entirely.

### Timezone Support

The `timezone` field has been added to the `devices` table to support device-specific timezones. For backward compatibility:

1. If no timezone is specified, UTC is used as the default
2. Existing devices will have their timezone set to 'UTC' during migration
3. New devices should specify a timezone during creation 