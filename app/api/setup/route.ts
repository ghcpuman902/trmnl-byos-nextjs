import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { defaultDevice } from '@/lib/defaultDevice';
import { logError, logInfo } from '@/lib/logger'

export async function GET(request: Request) {
    try {
        const apiKey = request.headers.get('Access-Token') || defaultDevice.api_key;
        const macAddress = request.headers.get('ID') || defaultDevice.mac_address;
        // const refreshRate = request.headers.get('Refresh-Rate');
        // const batteryVoltage = request.headers.get('Battery-Voltage');
        // const fwVersion = request.headers.get('FW-Version');
        // const rssi = request.headers.get('RSSI');

        if (!request.headers.get('ID')) {
            return NextResponse.json({
                status: 404,
                api_key: null,
                friendly_id: null,
                image_url: null,
                message: "ID header is required.",
            }, { status: 200 }) // Note: Status 200 but with 404 in body
        }

        const { data: device, error } = await supabase
            .from('devices')
            .select('*')
            .eq('api_key', apiKey)
            .eq('mac_address', macAddress)
            .single()

        if (error || !device) {
            logError('Error fetching device:', {
                source: 'api/setup',
                metadata: { error, macAddress },
                trace: 'try-catch block -> try -> supabase error or no device'
            })
            return NextResponse.json({
                status: 500,
                reset_firmware: false,
                message: "Device not found, trace: api/setup -> try-catch block -> try -> supabase error or no device"
            }, { status: 500 })
        }

        if (device) {
            logInfo(`Device ${device.friendly_id} added to BYOS!`, {
                source: 'api/setup',
                metadata: { 
                    friendly_id: device.friendly_id,
                    numeric_device_id: device.id  // Add both IDs
                }
            })
            // Device exists 
            return NextResponse.json({
                status: 200,
                api_key: device.api_key,
                friendly_id: device.friendly_id,
                numeric_device_id: device.id,  // Add numeric ID to response
                image_url: null,
                filename: null,
                message: `Device ${device.friendly_id} added to BYOS!`,
            }, { status: 200 })
        }

        //create new device
        const friendly_id = Math.random().toString(36).substring(2, 8).toUpperCase();
        const api_key = Math.random().toString(36).substring(2, 30);
        const { data: newDevice, error: createError } = await supabase
        .from('devices')
        .insert({
            mac_address: macAddress,
            name: `TRMNL Device ${friendly_id}`,
            friendly_id: friendly_id,
            api_key: api_key,
            refresh_interval: 300 // 300 seconds / 5 minutes
        })
        .select()
        .single()

        if (createError || !newDevice) {
            console.error('Error fetching device:', createError)
            return NextResponse.json({
                status: 500,
                reset_firmware: false,
                message: `Error creating new device, trace: api/setup -> try-catch block -> try -> supabase insert error or no new device returned. ${friendly_id}|${api_key}`
            }, { status: 500 })
        }

        return NextResponse.json({
            status: 200,
            api_key: newDevice.api_key,
            friendly_id: newDevice.friendly_id,
            image_url: null,
            filename: null,
            message: `Registred new device ${newDevice.friendly_id} to the databse! welcome!`,
        }, { status: 200 })

    } catch (error) {
        logError(error as Error, {
            source: 'api/setup',
            trace: 'Main try-catch block'
        })
        return NextResponse.json({
            status: 500,
            error: 'Internal server error'
        }, { status: 500 })
    }
} 