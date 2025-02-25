import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { logError, logInfo } from '@/lib/logger'
import { defaultDevice } from '@/lib/defaultDevice'

interface LogEntry {
  creation_timestamp: number
  message?: string
  level?: string
  device_status?: string
  battery_voltage?: number
  rssi?: number
  firmware_version?: string
}

interface LogData {
  logs_array: LogEntry[]
  device_id?: string
  timestamp?: string
}

// Default device ID to use as fallback
const DEFAULT_DEVICE_ID = defaultDevice.friendly_id

export async function GET(request: Request) {
  logInfo('Log API GET Request received (unexpected)', {
    source: 'api/log',
    metadata: {
      url: request.url,
      method: request.method,
      path: new URL(request.url).pathname,
      search: new URL(request.url).search,
      origin: new URL(request.url).origin
    }
  })

  const apiKey = request.headers.get('Access-Token');

  if (!apiKey) {
    return NextResponse.json({
      status: 500,
      message: "Device not found"
    }, { status: 200 }) // 200 for device compatibility
  }

  try {
    const { data: device, error } = await supabase
      .from('devices')
      .select('*')
      .eq('api_key', apiKey)
      .single()

    if (error || !device) {
      logError('Error fetching device', {
        source: 'api/log',
        metadata: { error: JSON.stringify(error), apiKey },
        trace: 'GET handler -> device fetch error'
      })
      return NextResponse.json({
        status: 500,
        message: "Device not found"
      }, { status: 200 }) // 200 for device compatibility
    }

    return NextResponse.json({
      status: 400, // Indicate wrong method in body
      message: "Please use POST method for sending logs",
      device_id: device.friendly_id
    }, { status: 200 }) // 200 for device compatibility
  } catch (error) {
    logError(error as Error, {
      source: 'api/log',
      trace: 'GET handler -> main try-catch'
    })
    return NextResponse.json({
      status: 500,
      message: "Internal server error"
    }, { status: 200 }) // 200 for device compatibility
  }
}

export async function POST(request: Request) {
  // Log request details
  logInfo('Log API Request', {
    source: 'api/log',
    metadata: {
      url: request.url,
      method: request.method,
      path: new URL(request.url).pathname,
      search: new URL(request.url).search,
      origin: new URL(request.url).origin
    }
  })

  try {
    const apiKey = request.headers.get('Access-Token');
    const refreshRate = request.headers.get('Refresh-Rate');
    const batteryVoltage = request.headers.get('Battery-Voltage');
    const fwVersion = request.headers.get('FW-Version');
    const rssi = request.headers.get('RSSI');

    // Initialize device with default value
    let deviceId = DEFAULT_DEVICE_ID;
    let deviceFound = false;

    if (!apiKey) {
      logError('Missing Access-Token header', {
        source: 'api/log',
        trace: 'Missing required header'
      })
      // Continue with default device instead of returning error
      logInfo('Using default device as fallback', {
        source: 'api/log',
        metadata: { default_device_id: DEFAULT_DEVICE_ID }
      })
    } else {
      // Try to find the device
      const { data: device, error } = await supabase
        .from('devices')
        .select('*')
        .eq('api_key', apiKey)
        .single()

      if (error || !device) {
        logError('Error fetching device', {
          source: 'api/log',
          metadata: { error: JSON.stringify(error), apiKey, refreshRate, batteryVoltage, fwVersion, rssi },
          trace: 'try-catch block -> try -> supabase error or no device'
        })
        // Continue with default device instead of returning error
        logInfo('Using default device as fallback', {
          source: 'api/log',
          metadata: { default_device_id: DEFAULT_DEVICE_ID }
        })
      } else {
        // Use the found device
        deviceId = device.friendly_id;
        deviceFound = true;
        
        logInfo('Device authenticated', {
          source: 'api/log',
          metadata: {
            api_key: apiKey,
            device_id: deviceId,
            refresh_rate: refreshRate,
            battery_voltage: batteryVoltage,
            fw_version: fwVersion,
            rssi: rssi
          }
        })
      }
    }

    const requestBody = await request.json()
    logInfo('Processing logs array', {
      source: 'api/log',
      metadata: { 
        logs: requestBody.log.logs_array, 
        refresh_rate: refreshRate, 
        battery_voltage: batteryVoltage, 
        fw_version: fwVersion, 
        rssi: rssi,
        using_default_device: !deviceFound
      }
    })

    // Process log data
    const logData: LogData = requestBody.log.logs_array.map((log: LogEntry) => ({
        ...log,
        timestamp: log.creation_timestamp
          ? new Date(log.creation_timestamp * 1000).toISOString()
          : new Date().toISOString()
      }))

    console.log('📦 Processed log data:', JSON.stringify(logData, null, 2))

    // Try to insert log with the device ID (either real or default)
    const { error: insertError } = await supabase
      .from('logs')
      .insert({
        friendly_id: deviceId,
        log_data: logData
      })

    // If insertion failed and we're not already using the default device, try with default
    if (insertError && deviceId !== DEFAULT_DEVICE_ID) {
      logError('Error inserting log with device ID, trying with default device', {
        source: 'api/log',
        metadata: { 
          error: JSON.stringify(insertError), 
          original_device_id: deviceId,
          default_device_id: DEFAULT_DEVICE_ID,
          refresh_rate: refreshRate, 
          battery_voltage: batteryVoltage, 
          fw_version: fwVersion, 
          rssi: rssi
        },
        trace: 'Database insert error - falling back to default device'
      })
      
      // Try again with default device
      const { error: fallbackError } = await supabase
        .from('logs')
        .insert({
          friendly_id: DEFAULT_DEVICE_ID,
          log_data: logData
        })
        
      if (fallbackError) {
        logError('Error inserting log with default device', {
          source: 'api/log',
          metadata: { 
            error: JSON.stringify(fallbackError),
            refresh_rate: refreshRate, 
            battery_voltage: batteryVoltage, 
            fw_version: fwVersion, 
            rssi: rssi
          },
          trace: 'Database insert error with default device'
        })
      } else {
        logInfo('Log saved successfully with default device', {
          source: 'api/log',
          metadata: {
            device_id: DEFAULT_DEVICE_ID,
            log_data: logData,
            refresh_rate: refreshRate,
            battery_voltage: batteryVoltage,
            fw_version: fwVersion,
            rssi: rssi
          }
        })
      }
    } else if (!insertError) {
      logInfo('Log saved successfully', {
        source: 'api/log',
        metadata: {
          device_id: deviceId,
          log_data: logData,
          refresh_rate: refreshRate,
          battery_voltage: batteryVoltage,
          fw_version: fwVersion,
          rssi: rssi
        }
      })
    }

    return NextResponse.json({
      status: 200,
      message: "Log received"
    }, { status: 200 })

  } catch (error) {
    logError(error as Error, {
      source: 'api/log',
      trace: 'Main try-catch block'
    })
    return NextResponse.json({
        status: 500,
        message: "Internal server error"
    }, { status: 200 }) // 200 for device compatibility
  }
} 