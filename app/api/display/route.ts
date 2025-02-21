import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { defaultDevice } from '@/lib/defaultDevice'

export async function GET(request: Request) {
    const apiKey = request.headers.get('Access-Token') || defaultDevice.api_key;
    const macAddress = request.headers.get('ID') || defaultDevice.mac_address;
    const refreshRate = request.headers.get('Refresh-Rate');
    const batteryVoltage = request.headers.get('Battery-Voltage');
    const fwVersion = request.headers.get('FW-Version');
    const rssi = request.headers.get('RSSI');

   

    try {
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
                message: "Device not found, trace: api/display -> try-catch block -> try -> supabase error or no device"
            }, { status: 500 })
        }

        // Log device metrics if needed
        console.log({
            device_id: device.id,
            battery_voltage: batteryVoltage,
            fw_version: fwVersion,
            rssi: rssi,
            refresh_rate: refreshRate
        })

        const imageUrl = `https://api.manglekuo.com/api/dashboard/bitmap/t.bmp`;

        const filename = `t.bmp`

        // Ensure refresh_interval is in seconds (minimum 60 seconds)
        const refreshRateMax = Math.max(60, Number(refreshRate || 60))

        return NextResponse.json({
            status: 0,
            image_url: imageUrl,
            filename: filename,
            refresh_rate: refreshRateMax.toString(),
            reset_firmware: false,
            update_firmware: false,
            firmware_url: null,
            special_function: "restart_playlist"
        }, { status: 200 })

    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({
            status: 500,
            reset_firmware: true,
            message: "Device not found, trace: api/display -> try-catch block -> catch -> error"
        }, { status: 500 })
    }
} 