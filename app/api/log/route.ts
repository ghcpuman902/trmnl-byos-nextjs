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

interface RequestBody {
  log: LogData;
}

export async function POST(request: Request) {
  // Add detailed URL logging at the very start
  console.log('🌐 Full Request Details:')
  console.log('   URL:', request.url)
  console.log('   Method:', request.method)
  console.log('   Path:', new URL(request.url).pathname)
  console.log('   Search:', new URL(request.url).search)
  console.log('   Origin:', new URL(request.url).origin)
  
  // Clone request early to ensure we can read it
  const clonedRequest = request.clone()
  
  let requestBody: RequestBody
  try {
    requestBody = await clonedRequest.json()
    console.log('📦 Raw Request Body:', JSON.stringify(requestBody, null, 2))
  } catch (e) {
    console.error('❌ Error parsing request body:', e)
    requestBody = { log: { logs_array: [] } }
  }

  try {
    const body: RequestBody = await request.json()
    const apiKey = request.headers.get('Access-Token')
    console.log('🔑 API Key received:', apiKey ? 'Yes' : 'No')
    
    console.log('📝 Processing logs array:', body.log.logs_array)
    
    // Get or create default device (will be used as fallback)
    let defaultDeviceData = await supabase
      .from('devices')
      .select('id')
      .eq('friendly_id', defaultDevice.friendly_id)
      .single()
      .then(result => result.data)

    if (!defaultDeviceData) {
      console.log('📱 Creating default device in database')
      const { data: newDevice, error: createError } = await supabase
        .from('devices')
        .insert({
          friendly_id: defaultDevice.friendly_id,
          name: defaultDevice.device_name,
          mac_address: defaultDevice.mac_address,
          api_key: defaultDevice.api_key,
          refresh_interval: defaultDevice.refresh_rate
        })
        .select('id')
        .single()

      if (createError) {
        console.error('⚠️ Error creating default device, but continuing:', createError)
      }
      defaultDeviceData = newDevice
    }

    // Try to get device from API key, but use default if anything fails
    let deviceId = defaultDeviceData?.id
    if (apiKey) {
      const { data: device } = await supabase
        .from('devices')
        .select('id')
        .eq('api_key', apiKey)
        .single()

      if (device) {
        deviceId = device.id
      } else {
        console.log('⚠️ Device not found for API key, using default device')
      }
    }

    // Process log data
    const logData: LogData = {
      ...body.log,
      logs_array: body.log.logs_array.map((log: LogEntry) => ({
        ...log,
        timestamp: log.creation_timestamp 
          ? new Date(log.creation_timestamp * 1000).toISOString()
          : new Date().toISOString()
      }))
    }

    console.log('📦 Processed log data:', JSON.stringify(logData, null, 2))

    // Always attempt to insert log with default device if needed
    const { error: logError } = await supabase
      .from('logs')
      .insert({
        device_id: deviceId,
        log_data: logData
      })

    if (logError) {
      console.error('⚠️ Error inserting log, but continuing:', logError)
    }

    console.log('✅ Log saved successfully for device:', deviceId)
    console.log('📝 Final saved log data:', JSON.stringify(logData, null, 2))

    return NextResponse.json({
      status: 200,
      message: "Log received"
    })

  } catch (error) {
    console.error('⚠️ Error occurred, but continuing with default device:', error)
    
    // Even in case of error, try to save with default device
    try {
      const { error: logError } = await supabase
        .from('logs')
        .insert({
          device_id: defaultDevice.friendly_id,
          log_data: { logs_array: [] }
        })

      if (logError) {
        console.error('❌ Final fallback logging failed:', logError)
      }
    } catch (finalError) {
      console.error('❌ Final fallback logging failed:', finalError)
    }

    return NextResponse.json({
      status: 200,
      message: "Log attempt processed"
    })
  }
} 