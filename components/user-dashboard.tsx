"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/simple-auth-context"
import { dataStore } from "@/lib/data-store"
import { DashboardStats } from "@/components/dashboard-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "lucide-react"
import type { PrintJob, BillingRecord } from "@/lib/data-store"

export function UserDashboard() {
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([])
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    // Load data from localStorage
    const allJobs = dataStore.getPrintJobs()
    const userJobs = allJobs.filter((job) => job.uid === user.uid)
    setPrintJobs(userJobs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))

    const allBilling = dataStore.getBillingRecords()
    const userBilling = allBilling.filter((record) => record.uid === user.uid)
    setBillingRecords(userBilling.sort((a, b) => b.period.localeCompare(a.period)))

    setLoading(false)
  }, [user])

  if (loading) {
    return <div className="text-center py-8">Φόρτωση δεδομένων...</div>
  }

  const formatPrice = (price: number) => `€${price.toFixed(2).replace('.', ',')}`

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <DashboardStats />

      {/* Detailed Tables */}
      <Tabs defaultValue="billing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="billing">Ιστορικό Χρεώσεων</TabsTrigger>
          <TabsTrigger value="jobs">Ιστορικό Εκτυπώσεων</TabsTrigger>
        </TabsList>

        <TabsContent value="billing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ιστορικό Χρεώσεων</CardTitle>
              <CardDescription>Οι μηνιαίες χρεώσεις σας και η κατάσταση πληρωμών</CardDescription>
            </CardHeader>
            <CardContent>
              {billingRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Δεν υπάρχουν χρεώσεις. Τα δεδομένα θα δημιουργηθούν αυτόματα όταν επισκεφτείτε το admin panel.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Περίοδος</TableHead>
                      <TableHead>Συνολικό Κόστος</TableHead>
                      <TableHead>Πληρωμένο</TableHead>
                      <TableHead>Υπόλοιπο</TableHead>
                      <TableHead>Ημ. Εξόφλησης</TableHead>
                      <TableHead>Κατάσταση</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingRecords.map((record) => (
                      <TableRow key={record.billingId}>
                        <TableCell className="font-medium">{record.period}</TableCell>
                        <TableCell>{formatPrice(record.totalCost)}</TableCell>
                        <TableCell>{formatPrice(record.paidAmount || 0)}</TableCell>
                        <TableCell className={record.remainingBalance > 0 ? "text-red-600 font-semibold" : ""}>
                          {formatPrice(record.remainingBalance)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(record.dueDate).toLocaleDateString("el-GR")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={record.paid ? "default" : "destructive"}>
                            {record.paid ? "Πληρωμένο" : "Απλήρωτο"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ιστορικό Εκτυπώσεων</CardTitle>
              <CardDescription>Λεπτομερές ιστορικό όλων των εκτυπώσεων σας</CardDescription>
            </CardHeader>
            <CardContent>
              {printJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Δεν υπάρχουν εκτυπώσεις. Τα δεδομένα θα δημιουργηθούν αυτόματα όταν επισκεφτείτε το admin panel.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ημερομηνία</TableHead>
                      <TableHead>Εκτυπωτής</TableHead>
                      <TableHead>A4 Α/Μ</TableHead>
                      <TableHead>A4 Έγχρωμο</TableHead>
                      <TableHead>A3 Α/Μ</TableHead>
                      <TableHead>A3 Έγχρωμο</TableHead>
                      <TableHead>Σαρώσεις</TableHead>
                      <TableHead>Κόστος</TableHead>
                      <TableHead>Κατάσταση</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {printJobs.slice(0, 20).map((job) => (
                      <TableRow key={job.jobId}>
                        <TableCell>{new Date(job.timestamp).toLocaleDateString("el-GR")}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.deviceName || job.deviceIP}</Badge>
                        </TableCell>
                        <TableCell>{job.pagesA4BW || 0}</TableCell>
                        <TableCell>{job.pagesA4Color || 0}</TableCell>
                        <TableCell>{job.pagesA3BW || 0}</TableCell>
                        <TableCell>{job.pagesA3Color || 0}</TableCell>
                        <TableCell>{job.scans || 0}</TableCell>
                        <TableCell>{formatPrice(job.totalCost)}</TableCell>
                        <TableCell>
                          <Badge variant={job.status === "completed" ? "default" : "secondary"}>
                            {job.status === "completed" ? "Ολοκληρώθηκε" : job.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {printJobs.length > 20 && (
                <div className="text-center py-4 text-gray-500">
                  Εμφανίζονται οι πρόσφατες 20 εκτυπώσεις από συνολικά {printJobs.length}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
