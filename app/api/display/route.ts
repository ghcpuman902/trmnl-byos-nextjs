import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { logError, logInfo } from '@/lib/logger'

// Helper function to generate a random filename
const generateRandomFilename = () => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${timestamp}_${randomString}.bmp`;
};

// Helper function to pre-cache the image in the background
const precacheImageInBackground = (imageUrl: string, deviceId: string): void => {
  // Fire and forget - don't await this
  fetch(imageUrl, { method: 'GET' })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to cache image: ${response.status}`);
      }
      logInfo('Image pre-cached successfully', {
        source: 'api/display',
        metadata: { imageUrl, deviceId }
      });
    })
    .catch(error => {
      logError('Failed to precache image', {
        source: 'api/display',
        metadata: { imageUrl, error, deviceId },
        trace: 'precacheImageInBackground helper function'
      });
    });
};

// Helper to prepare for the next frame
const prepareNextFrame = (deviceId: string): void => {
  // Generate a random filename for the next frame
  const nextRandomFilename = generateRandomFilename();
  const baseUrl = 'https://api.manglekuo.com/api/dashboard/bitmap';
  const nextImageUrl = `${baseUrl}/${nextRandomFilename}`;
  
  // Start pre-caching the next frame in the background
  precacheImageInBackground(nextImageUrl, deviceId);
  
  // Store this information for the next request if needed
  // This could be expanded to store in a cache or database if needed
  logInfo('Next frame prepared', {
    source: 'api/display',
    metadata: { 
      next_image_url: nextImageUrl,
      next_filename: nextRandomFilename,
      deviceId
    }
  });
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

        // Generate a random filename for the current request
        const randomFilename = generateRandomFilename();
        const baseUrl = 'https://api.manglekuo.com/api/dashboard/bitmap';
        const imageUrl = `${baseUrl}/${randomFilename}`;
        
        // Start pre-caching the current image in the background
        // This ensures the image is cached by the time the device requests it
        precacheImageInBackground(imageUrl, device.friendly_id);
        
        const newRefreshRate = 180; // 3 units = 1s; update refresh rate to 1 minute if it's higher than 60 = 180 unit

        // Prepare for the next frame in the background
        // This will generate and pre-cache the next image that will be used in the future
        setTimeout(() => {
            prepareNextFrame(device.friendly_id);
        }, 0);

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