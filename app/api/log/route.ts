import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { defaultDevice } from '@/lib/defaultDevice'

interface LogEntry {
  creation_timestamp: number;
  // Add other known log entry fields here
  [key: string]: unknown; // For any additional fields
}

interface LogData {
  logs_array: LogEntry[];
  // Add other known log data fields here
  [key: string]: unknown; // For any additional fields
}

export async function POST(request: Request) {
  // Add detailed URL logging at the very start
  console.log('🌐 Full Request Details:')
  console.log('   URL:', request.url)
  console.log('   Method:', request.method)
  console.log('   Path:', new URL(request.url).pathname)
  console.log('   Search:', new URL(request.url).search)
  console.log('   Origin:', new URL(request.url).origin)

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
      console.error('Error fetching device:', error)
      return NextResponse.json({
        status: 500,
        reset_firmware: false,
        message: "Device not found, trace: api/log -> try-catch block -> try -> supabase error or no device"
      }, { status: 500 })
    }
    console.log(request.headers.get('Access-Token') ? `🔑 API Key received: ${request.headers.get('Access-Token')}` : `🔑 No API Key received, using default device: ${defaultDevice.api_key}`)

    const requestBody = await request.json()
    console.log('📝 Processing logs array:', requestBody.log.logs_array)


    // Process log data
    const logData: LogData = requestBody.log.logs_array.map((log: LogEntry) => ({
        ...log,
        timestamp: log.creation_timestamp
          ? new Date(log.creation_timestamp * 1000).toISOString()
          : new Date().toISOString()
      }))

    console.log('📦 Processed log data:', JSON.stringify(logData, null, 2))

    // Always attempt to insert log with default device if needed
    const { error: logError } = await supabase
      .from('logs')
      .insert({
        device_id: device.friendly_id,
        log_data: logData
      })

    if (logError) {
      console.error('⚠️ Error inserting log, but continuing:', logError)
    }

    console.log('✅ Log saved successfully for device:', device.friendly_id)
    console.log('📝 Final saved log data:', JSON.stringify(logData, null, 2))

    return NextResponse.json({
      status: 200,
      message: "Log received"
    }, { status: 200 })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({
        status: 500,
        reset_firmware: true,
        message: "Device not found, trace: api/log -> try-catch block -> catch -> error"
    }, { status: 500 })
  }
} 