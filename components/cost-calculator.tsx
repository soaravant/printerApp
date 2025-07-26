"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calculator, FileText } from "lucide-react"

interface CostBreakdown {
  a4BW: number
  a4Color: number
  a3BW: number
  a3Color: number
  total: number
}

export function CostCalculator() {
  const [quantities, setQuantities] = useState({
    a4BW: 0,
    a4Color: 0,
    a3BW: 0,
    a3Color: 0,
  })

  // Default pricing (should come from database in production)
  const prices = {
    a4BW: 0.05,
    a4Color: 0.15,
    a3BW: 0.1,
    a3Color: 0.3,
  }

  const formatPrice = (price: number) => `€${price.toFixed(3).replace('.', ',')}`

  const calculateCosts = (): CostBreakdown => {
    return {
      a4BW: quantities.a4BW * prices.a4BW,
      a4Color: quantities.a4Color * prices.a4Color,
      a3BW: quantities.a3BW * prices.a3BW,
      a3Color: quantities.a3Color * prices.a3Color,
      total:
        quantities.a4BW * prices.a4BW +
        quantities.a4Color * prices.a4Color +
        quantities.a3BW * prices.a3BW +
        quantities.a3Color * prices.a3Color,
    }
  }

  const costs = calculateCosts()

  const handleQuantityChange = (type: keyof typeof quantities, value: string) => {
    const numValue = Math.max(0, Number.parseInt(value) || 0)
    setQuantities((prev) => ({ ...prev, [type]: numValue }))
  }

  const resetCalculator = () => {
    setQuantities({
      a4BW: 0,
      a4Color: 0,
      a3BW: 0,
      a3Color: 0,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Cost Calculator
        </CardTitle>
        <CardDescription>Calculate printing costs based on current pricing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="a4bw">A4 Black & White</Label>
            <div className="flex items-center gap-2">
              <Input
                id="a4bw"
                type="number"
                min="0"
                value={quantities.a4BW || ""}
                onChange={(e) => handleQuantityChange("a4BW", e.target.value)}
                placeholder="0"
              />
              <span className="text-sm text-gray-500">{formatPrice(prices.a4BW)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="a4color">A4 Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="a4color"
                type="number"
                min="0"
                value={quantities.a4Color || ""}
                onChange={(e) => handleQuantityChange("a4Color", e.target.value)}
                placeholder="0"
              />
              <span className="text-sm text-gray-500">{formatPrice(prices.a4Color)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="a3bw">A3 Black & White</Label>
            <div className="flex items-center gap-2">
              <Input
                id="a3bw"
                type="number"
                min="0"
                value={quantities.a3BW || ""}
                onChange={(e) => handleQuantityChange("a3BW", e.target.value)}
                placeholder="0"
              />
              <span className="text-sm text-gray-500">{formatPrice(prices.a3BW)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="a3color">A3 Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="a3color"
                type="number"
                min="0"
                value={quantities.a3Color || ""}
                onChange={(e) => handleQuantityChange("a3Color", e.target.value)}
                placeholder="0"
              />
              <span className="text-sm text-gray-500">{formatPrice(prices.a3Color)}</span>
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Cost Breakdown
          </h3>
          <div className="space-y-2 text-sm">
            {costs.a4BW > 0 && (
              <div className="flex justify-between">
                <span>A4 B&W ({quantities.a4BW} pages)</span>
                <span>{formatPrice(costs.a4BW)}</span>
              </div>
            )}
            {costs.a4Color > 0 && (
              <div className="flex justify-between">
                <span>A4 Color ({quantities.a4Color} pages)</span>
                <span>{formatPrice(costs.a4Color)}</span>
              </div>
            )}
            {costs.a3BW > 0 && (
              <div className="flex justify-between">
                <span>A3 B&W ({quantities.a3BW} pages)</span>
                <span>{formatPrice(costs.a3BW)}</span>
              </div>
            )}
            {costs.a3Color > 0 && (
              <div className="flex justify-between">
                <span>A3 Color ({quantities.a3Color} pages)</span>
                <span>{formatPrice(costs.a3Color)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total Cost</span>
              <span>{formatPrice(costs.total)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={resetCalculator} variant="outline" className="flex-1 bg-transparent">
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
