"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calculator } from "lucide-react"

const BW_RATE = 0.05
const COLOR_RATE = 0.15
const SCAN_RATE = 0.02

export function CostCalculator() {
  const [bwPages, setBwPages] = useState(0)
  const [colorPages, setColorPages] = useState(0)
  const [scans, setScans] = useState(0)

  const totalCost = bwPages * BW_RATE + colorPages * COLOR_RATE + scans * SCAN_RATE

  const reset = () => {
    setBwPages(0)
    setColorPages(0)
    setScans(0)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Cost Calculator
        </CardTitle>
        <CardDescription>Estimate printing costs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bw-pages">B&W Pages</Label>
            <Input
              id="bw-pages"
              type="number"
              min="0"
              value={bwPages}
              onChange={(e) => setBwPages(Number(e.target.value))}
            />
            <p className="text-xs text-gray-500">${BW_RATE} per page</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color-pages">Color Pages</Label>
            <Input
              id="color-pages"
              type="number"
              min="0"
              value={colorPages}
              onChange={(e) => setColorPages(Number(e.target.value))}
            />
            <p className="text-xs text-gray-500">${COLOR_RATE} per page</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scans">Scans</Label>
            <Input id="scans" type="number" min="0" value={scans} onChange={(e) => setScans(Number(e.target.value))} />
            <p className="text-xs text-gray-500">${SCAN_RATE} per scan</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Total Cost:</span>
            <span className="text-2xl font-bold text-green-600">${totalCost.toFixed(2)}</span>
          </div>
          <Button onClick={reset} variant="outline" className="w-full mt-2 bg-transparent">
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
