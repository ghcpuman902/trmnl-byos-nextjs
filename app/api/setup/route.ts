import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { logError, logInfo } from '@/lib/logger'
import { CustomError } from '@/lib/api/types'

export async function GET(request: Request) {
    try {
        const macAddress = request.headers.get('ID')?.toUpperCase();
        if (!macAddress) {
            const error = new Error('Missing ID header');
            logError(error, {
                source: 'api/setup',
                metadata: { macAddress }
            })
            return NextResponse.json({
                status: 404,
                api_key: null,
                friendly_id: null,
                image_url: null,
                message: "ID header is required"
            }, { status: 200 }) // Status 200 for device compatibility
        }

        const { data: device, error } = await supabase
            .from('devices')
            .select('*')
            .eq('mac_address', macAddress)
            .single()

        if (error || !device) {
            // Device not found, create a new one
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
                // Create an error object with the Supabase error details
                const deviceError: CustomError = new Error('Error creating device');
                // Attach the original error information
                (deviceError as CustomError).originalError = createError;
                
                logError(deviceError, {
                    source: 'api/setup',
                    metadata: { macAddress, friendly_id, api_key }
                })
                
                return NextResponse.json({
                    status: 500,
                    reset_firmware: false,
                    message: `Error creating new device. ${friendly_id}|${api_key}`
                }, { status: 200 })
            }

            logInfo(`New device ${newDevice.friendly_id} created!`, {
                source: 'api/setup',
                metadata: { 
                    friendly_id: newDevice.friendly_id
                }
            })
            return NextResponse.json({
                status: 200,
                api_key: newDevice.api_key,
                friendly_id: newDevice.friendly_id,
                image_url: null,
                filename: null,
                message: `Device ${newDevice.friendly_id} added to BYOS!`,
            }, { status: 200 })
        }

        // Device exists
        logInfo(`Device ${device.friendly_id} added to BYOS!`, {
            source: 'api/setup',
            metadata: { 
                friendly_id: device.friendly_id
            }
        })
        return NextResponse.json({
            status: 200,
            api_key: device.api_key,
            friendly_id: device.friendly_id,
            image_url: null,
            filename: null,
            message: `Device ${device.friendly_id} added to BYOS!`
        }, { status: 200 })

    } catch (error) {
        // The error object already contains the stack trace
        logError(error as Error, {
            source: 'api/setup'
        })
        return NextResponse.json({
            status: 500,
            error: 'Internal server error'
        }, { status: 200 })
    }
} 