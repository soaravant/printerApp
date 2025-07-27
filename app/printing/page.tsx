"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { dummyDB } from "@/lib/dummy-database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { Printer, Calendar, FileText } from "lucide-react"
import type { PrintJob, PrintBilling } from "@/lib/dummy-database"
import { HistoryFilter, type FilterConfig } from "@/components/history-filter"

export default function PrintingPage() {
  const { user } = useAuth()
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([])
  const [printBilling, setPrintBilling] = useState<PrintBilling[]>([])
  const [filteredPrintJobs, setFilteredPrintJobs] = useState<PrintJob[]>([])
  const [filteredPrintBilling, setFilteredPrintBilling] = useState<PrintBilling[]>([])

  useEffect(() => {
    if (!user) return

    const userJobs = dummyDB.getPrintJobs(user.uid)
    const userBilling = dummyDB.getPrintBilling(user.uid)

    setPrintJobs(userJobs)
    setPrintBilling(userBilling)

    setFilteredPrintJobs(userJobs)
    setFilteredPrintBilling(userBilling)
  }, [user])

  if (!user) return null

  const totalUnpaid = printBilling.filter((b) => !b.paid).reduce((sum, b) => sum + b.remainingBalance, 0)
  const totalJobs = printJobs.length
  const totalCost = printJobs.reduce((sum, j) => sum + j.totalCost, 0)

  const printBillingFilterConfig: FilterConfig = {
    searchFields: ["period"],
    statusField: "paid",
    statusOptions: [
      { value: "paid", label: "Πληρωμένο" },
      { value: "unpaid", label: "Απλήρωτο" },
    ],
  }

  const printJobsFilterConfig: FilterConfig = {
    searchFields: ["deviceName", "deviceIP"],
    dateField: "timestamp",
    statusField: "status",
    statusOptions: [
      { value: "completed", label: "Ολοκληρώθηκε" },
      { value: "pending", label: "Εκκρεμεί" },
      { value: "failed", label: "Αποτυχία" },
    ],
  }

  const formatPrice = (price: number) => `€${price.toFixed(2).replace('.', ',')}`

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Εκτυπώσεις</h1>
              <p className="text-gray-600">Ιστορικό και χρεώσεις εκτυπώσεων</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Οφειλόμενα</CardTitle>
                  <Printer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatPrice(totalUnpaid)}</div>
                  <p className="text-xs text-muted-foreground">Απλήρωτες χρεώσεις</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Συνολικές Εκτυπώσεις</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalJobs}</div>
                  <p className="text-xs text-muted-foreground">Όλων των εποχών</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Συνολικό Κόστος</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPrice(totalCost)}</div>
                  <p className="text-xs text-muted-foreground">Όλων των εποχών</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="billing" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="billing"
                  className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                >
                  Ιστορικό Χρεώσεων
                </TabsTrigger>
                <TabsTrigger value="jobs" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  Ιστορικό Εκτυπώσεων
                </TabsTrigger>
              </TabsList>

              <TabsContent value="billing" className="mt-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <HistoryFilter
                    data={printBilling}
                    config={printBillingFilterConfig}
                    onFilteredData={setFilteredPrintBilling}
                    title="Φίλτρα Χρεώσεων"
                  />
                  <Card>
                    <CardHeader>
                      <CardTitle>Χρεώσεις Εκτυπώσεων</CardTitle>
                      <CardDescription>Μηνιαίες χρεώσεις και κατάσταση πληρωμών</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                                              <TableRow>
                      <TableHead className="text-center">Περίοδος</TableHead>
                      <TableHead className="text-center">A4 Α/Μ</TableHead>
                      <TableHead className="text-center">A4 Έγχρωμο</TableHead>
                      <TableHead className="text-center">A3 Α/Μ</TableHead>
                      <TableHead className="text-center">A3 Έγχρωμο</TableHead>
                      <TableHead className="text-center">Συνολικό Κόστος</TableHead>
                      <TableHead className="text-center">Πληρωμένο</TableHead>
                      <TableHead className="text-center">Υπόλοιπο</TableHead>
                      <TableHead className="text-center">Ημ/νία Λήξης</TableHead>
                      <TableHead className="text-center">Κατάσταση</TableHead>
                    </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPrintBilling.map((billing) => (
                            <TableRow key={billing.billingId}>
                              <TableCell className="text-center font-medium">{billing.period}</TableCell>
                              <TableCell className="text-center">{billing.totalA4BW}</TableCell>
                              <TableCell className="text-center">{billing.totalA4Color}</TableCell>
                              <TableCell className="text-center">{billing.totalA3BW}</TableCell>
                              <TableCell className="text-center">{billing.totalA3Color}</TableCell>
                              <TableCell className="text-center">{formatPrice(billing.totalCost)}</TableCell>
                              <TableCell className="text-center">{formatPrice(billing.paidAmount)}</TableCell>
                              <TableCell className={`text-center ${billing.remainingBalance > 0 ? "text-red-600 font-semibold" : ""}`}>
                                {formatPrice(billing.remainingBalance)}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {billing.dueDate.toLocaleDateString("el-GR")}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={billing.paid ? "default" : "destructive"}>
                                  {billing.paid ? "Πληρωμένο" : "Απλήρωτο"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="jobs" className="mt-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <HistoryFilter
                    data={printJobs}
                    config={printJobsFilterConfig}
                    onFilteredData={setFilteredPrintJobs}
                    title="Φίλτρα Εκτυπώσεων"
                  />
                  <Card>
                    <CardHeader>
                      <CardTitle>Ιστορικό Εκτυπώσεων</CardTitle>
                      <CardDescription>Λεπτομερές ιστορικό όλων των εκτυπώσεων</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                                              <TableRow>
                      <TableHead className="text-center">Ημερομηνία</TableHead>
                      <TableHead className="text-center">Εκτυπωτής</TableHead>
                      <TableHead className="text-center">A4 Α/Μ</TableHead>
                      <TableHead className="text-center">A4 Έγχρωμο</TableHead>
                      <TableHead className="text-center">A3 Α/Μ</TableHead>
                      <TableHead className="text-center">A3 Έγχρωμο</TableHead>
                      <TableHead className="text-center">Κόστος</TableHead>
                      <TableHead className="text-center">Κατάσταση</TableHead>
                    </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredPrintJobs.map((job) => (
                            <TableRow key={job.jobId}>
                              <TableCell className="text-center">{job.timestamp.toLocaleDateString("el-GR")}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline">{job.deviceName}</Badge>
                              </TableCell>
                              <TableCell className="text-center">{job.pagesA4BW}</TableCell>
                              <TableCell className="text-center">{job.pagesA4Color}</TableCell>
                              <TableCell className="text-center">{job.pagesA3BW}</TableCell>
                              <TableCell className="text-center">{job.pagesA3Color}</TableCell>
                              <TableCell className="text-center">{formatPrice(job.totalCost)}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant={job.status === "completed" ? "default" : "secondary"}>
                                  {job.status === "completed" ? "Ολοκληρώθηκε" : job.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
