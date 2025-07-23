"use client"

import { useEffect, useState } from "react"
import { dataStore } from "@/lib/data-store"
import { useAuth } from "@/lib/simple-auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import type { PrintJob } from "@/lib/data-store"

interface UsageData {
  month: string
  bwPages: number
  colorPages: number
  scans: number
  cost: number
}

export function UsageChart() {
  const [usageData, setUsageData] = useState<UsageData[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchUsageData = async () => {
      if (!user) return

      try {
        // Get jobs for the last 6 months
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const allJobs = dataStore.getPrintJobs()
        const userJobs = allJobs.filter((job) => job.uid === user.uid && new Date(job.timestamp) >= sixMonthsAgo)

        // Group by month
        const monthlyData = new Map<string, UsageData>()

        userJobs.forEach((job: PrintJob) => {
          const date = new Date(job.timestamp)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
          const monthName = date.toLocaleDateString("en-US", { month: "short" })

          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, {
              month: monthName,
              bwPages: 0,
              colorPages: 0,
              scans: 0,
              cost: 0,
            })
          }

          const data = monthlyData.get(monthKey)!
          data.bwPages += (job.pagesA4BW || 0) + (job.pagesA3BW || 0)
          data.colorPages += (job.pagesA4Color || 0) + (job.pagesA3Color || 0)
          data.scans += job.scans || 0
          data.cost += job.totalCost || 0
        })

        // Convert to array and sort by month
        const sortedData = Array.from(monthlyData.values())
          .sort((a, b) => {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            return monthNames.indexOf(a.month) - monthNames.indexOf(b.month)
          })
          .slice(-6) // Last 6 months

        setUsageData(sortedData)
      } catch (error) {
        console.error("Error fetching usage data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsageData()
  }, [user])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading usage data...</div>
        </CardContent>
      </Card>
    )
  }

  if (usageData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">No usage data available</div>
        </CardContent>
      </Card>
    )
  }

  const maxPages = Math.max(...usageData.map((d) => d.bwPages + d.colorPages))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Usage Trends
        </CardTitle>
        <CardDescription>Monthly printing activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {usageData.map((data) => (
            <div key={data.month} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{data.month}</span>
                <span className="text-sm text-gray-500">€{data.cost.toFixed(2)}</span>
              </div>
              <div className="flex gap-1 h-6">
                <div
                  className="bg-gray-400 rounded-l"
                  style={{ width: `${maxPages > 0 ? (data.bwPages / maxPages) * 100 : 0}%` }}
                  title={`B&W: ${data.bwPages} pages`}
                />
                <div
                  className="bg-blue-500 rounded-r"
                  style={{ width: `${maxPages > 0 ? (data.colorPages / maxPages) * 100 : 0}%` }}
                  title={`Color: ${data.colorPages} pages`}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>B&W: {data.bwPages}</span>
                <span>Color: {data.colorPages}</span>
                <span>Scans: {data.scans}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded"></div>
              <span>B&W Pages</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Color Pages</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
