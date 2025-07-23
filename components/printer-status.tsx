"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Printer, Wifi, WifiOff } from "lucide-react"

interface PrinterStatus {
  ip: string
  status: "online" | "offline" | "unknown"
  lastSeen?: Date
}

export function PrinterStatus() {
  const [printers, setPrinters] = useState<PrinterStatus[]>([
    { ip: "192.168.3.41", status: "unknown" },
    { ip: "192.168.3.42", status: "unknown" },
  ])

  useEffect(() => {
    // In a real implementation, you'd fetch this from your backend
    // For now, we'll simulate printer status
    const checkPrinterStatus = () => {
      setPrinters((prev) =>
        prev.map((printer) => ({
          ...printer,
          status: Math.random() > 0.2 ? "online" : "offline",
          lastSeen: new Date(),
        })),
      )
    }

    checkPrinterStatus()
    const interval = setInterval(checkPrinterStatus, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Printer Status
        </CardTitle>
        <CardDescription>Network printer availability</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {printers.map((printer) => (
            <div key={printer.ip} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {printer.status === "online" ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="font-mono text-sm">{printer.ip}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={printer.status === "online" ? "default" : "destructive"}>{printer.status}</Badge>
                {printer.lastSeen && (
                  <span className="text-xs text-gray-500">{printer.lastSeen.toLocaleTimeString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
