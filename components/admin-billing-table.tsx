"use client"

import { useEffect, useState } from "react"
import { dataStore } from "@/lib/data-store"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { BillingRecord } from "@/lib/data-store"

export function AdminBillingTable() {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Load billing records from localStorage
    const records = dataStore.getBillingRecords()
    setBillingRecords(records.sort((a, b) => b.period.localeCompare(a.period)))
    setLoading(false)
  }, [])

  const togglePaidStatus = async (billingId: string, currentPaid: boolean) => {
    try {
      dataStore.updateBillingRecord(billingId, {
        paid: !currentPaid,
        remainingBalance: !currentPaid ? 0 : billingRecords.find((r) => r.billingId === billingId)?.totalCost || 0,
        paidAmount: !currentPaid ? billingRecords.find((r) => r.billingId === billingId)?.totalCost || 0 : 0,
        paidDate: !currentPaid ? new Date() : undefined,
      })

      // Refresh records
      const updatedRecords = dataStore.getBillingRecords()
      setBillingRecords(updatedRecords.sort((a, b) => b.period.localeCompare(a.period)))

      toast({
        title: "Success",
        description: `Billing record marked as ${!currentPaid ? "paid" : "unpaid"}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update billing record",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading billing records...</div>
  }

  if (billingRecords.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No billing records found. Click "Demo Data" to generate test data.
      </div>
    )
  }

  return (
    <Table>
              <TableHeader className="bg-gray-100">
        <TableRow>
          <TableHead>Period</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Total Cost</TableHead>
          <TableHead>Remaining</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {billingRecords.map((record) => (
          <TableRow key={record.billingId}>
            <TableCell>{record.period}</TableCell>
            <TableCell>{record.userDisplayName}</TableCell>
            <TableCell>{record.department}</TableCell>
            <TableCell>€{record.totalCost.toFixed(2)}</TableCell>
            <TableCell className={record.remainingBalance > 0 ? "text-red-600 font-semibold" : "text-green-600"}>
              €{record.remainingBalance.toFixed(2)}
            </TableCell>
            <TableCell>
              <Badge variant={record.paid ? "default" : "destructive"}>{record.paid ? "Paid" : "Unpaid"}</Badge>
            </TableCell>
            <TableCell>
              <Button size="sm" variant="outline" onClick={() => togglePaidStatus(record.billingId, record.paid)}>
                Mark as {record.paid ? "Unpaid" : "Paid"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
