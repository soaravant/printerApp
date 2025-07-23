"use client"

import { useState, useEffect } from "react"
import { dataStore } from "@/lib/data-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/simple-auth-context"
import { CreditCard, Download, Calendar, Euro } from "lucide-react"
import type { BillingRecord } from "@/lib/data-store"

export function BillingManagement() {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const records = dataStore.getBillingRecords()
    setBillingRecords(records.sort((a, b) => b.period.localeCompare(a.period)))
  }, [])

  const processPayment = async () => {
    if (!selectedRecord || !user) return

    setLoading(true)
    try {
      const amount = Number.parseFloat(paymentAmount)
      const newBalance = Math.max(0, selectedRecord.remainingBalance - amount)

      // Update billing record
      dataStore.updateBillingRecord(selectedRecord.billingId, {
        remainingBalance: newBalance,
        paid: newBalance === 0,
        paidDate: newBalance === 0 ? new Date() : selectedRecord.paidDate,
        paidAmount: (selectedRecord.paidAmount || 0) + amount,
      })

      // Refresh the records
      const updatedRecords = dataStore.getBillingRecords()
      setBillingRecords(updatedRecords.sort((a, b) => b.period.localeCompare(a.period)))

      toast({
        title: "Επιτυχία",
        description: `Η πληρωμή €${amount.toFixed(2)} καταχωρήθηκε επιτυχώς`,
      })

      setSelectedRecord(null)
      setPaymentAmount("")
      setPaymentNotes("")
    } catch (error) {
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία καταχώρησης πληρωμής",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const markAsUnpaid = async (record: BillingRecord) => {
    try {
      dataStore.updateBillingRecord(record.billingId, {
        paid: false,
        remainingBalance: record.totalCost,
        paidAmount: 0,
        paidDate: undefined,
      })

      // Refresh the records
      const updatedRecords = dataStore.getBillingRecords()
      setBillingRecords(updatedRecords.sort((a, b) => b.period.localeCompare(a.period)))

      toast({
        title: "Επιτυχία",
        description: "Η χρέωση επισημάνθηκε ως απλήρωτη",
      })
    } catch (error) {
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία ενημέρωσης χρέωσης",
        variant: "destructive",
      })
    }
  }

  const exportToExcel = () => {
    // Simple CSV export since we removed xlsx dependency
    const csvContent = [
      "Χρήστης,Τμήμα,Περίοδος,A4 Α/Μ,A4 Έγχρωμο,A3 Α/Μ,A3 Έγχρωμο,Σαρώσεις,Φωτοαντίγραφα,Συνολικό Κόστος,Πληρωμένο Ποσό,Υπόλοιπο,Κατάσταση,Ημερομηνία Εξόφλησης,Ημερομηνία Πληρωμής",
      ...billingRecords.map((record) =>
        [
          record.userDisplayName,
          record.department,
          record.period,
          record.totalA4BW,
          record.totalA4Color,
          record.totalA3BW,
          record.totalA3Color,
          record.totalScans,
          record.totalCopies,
          `€${record.totalCost.toFixed(2)}`,
          `€${(record.paidAmount || 0).toFixed(2)}`,
          `€${record.remainingBalance.toFixed(2)}`,
          record.paid ? "Πληρωμένο" : "Απλήρωτο",
          record.dueDate.toLocaleDateString("el-GR"),
          record.paidDate?.toLocaleDateString("el-GR") || "-",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `χρεωσεις_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Επιτυχία",
      description: "Το αρχείο CSV εξήχθη επιτυχώς",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Διαχείριση Χρεώσεων
          </CardTitle>
          <CardDescription>Διαχειριστείτε τις πληρωμές και τα υπόλοιπα των χρηστών</CardDescription>
          <div className="flex gap-2">
            <Button onClick={exportToExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Εξαγωγή σε CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {billingRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Δεν υπάρχουν χρεώσεις. Κάντε κλικ στο "Δεδομένα Demo" για να δημιουργήσετε δεδομένα δοκιμής.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Χρήστης</TableHead>
                  <TableHead>Τμήμα</TableHead>
                  <TableHead>Περίοδος</TableHead>
                  <TableHead>Συνολικό Κόστος</TableHead>
                  <TableHead>Πληρωμένο</TableHead>
                  <TableHead>Υπόλοιπο</TableHead>
                  <TableHead>Ημ. Εξόφλησης</TableHead>
                  <TableHead>Κατάσταση</TableHead>
                  <TableHead>Ενέργειες</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billingRecords.map((record) => (
                  <TableRow key={record.billingId}>
                    <TableCell className="font-medium">{record.userDisplayName}</TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell>{record.period}</TableCell>
                    <TableCell>€{record.totalCost.toFixed(2)}</TableCell>
                    <TableCell>€{(record.paidAmount || 0).toFixed(2)}</TableCell>
                    <TableCell
                      className={record.remainingBalance > 0 ? "text-red-600 font-semibold" : "text-green-600"}
                    >
                      €{record.remainingBalance.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {record.dueDate.toLocaleDateString("el-GR")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.paid ? "default" : "destructive"}>
                        {record.paid ? "Πληρωμένο" : "Απλήρωτο"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!record.paid && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" onClick={() => setSelectedRecord(record)}>
                                <Euro className="h-4 w-4 mr-1" />
                                Πληρωμή
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Καταχώρηση Πληρωμής</DialogTitle>
                                <DialogDescription>
                                  Χρήστης: {record.userDisplayName} | Υπόλοιπο: €{record.remainingBalance.toFixed(2)}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="amount">Ποσό Πληρωμής (€)</Label>
                                  <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    max={record.remainingBalance}
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder="0.00"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="notes">Σημειώσεις</Label>
                                  <Textarea
                                    id="notes"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    placeholder="Προαιρετικές σημειώσεις..."
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button onClick={processPayment} disabled={loading || !paymentAmount}>
                                    {loading ? "Επεξεργασία..." : "Καταχώρηση"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setPaymentAmount(record.remainingBalance.toString())}
                                  >
                                    Πλήρης Εξόφληση
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        {record.paid && (
                          <Button size="sm" variant="outline" onClick={() => markAsUnpaid(record)}>
                            Επισήμανση ως Απλήρωτο
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
