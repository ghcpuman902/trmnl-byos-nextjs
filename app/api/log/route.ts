import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { defaultDevice } from '@/lib/defaultDevice'
import { logError, logInfo } from '@/lib/logger'

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

export async function GET(request: Request) {
  // Log request details
  logInfo('Log API Request but weirdly from GET', {
    source: 'api/log',
    metadata: {
      url: request.url,
      method: request.method,
      path: new URL(request.url).pathname,
      search: new URL(request.url).search,
      origin: new URL(request.url).origin
    }
  })
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
    const apiKey = request.headers.get('Access-Token') || defaultDevice.api_key;
    const macAddress = request.headers.get('ID') || defaultDevice.mac_address;
    // const refreshRate = request.headers.get('Refresh-Rate');
    // const batteryVoltage = request.headers.get('Battery-Voltage');
    // const fwVersion = request.headers.get('FW-Version');
    // const rssi = request.headers.get('RSSI');

    const { data: device, error } = await supabase
      .from('devices')
      .select('*')
      .eq('api_key', apiKey)
      .eq('mac_address', macAddress)
      .single()

    if (error || !device) {
      logError('Error fetching device', {
        source: 'api/log',
        metadata: { error: JSON.stringify(error), apiKey, macAddress },
        trace: 'try-catch block -> try -> supabase error or no device'
      })
      return NextResponse.json({
        status: 500,
        reset_firmware: false,
        message: "Device not found, trace: api/log -> try-catch block -> try -> supabase error or no device"
      }, { status: 500 })
    }
    logInfo('Device authenticated', {
      source: 'api/log',
      metadata: {
        api_key: apiKey,
        device_id: device.friendly_id
      }
    })

    const requestBody = await request.json()
    logInfo('Processing logs array', {
      source: 'api/log',
      metadata: { logs: requestBody.log.logs_array }
    })

    // Process log data
    const logData: LogData = requestBody.log.logs_array.map((log: LogEntry) => ({
        ...log,
        timestamp: log.creation_timestamp
          ? new Date(log.creation_timestamp * 1000).toISOString()
          : new Date().toISOString()
      }))

    console.log('📦 Processed log data:', JSON.stringify(logData, null, 2))

    // Always attempt to insert log with default device if needed
    const { error: insertError } = await supabase
      .from('logs')
      .insert({
        friendly_id: device.friendly_id,
        numeric_device_id: device.id,
        log_data: logData
      })

    if (insertError) {
      logError('Error inserting log', {
        source: 'api/log',
        metadata: { error: JSON.stringify(insertError) },
        trace: 'Database insert error'
      })
    }

    logInfo('Log saved successfully', {
      source: 'api/log',
      metadata: {
        device_id: device.friendly_id,
        log_data: logData
      }
    })

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
        reset_firmware: true,
        message: "Device not found, trace: api/log -> try-catch block -> catch -> error"
    }, { status: 500 })
  }
} 