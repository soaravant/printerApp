"use client"

import { useEffect, useState } from "react"
import { dataStore } from "@/lib/data-store"
import { useAuth } from "@/lib/simple-auth-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { BillingRecord } from "@/lib/data-store"

export function BillingTable() {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // Load billing records from localStorage
    const allRecords = dataStore.getBillingRecords()
    const userRecords = allRecords.filter((record) => record.uid === user.uid)
    setBillingRecords(userRecords.sort((a, b) => b.period.localeCompare(a.period)))
    setLoading(false)
  }, [user])

  if (loading) {
    return <div className="text-center py-4">Loading billing records...</div>
  }

  if (billingRecords.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No billing records found. Click "Demo Data" in the admin panel to generate test data.
      </div>
    )
  }

  const formatPrice = (price: number) => `€${price.toFixed(2).replace('.', ',')}`

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Period</TableHead>
          <TableHead>Total Cost</TableHead>
          <TableHead>Paid Amount</TableHead>
          <TableHead>Remaining</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {billingRecords.map((record) => (
          <TableRow key={record.billingId}>
            <TableCell>{record.period}</TableCell>
            <TableCell>{formatPrice(record.totalCost)}</TableCell>
            <TableCell>{formatPrice(record.paidAmount || 0)}</TableCell>
            <TableCell className={record.remainingBalance > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
              {formatPrice(record.remainingBalance)}
            </TableCell>
            <TableCell>
              <Badge variant={record.paid ? "default" : "destructive"}>{record.paid ? "Paid" : "Unpaid"}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
