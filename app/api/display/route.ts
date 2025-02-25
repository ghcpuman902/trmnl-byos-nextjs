import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { logError, logInfo } from '@/lib/logger'

// Helper function to generate a random filename
const generateRandomFilename = () => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${timestamp}_${randomString}.bmp`;
};

// Helper function to pre-cache the image
const precacheImage = async (imageUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(imageUrl, { method: 'GET' });
    return response.ok;
  } catch (error) {
    logError('Failed to precache image', {
      source: 'api/display',
      metadata: { imageUrl, error },
      trace: 'precacheImage helper function'
    });
    return false;
  }
};

export async function GET(request: Request) {
    // Log request details
    logInfo('Display API Request', {
        source: 'api/display',
        metadata: {
            url: request.url,
            method: request.method,
            path: new URL(request.url).pathname
        }
    })

    const apiKey = request.headers.get('Access-Token');
    const macAddress = request.headers.get('ID')?.toUpperCase();
    const refreshRate = request.headers.get('Refresh-Rate');
    const batteryVoltage = request.headers.get('Battery-Voltage');
    const fwVersion = request.headers.get('FW-Version');
    const rssi = request.headers.get('RSSI');

    if (!apiKey || !macAddress) {
        logError('Missing required headers', {
            source: 'api/display',
            metadata: { apiKey, macAddress },
            trace: 'Missing Access-Token or ID header'
        })
        return NextResponse.json({
            status: 500,
            reset_firmware: true,
            message: "Device not found"
        }, { status: 200 }) // Status 200 for device compatibility
    }

    try {
        const { data: device, error } = await supabase
            .from('devices')
            .select('*')
            .eq('api_key', apiKey)
            .eq('mac_address', macAddress)
            .single()

        if (error || !device) {
            logError('Error fetching device', {
                source: 'api/display',
                metadata: { error, apiKey, macAddress },
                trace: 'try-catch block -> try -> supabase error or no device'
            })
            return NextResponse.json({
                status: 500,
                reset_firmware: true,
                message: "Device not found"
            }, { status: 200 })
        }

        // Log device metrics
        logInfo('Device metrics received', {
            source: 'api/display',
            metadata: {
                friendly_id: device.friendly_id,
                battery_voltage: batteryVoltage,
                fw_version: fwVersion,
                rssi: rssi,
                refresh_rate: refreshRate
            }
        })

        // Generate a random filename to trick the device
        const randomFilename = generateRandomFilename();
        const baseUrl = 'https://api.manglekuo.com/api/dashboard/bitmap';
        const imageUrl = `${baseUrl}/${randomFilename}`;
        
        // Pre-cache the image by making a request to the URL
        const cacheSuccess = await precacheImage(imageUrl);
        
        if (!cacheSuccess) {
            logError('Failed to cache image', {
                source: 'api/display',
                metadata: { imageUrl },
                trace: 'Image caching failed'
            });
            // Fallback to a default filename if caching fails
            const fallbackFilename = 't.bmp';
            const fallbackUrl = `${baseUrl}/${fallbackFilename}`;
            
            return NextResponse.json({
                status: 0,
                image_url: fallbackUrl,
                filename: fallbackFilename,
                refresh_rate: Math.min(60, Number(refreshRate || 60)),
                reset_firmware: false,
                update_firmware: false,
                firmware_url: null,
                special_function: "restart_playlist"
            }, { status: 200 });
        }
        
        const newRefreshRate = Math.min(60, Number(refreshRate || 60)); // update refresh rate to 1 minute if it's higher than 60

        logInfo('Display request successful', {
            source: 'api/display',
            metadata: {
                image_url: imageUrl,
                friendly_id: device.friendly_id,
                refresh_rate: newRefreshRate,
                filename: randomFilename,
                special_function: "restart_playlist"
            }
        })

        return NextResponse.json({
            status: 0,
            image_url: imageUrl,
            filename: randomFilename,
            refresh_rate: newRefreshRate,
            reset_firmware: false,
            update_firmware: false,
            firmware_url: null,
            special_function: "restart_playlist"
        }, { status: 200 })

    } catch (error) {
        logError(error as Error, {
            source: 'api/display',
            trace: 'Main try-catch block'
        })
        return NextResponse.json({
            status: 500,
            reset_firmware: true,
            message: "Device not found"
        }, { status: 200 })
    }
} 