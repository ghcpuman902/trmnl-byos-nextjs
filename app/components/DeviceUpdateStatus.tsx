'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, RefreshCw, Battery, Wifi } from 'lucide-react';
import { formatDistanceToNow, formatDistance, isPast } from 'date-fns';

interface DeviceUpdateStatusProps {
  deviceId: string;
  lastUpdateTime: string | null;
  nextExpectedUpdate: string | null;
  lastRefreshDuration: number | null;
  batteryVoltage?: string | null;
  rssi?: string | null;
}

const DeviceUpdateStatus = ({
  deviceId,
  lastUpdateTime,
  nextExpectedUpdate,
  lastRefreshDuration,
  batteryVoltage,
  rssi
}: DeviceUpdateStatusProps) => {
  const [now, setNow] = useState(new Date());
  
  // Update the current time every minute to keep relative times fresh
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Format the last update time
  const formatLastUpdate = () => {
    if (!lastUpdateTime) return 'Never';
    
    try {
      const lastUpdate = new Date(lastUpdateTime);
      return formatDistanceToNow(lastUpdate, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting last update time:', error);
      return 'Unknown';
    }
  };
  
  // Format the next expected update time
  const formatNextUpdate = () => {
    if (!nextExpectedUpdate) return 'Unknown';
    
    try {
      const nextUpdate = new Date(nextExpectedUpdate);
      
      if (isPast(nextUpdate)) {
        return 'Overdue by ' + formatDistanceToNow(nextUpdate);
      }
      
      return formatDistance(now, nextUpdate, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting next update time:', error);
      return 'Unknown';
    }
  };
  
  // Determine the status of the device
  const getDeviceStatus = () => {
    if (!lastUpdateTime) return 'never-connected';
    if (!nextExpectedUpdate) return 'unknown';
    
    try {
      const nextUpdate = new Date(nextExpectedUpdate);
      const lastUpdate = new Date(lastUpdateTime);
      
      // If the last update was more than 24 hours ago, consider the device offline
      if (now.getTime() - lastUpdate.getTime() > 24 * 60 * 60 * 1000) {
        return 'offline';
      }
      
      // If the next update is overdue by more than 10 minutes, consider the device delayed
      if (isPast(nextUpdate) && now.getTime() - nextUpdate.getTime() > 10 * 60 * 1000) {
        return 'delayed';
      }
      
      // If the next update is in the past but not by much, consider it updating
      if (isPast(nextUpdate)) {
        return 'updating';
      }
      
      // Otherwise, the device is online and on schedule
      return 'online';
    } catch (error) {
      console.error('Error determining device status:', error);
      return 'unknown';
    }
  };
  
  // Get the appropriate badge color based on device status
  const getStatusBadge = () => {
    const status = getDeviceStatus();
    
    switch (status) {
      case 'online':
        return <Badge className="bg-green-500">Online</Badge>;
      case 'updating':
        return <Badge className="bg-blue-500">Updating</Badge>;
      case 'delayed':
        return <Badge className="bg-yellow-500">Delayed</Badge>;
      case 'offline':
        return <Badge className="bg-red-500">Offline</Badge>;
      case 'never-connected':
        return <Badge className="bg-gray-500">Never Connected</Badge>;
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };
  
  // Format the refresh duration in a human-readable way
  const formatRefreshDuration = () => {
    if (!lastRefreshDuration) return 'Unknown';
    
    if (lastRefreshDuration < 60) {
      return `${lastRefreshDuration} seconds`;
    } else if (lastRefreshDuration < 3600) {
      return `${Math.round(lastRefreshDuration / 60)} minutes`;
    } else {
      return `${Math.round(lastRefreshDuration / 3600)} hours`;
    }
  };
  
  // Format battery voltage
  const formatBattery = () => {
    if (!batteryVoltage) return null;
    
    // Assuming voltage range is typically 3.0V (low) to 4.2V (full)
    const voltage = parseFloat(batteryVoltage);
    let batteryIcon = <Battery className="h-4 w-4 text-red-500" />;
    let batteryText = 'Low';
    
    if (voltage >= 4.0) {
      batteryIcon = <Battery className="h-4 w-4 text-green-500" />;
      batteryText = 'Full';
    } else if (voltage >= 3.7) {
      batteryIcon = <Battery className="h-4 w-4 text-green-500" />;
      batteryText = 'Good';
    } else if (voltage >= 3.5) {
      batteryIcon = <Battery className="h-4 w-4 text-yellow-500" />;
      batteryText = 'Medium';
    } else if (voltage >= 3.3) {
      batteryIcon = <Battery className="h-4 w-4 text-orange-500" />;
      batteryText = 'Low';
    }
    
    return (
      <div className="flex items-center gap-1">
        {batteryIcon}
        <span>{batteryText} ({voltage.toFixed(2)}V)</span>
      </div>
    );
  };
  
  // Format RSSI (signal strength)
  const formatSignal = () => {
    if (!rssi) return null;
    
    // RSSI is typically negative, with values closer to 0 being stronger
    // -50 to -60 is excellent, -60 to -70 is good, -70 to -80 is fair, below -80 is poor
    const signal = parseInt(rssi, 10);
    let signalIcon = <Wifi className="h-4 w-4 text-red-500" />;
    let signalText = 'Poor';
    
    if (signal >= -60) {
      signalIcon = <Wifi className="h-4 w-4 text-green-500" />;
      signalText = 'Excellent';
    } else if (signal >= -70) {
      signalIcon = <Wifi className="h-4 w-4 text-green-500" />;
      signalText = 'Good';
    } else if (signal >= -80) {
      signalIcon = <Wifi className="h-4 w-4 text-yellow-500" />;
      signalText = 'Fair';
    }
    
    return (
      <div className="flex items-center gap-1">
        {signalIcon}
        <span>{signalText} ({signal} dBm)</span>
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Device Status</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>ID: {deviceId}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last Update:</span>
              <span className="font-medium">{formatLastUpdate()}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Refresh Interval:</span>
              <span className="font-medium">{formatRefreshDuration()}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Next Update:</span>
              <span className="font-medium">{formatNextUpdate()}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            {batteryVoltage && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Battery:</span>
                <span className="font-medium">{formatBattery()}</span>
              </div>
            )}
            
            {rssi && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Signal:</span>
                <span className="font-medium">{formatSignal()}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceUpdateStatus; 