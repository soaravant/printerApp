"use client"

import { useState, useEffect } from "react"
import { dummyDB } from "@/lib/dummy-database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreditCard, DollarSign, FileText, Download } from "lucide-react"
import type { PrintBilling, LaminationBilling, User } from "@/lib/dummy-database"
import * as XLSX from "xlsx"

export function BillingManagement() {
  const [printBilling, setPrintBilling] = useState<PrintBilling[]>([])
  const [laminationBilling, setLaminationBilling] = useState<LaminationBilling[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = () => {
    try {
      const printData = dummyDB.getAllPrintBilling()
      const laminationData = dummyDB.getAllLaminationBilling()
      const userData = dummyDB.getUsers()

      setPrintBilling(printData)
      setLaminationBilling(laminationData)
      setUsers(userData)
      setLoading(false)
    } catch (error) {
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία φόρτωσης δεδομένων χρέωσης",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const markAsPaid = (billingId: string, type: "print" | "lamination") => {
    try {
      if (type === "print") {
        dummyDB.updatePrintBilling(billingId, {
          paid: true,
          paidDate: new Date(),
          paidAmount: printBilling.find((b) => b.billingId === billingId)?.totalCost || 0,
          remainingBalance: 0,
        })
      } else {
        dummyDB.updateLaminationBilling(billingId, {
          paid: true,
          paidDate: new Date(),
          paidAmount: laminationBilling.find((b) => b.billingId === billingId)?.totalCost || 0,
          remainingBalance: 0,
        })
      }

      loadBillingData()
      toast({
        title: "Επιτυχία",
        description: "Η χρέωση σημειώθηκε ως πληρωμένη",
      })
    } catch (error) {
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία ενημέρωσης χρέωσης",
        variant: "destructive",
      })
    }
  }

  const exportBillingData = () => {
    const allBilling = [
      ...printBilling.map((b) => ({ ...b, type: "print" })),
      ...laminationBilling.map((b) => ({ ...b, type: "lamination" })),
    ]

    const headers = [
      "Type",
      "User",
      "Department",
      "Period",
      "Total Cost (€)",
      "Paid",
      "Paid Amount (€)",
      "Remaining (€)",
      "Due Date",
    ]
    const worksheetData = [
      headers,
      ...allBilling.map((billing) => [
        billing.type,
        billing.userDisplayName,
        billing.department,
        billing.period,
        billing.totalCost.toFixed(2),
        billing.paid ? "Yes" : "No",
        billing.paidAmount.toFixed(2),
        billing.remainingBalance.toFixed(2),
        billing.dueDate.toLocaleDateString("el-GR"),
      ])
    ]
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    
    // Style the header row (make it bold and add background color)
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { v: headers[col] }
      }
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" }
      }
    }
    
    // Set column widths
    const columnWidths = headers.map(header => Math.max(header.length * 1.2, 12))
    worksheet['!cols'] = columnWidths.map(width => ({ width }))
    
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")
    XLSX.writeFile(workbook, `billing_export_${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  const formatPrice = (price: number) => `€${price.toFixed(2).replace('.', ',')}`

  // Filter data based on selections
  const filteredPrintBilling = printBilling.filter((billing) => {
    if (selectedUser !== "all" && billing.uid !== selectedUser) return false
    if (selectedPeriod !== "all" && billing.period !== selectedPeriod) return false
    if (selectedStatus === "paid" && !billing.paid) return false
    if (selectedStatus === "unpaid" && billing.paid) return false
    return true
  })

  const filteredLaminationBilling = laminationBilling.filter((billing) => {
    if (selectedUser !== "all" && billing.uid !== selectedUser) return false
    if (selectedPeriod !== "all" && billing.period !== selectedPeriod) return false
    if (selectedStatus === "paid" && !billing.paid) return false
    if (selectedStatus === "unpaid" && billing.paid) return false
    return true
  })

  // Calculate statistics
  const totalPrintRevenue = filteredPrintBilling.reduce((sum, b) => sum + b.totalCost, 0)
  const totalLaminationRevenue = filteredLaminationBilling.reduce((sum, b) => sum + b.totalCost, 0)
  const totalUnpaidPrint = filteredPrintBilling.filter((b) => !b.paid).reduce((sum, b) => sum + b.remainingBalance, 0)
  const totalUnpaidLamination = filteredLaminationBilling
    .filter((b) => !b.paid)
    .reduce((sum, b) => sum + b.remainingBalance, 0)

  // Get unique periods for filter
  const allPeriods = [...new Set([...printBilling.map((b) => b.period), ...laminationBilling.map((b) => b.period)])]
    .sort()
    .reverse()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Φόρτωση δεδομένων χρέωσης...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Συνολικά Έσοδα Εκτυπώσεων</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalPrintRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Συνολικά Έσοδα Πλαστικοποιήσεων</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalLaminationRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ανεξόφλητες Εκτυπώσεις</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatPrice(totalUnpaidPrint)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ανεξόφλητες Πλαστικοποιήσεις</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatPrice(totalUnpaidLamination)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Φίλτρα</CardTitle>
          <CardDescription>Φιλτράρετε τα δεδομένα χρέωσης</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Χρήστης</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Όλοι οι χρήστες</SelectItem>
                  {users
                    .filter((u) => u.role === "user")
                    .map((user) => (
                      <SelectItem key={user.uid} value={user.uid}>
                        {user.displayName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Περίοδος</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Όλες οι περίοδοι</SelectItem>
                  {allPeriods.map((period) => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Κατάσταση</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Όλες</SelectItem>
                  <SelectItem value="paid">Πληρωμένες</SelectItem>
                  <SelectItem value="unpaid">Ανεξόφλητες</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ενέργειες</Label>
              <Button onClick={exportBillingData} variant="outline" className="w-full bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Εξαγωγή XLSX
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Billing Table */}
      <Card>
        <CardHeader>
          <CardTitle>Χρεώσεις Εκτυπώσεων</CardTitle>
          <CardDescription>
            Εμφανίζονται {filteredPrintBilling.length} από {printBilling.length} χρεώσεις
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Χρήστης</TableHead>
                  <TableHead>Τμήμα</TableHead>
                  <TableHead>Περίοδος</TableHead>
                  <TableHead>Σύνολο</TableHead>
                  <TableHead>Πληρωμένο</TableHead>
                  <TableHead>Υπόλοιπο</TableHead>
                  <TableHead>Κατάσταση</TableHead>
                  <TableHead>Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrintBilling.map((billing) => (
                  <TableRow key={billing.billingId}>
                    <TableCell className="font-medium">{billing.userDisplayName}</TableCell>
                    <TableCell>{billing.department}</TableCell>
                    <TableCell>{billing.period}</TableCell>
                    <TableCell>{formatPrice(billing.totalCost)}</TableCell>
                    <TableCell>{formatPrice(billing.paidAmount)}</TableCell>
                    <TableCell>{formatPrice(billing.remainingBalance)}</TableCell>
                    <TableCell>
                      {billing.paid ? (
                        <Badge className="bg-green-100 text-green-800">Πληρωμένο</Badge>
                      ) : (
                        <Badge variant="destructive">Ανεξόφλητο</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!billing.paid && (
                        <Button size="sm" onClick={() => markAsPaid(billing.billingId, "print")}>
                          Σήμανση ως Πληρωμένο
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Lamination Billing Table */}
      <Card>
        <CardHeader>
          <CardTitle>Χρεώσεις Πλαστικοποιήσεων</CardTitle>
          <CardDescription>
            Εμφανίζονται {filteredLaminationBilling.length} από {laminationBilling.length} χρεώσεις
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Χρήστης</TableHead>
                  <TableHead>Τμήμα</TableHead>
                  <TableHead>Περίοδος</TableHead>
                  <TableHead>Σύνολο</TableHead>
                  <TableHead>Πληρωμένο</TableHead>
                  <TableHead>Υπόλοιπο</TableHead>
                  <TableHead>Κατάσταση</TableHead>
                  <TableHead>Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLaminationBilling.map((billing) => (
                  <TableRow key={billing.billingId}>
                    <TableCell className="font-medium">{billing.userDisplayName}</TableCell>
                    <TableCell>{billing.department}</TableCell>
                    <TableCell>{billing.period}</TableCell>
                    <TableCell>{formatPrice(billing.totalCost)}</TableCell>
                    <TableCell>{formatPrice(billing.paidAmount)}</TableCell>
                    <TableCell>{formatPrice(billing.remainingBalance)}</TableCell>
                    <TableCell>
                      {billing.paid ? (
                        <Badge className="bg-green-100 text-green-800">Πληρωμένο</Badge>
                      ) : (
                        <Badge variant="destructive">Ανεξόφλητο</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!billing.paid && (
                        <Button size="sm" onClick={() => markAsPaid(billing.billingId, "lamination")}>
                          Σήμανση ως Πληρωμένο
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
