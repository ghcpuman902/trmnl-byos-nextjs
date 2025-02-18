import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: Request) {
    const apiKey = request.headers.get('Access-Token')
    const macAddress = request.headers.get('ID')
    const refreshRate = request.headers.get('Refresh-Rate')
    const batteryVoltage = request.headers.get('Battery-Voltage')
    const fwVersion = request.headers.get('FW-Version')
    const rssi = request.headers.get('RSSI')

    if (!apiKey || !macAddress) {
        return NextResponse.json({
            status: 500,
            reset_firmware: true,
            message: "Device not found"
        }, { status: 200 })
    }

    try {
        const { data: device, error } = await supabase
            .from('devices')
            .select('*')
            .eq('api_key', apiKey)
            .eq('mac_address', macAddress)
            .single()

        if (error) {
            console.error('Error fetching device:', error)
            return NextResponse.json({
                status: 500,
                reset_firmware: true,
                message: "Device not found"
            }, { status: 200 })
        }
        if (!device) {
            return NextResponse.json({
                status: 500,
                reset_firmware: true,
                message: "Device not found"
            }, { status: 200 })
        }

        // If device has no user
        if (!device.user_id) {
            return NextResponse.json({
                status: 202,
                image_url: "https://usetrmnl.com/images/setup/setup-logo.bmp",
                filename: "setup-logo.bmp",
                refresh_rate: "30",
                reset_firmware: false,
                update_firmware: false,
                firmware_url: null,
                special_function: "none",
                message: `Device ${device.friendly_id} added to BYOS! Please log in to attach it to a user to continue.`,
            }, { status: 200 })
        }

        // Log device metrics if needed
        console.log({
            device_id: device.id,
            battery_voltage: batteryVoltage,
            fw_version: fwVersion,
            rssi: rssi,
            refresh_rate: refreshRate
        })

        // Get latest screen or use default
        const { data: screen } = await supabase
            .from('screens')
            .select('*')
            .eq('device_id', device.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        const imageUrl = screen
            ? `${process.env.NEXT_PUBLIC_API_URL}/api/device-image/${device.friendly_id}-${screen.id}.bmp?api_key=${apiKey}`
            : "https://usetrmnl.com/images/rover.bmp"

        const filename = screen
            ? `${device.friendly_id}-${screen.id}.bmp`
            : "rover.bmp"

        return NextResponse.json({
            status: 0,
            image_url: imageUrl,
            filename: filename,
            refresh_rate: device.refresh_interval.toString(),
            reset_firmware: false,
            update_firmware: false,
            firmware_url: null,
            special_function: "none"
        }, { status: 200 })

    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({
            status: 500,
            reset_firmware: true,
            message: "Device not found"
        }, { status: 200 })
    }
} 