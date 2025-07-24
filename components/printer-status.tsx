"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Printer, Wifi, WifiOff, AlertTriangle } from "lucide-react"

interface PrinterStatus {
  ip: string
  name: string
  status: "online" | "offline" | "error"
  lastSeen: Date
  jobsToday: number
  paperLevel: number
  tonerLevel: number
}

export function PrinterStatus() {
  const [printers, setPrinters] = useState<PrinterStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Mock data for demonstration
  const mockPrinters: PrinterStatus[] = [
    {
      ip: "192.168.3.41",
      name: "Canon iR-ADV C3330",
      status: "online",
      lastSeen: new Date(),
      jobsToday: 47,
      paperLevel: 85,
      tonerLevel: 62,
    },
    {
      ip: "192.168.3.42",
      name: "HP LaserJet Pro M404",
      status: "online",
      lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      jobsToday: 23,
      paperLevel: 45,
      tonerLevel: 78,
    },
  ]

  useEffect(() => {
    // Simulate loading printer status
    const timer = setTimeout(() => {
      setPrinters(mockPrinters)
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const refreshStatus = async () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setPrinters(mockPrinters)
      setLastUpdate(new Date())
      setLoading(false)
    }, 1000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <Wifi className="h-4 w-4 text-green-500" />
      case "offline":
        return <WifiOff className="h-4 w-4 text-red-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-100 text-green-800">Online</Badge>
      case "offline":
        return <Badge variant="destructive">Offline</Badge>
      case "error":
        return <Badge className="bg-yellow-100 text-yellow-800">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getLevelColor = (level: number) => {
    if (level > 50) return "bg-green-500"
    if (level > 20) return "bg-yellow-500"
    return "bg-red-500"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Printer Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading printer status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Printer Status
            </CardTitle>
            <CardDescription>Last updated: {lastUpdate.toLocaleTimeString()}</CardDescription>
          </div>
          <Button onClick={refreshStatus} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {printers.map((printer) => (
            <div key={printer.ip} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(printer.status)}
                  <h3 className="font-semibold">{printer.name}</h3>
                </div>
                {getStatusBadge(printer.status)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">IP Address</p>
                  <p className="font-mono">{printer.ip}</p>
                </div>
                <div>
                  <p className="text-gray-600">Jobs Today</p>
                  <p className="font-semibold">{printer.jobsToday}</p>
                </div>
                <div>
                  <p className="text-gray-600">Paper Level</p>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div
                        className={`h-2 rounded-full ${getLevelColor(printer.paperLevel)}`}
                        style={{ width: `${printer.paperLevel}%` }}
                      />
                    </div>
                    <span className="text-xs">{printer.paperLevel}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600">Toner Level</p>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div
                        className={`h-2 rounded-full ${getLevelColor(printer.tonerLevel)}`}
                        style={{ width: `${printer.tonerLevel}%` }}
                      />
                    </div>
                    <span className="text-xs">{printer.tonerLevel}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
