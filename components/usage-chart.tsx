"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

interface ChartData {
  label: string
  printValue: number
  laminationValue: number
}

interface UsageChartProps {
  data: ChartData[]
  title: string
  printLabel: string
  laminationLabel: string
}

const UsageChart = ({ data, title, printLabel, laminationLabel }: UsageChartProps) => {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Δεν υπάρχουν δεδομένα</div>
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.printValue, d.laminationValue)))
  const formatPrice = (price: number) => `€${price.toFixed(2).replace('.', ',')}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{item.label}</span>
                <div className="text-xs text-gray-500">
                  {printLabel}: {formatPrice(item.printValue)} | {laminationLabel}: {formatPrice(item.laminationValue)}
                </div>
              </div>
              <div className="flex gap-1 h-6">
                <div
                  className="bg-blue-500 rounded-l"
                  style={{ width: `${maxValue > 0 ? (item.printValue / maxValue) * 100 : 0}%` }}
                  title={`${printLabel}: ${formatPrice(item.printValue)}`}
                />
                <div
                  className="bg-green-500 rounded-r"
                  style={{ width: `${maxValue > 0 ? (item.laminationValue / maxValue) * 100 : 0}%` }}
                  title={`${laminationLabel}: ${formatPrice(item.laminationValue)}`}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>{printLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>{laminationLabel}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default UsageChart
