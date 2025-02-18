import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: Request) {
    const macAddress = request.headers.get('ID')

    if (!macAddress) {
        return NextResponse.json({
            status: 404,
            api_key: null,
            friendly_id: null,
            image_url: null,
            message: "ID header is required.",
        }, { status: 200 }) // Note: Status 200 but with 404 in body
    }

    try {
        // Check if device exists
        const { data: device, error } = await supabase
            .from('devices')
            .select('*')
            .eq('mac_address', macAddress)
            .single()

        if (error) {
            console.error('Error fetching device:', error)
            return NextResponse.json({
                status: 500,
                error: 'Internal server error'
            }, { status: 500 })
        }


        if (device) {
            if (device.user_id) {
                // If device has a user, act as if it doesn't exist
                return NextResponse.json({
                    status: 404,
                    api_key: null,
                    friendly_id: null,
                    image_url: null,
                    filename: null,
                }, { status: 200 })
            } else {
                // Device exists but no user
                return NextResponse.json({
                    status: 200,
                    api_key: device.api_key,
                    friendly_id: device.friendly_id,
                    image_url: null,
                    filename: null,
                    message: `Device ${device.friendly_id} added to BYOS! Please log in to attach it to a user to continue.`,
                }, { status: 200 })
            }
        }

        // Create new device
        const { data: newDevice, error: createError } = await supabase
            .from('devices')
            .insert({
                mac_address: macAddress,
                name: "A TRMNL Device",
                friendly_id: Math.random().toString(36).substring(2, 8).toUpperCase(),
                api_key: Math.random().toString(36).substring(2, 30),
                refresh_interval: 900
            })
            .select()
            .single()

        if (createError) throw createError

        return NextResponse.json({
            status: 200,
            api_key: newDevice.api_key,
            friendly_id: newDevice.friendly_id,
            image_url: null,
            filename: null,
            message: `Device ${newDevice.friendly_id} added to BYOS! Please log in to attach it to a user to continue.`,
        }, { status: 200 })

    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({
            status: 500,
            error: 'Internal server error'
        }, { status: 500 })
    }
} 