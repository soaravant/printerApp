"use client"

import { useEffect, useState } from "react"
import { dataStore } from "@/lib/data-store"
import { useAuth } from "@/lib/simple-auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Receipt, Printer, Calendar } from "lucide-react"

export function DashboardStats() {
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalCost: 0,
    unpaidAmount: 0,
    currentMonthJobs: 0,
    currentMonthCost: 0,
  })
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    const jobs = dataStore.getPrintJobs().filter((job) => job.uid === user.uid)
    const billingRecords = dataStore.getBillingRecords().filter((record) => record.uid === user.uid)

    // Τρέχων μήνας
    const now = new Date()
    const currentMonthJobs = jobs.filter((job) => {
      const jobDate = new Date(job.timestamp)
      return jobDate.getMonth() === now.getMonth() && jobDate.getFullYear() === now.getFullYear()
    })

    const totalCost = jobs.reduce((sum, job) => sum + job.totalCost, 0)
    const unpaidAmount = billingRecords
      .filter((record) => !record.paid)
      .reduce((sum, record) => sum + record.remainingBalance, 0)
    const currentMonthCost = currentMonthJobs.reduce((sum, job) => sum + job.totalCost, 0)

    setStats({
      totalJobs: jobs.length,
      totalCost,
      unpaidAmount,
      currentMonthJobs: currentMonthJobs.length,
      currentMonthCost,
    })
  }, [user])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Τρέχων Μήνας</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">€{stats.currentMonthCost.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">{stats.currentMonthJobs} εκτυπώσεις</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Απλήρωτα</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">€{stats.unpaidAmount.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Εκκρεμείς πληρωμές</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Συνολικές Εκτυπώσεις</CardTitle>
          <Printer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalJobs}</div>
          <p className="text-xs text-muted-foreground">Όλων των εποχών</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Συνολικό Κόστος</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">€{stats.totalCost.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Όλων των εποχών</p>
        </CardContent>
      </Card>
    </div>
  )
}
