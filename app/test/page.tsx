"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { defaultDevice } from "@/lib/defaultDevice"


export default function TestPage() {
  const testSetup = async () => {
    try {
      const response = await fetch('/api/setup', {
        headers: {
          'ID': defaultDevice.mac_address,
        },
      })
      const data = await response.json()
      console.log('Setup Response:', data)
    } catch (error) {
      console.error('Setup Error:', error)
    }
  }

  const testDisplay = async () => {
    try {
      const response = await fetch('/api/display', {
        headers: {
          'Access-Token': defaultDevice.api_key,
          'ID': defaultDevice.mac_address,
          'Refresh-Rate': defaultDevice.refresh_rate.toString(),
          'Battery-Voltage': '4.1',
          'FW-Version': '2.1.3',
          'RSSI': '-69',
        },
      })
      const data = await response.json()
      console.log('Display Response:', data)
    } catch (error) {
      console.error('Display Error:', error)
    }
  }

  const testLogs = async () => {
    try {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Token': defaultDevice.api_key,
        },
        body: JSON.stringify({
          log: 'Test log message from device',
        }),
      })
      const data = await response.json()
      console.log('Logs Response:', data)
    } catch (error) {
      console.error('Logs Error:', error)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">API Testing Page</h1>
      
      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>Setup Endpoint</CardTitle>
              <CardDescription>Test the device setup endpoint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex flex-col space-y-2">
                  <label>MAC Address</label>
                  <Input value={defaultDevice.mac_address} readOnly />
                </div>
                <Button onClick={testSetup}>Test Setup</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle>Display Endpoint</CardTitle>
              <CardDescription>Test the display content endpoint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex flex-col space-y-2">
                  <label>API Key</label>
                  <Input value={defaultDevice.api_key} readOnly />
                </div>
                <div className="flex flex-col space-y-2">
                  <label>MAC Address</label>
                  <Input value={defaultDevice.mac_address} readOnly />
                </div>
                <Button onClick={testDisplay}>Test Display</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs Endpoint</CardTitle>
              <CardDescription>Test the device logs endpoint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex flex-col space-y-2">
                  <label>API Key</label>
                  <Input value={defaultDevice.api_key} readOnly />
                </div>
                <Button onClick={testLogs}>Test Logs</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Response Console</CardTitle>
            <CardDescription>Check the browser console for API responses</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
} 