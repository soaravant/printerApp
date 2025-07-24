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
import { CreditCard, Calendar, Package } from "lucide-react"
import type { LaminationJob, LaminationBilling } from "@/lib/dummy-database"
import { HistoryFilter, type FilterConfig } from "@/components/history-filter"

export default function LaminationPage() {
  const { user } = useAuth()
  const [laminationJobs, setLaminationJobs] = useState<LaminationJob[]>([])
  const [laminationBilling, setLaminationBilling] = useState<LaminationBilling[]>([])
  const [filteredLaminationJobs, setFilteredLaminationJobs] = useState<LaminationJob[]>([])
  const [filteredLaminationBilling, setFilteredLaminationBilling] = useState<LaminationBilling[]>([])

  useEffect(() => {
    if (!user) return

    const userJobs = dummyDB.getLaminationJobs(user.uid)
    const userBilling = dummyDB.getLaminationBilling(user.uid)

    setLaminationJobs(userJobs)
    setLaminationBilling(userBilling)

    setFilteredLaminationJobs(userJobs)
    setFilteredLaminationBilling(userBilling)
  }, [user])

  if (!user) return null

  const getLaminationTypeLabel = (type: string) => {
    switch (type) {
      case "A3":
        return "A3"
      case "A4":
        return "A4"
      case "card_small":
        return "Κάρτα Μικρή"
      case "card_large":
        return "Κάρτα Μεγάλη"
      default:
        return type
    }
  }

  const totalUnpaid = laminationBilling.filter((b) => !b.paid).reduce((sum, b) => sum + b.remainingBalance, 0)
  const totalJobs = laminationJobs.length
  const totalCost = laminationJobs.reduce((sum, j) => sum + j.totalCost, 0)

  const laminationBillingFilterConfig: FilterConfig = {
    searchFields: ["period"],
    statusField: "paid",
    statusOptions: [
      { value: "paid", label: "Πληρωμένο" },
      { value: "unpaid", label: "Απλήρωτο" },
    ],
  }

  const laminationJobsFilterConfig: FilterConfig = {
    searchFields: ["type", "notes"],
    dateField: "timestamp",
    statusField: "status",
    statusOptions: [
      { value: "completed", label: "Ολοκληρώθηκε" },
      { value: "pending", label: "Εκκρεμεί" },
      { value: "failed", label: "Αποτυχία" },
    ],
    customFilters: [
      {
        field: "type",
        label: "Τύπος",
        options: [
          { value: "A3", label: "A3" },
          { value: "A4", label: "A4" },
          { value: "card_small", label: "Κάρτα Μικρή" },
          { value: "card_large", label: "Κάρτα Μεγάλη" },
        ],
      },
    ],
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Πλαστικοποιήσεις</h1>
              <p className="text-gray-600">Ιστορικό και χρεώσεις πλαστικοποιήσεων</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Οφειλόμενα</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">€{totalUnpaid.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Απλήρωτες χρεώσεις</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Συνολικές Πλαστικοποιήσεις</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
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
                  <div className="text-2xl font-bold">€{totalCost.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Όλων των εποχών</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="billing" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="billing"
                  className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
                >
                  Ιστορικό Χρεώσεων
                </TabsTrigger>
                <TabsTrigger
                  value="jobs"
                  className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
                >
                  Ιστορικό Πλαστικοποιήσεων
                </TabsTrigger>
              </TabsList>

              <TabsContent value="billing" className="mt-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <HistoryFilter
                    data={laminationBilling}
                    config={laminationBillingFilterConfig}
                    onFilteredData={setFilteredLaminationBilling}
                    title="Φίλτρα Χρεώσεων"
                  />
                  <Card>
                    <CardHeader>
                      <CardTitle>Χρεώσεις Πλαστικοποιήσεων</CardTitle>
                      <CardDescription>Μηνιαίες χρεώσεις και κατάσταση πληρωμών</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Περίοδος</TableHead>
                            <TableHead>A3</TableHead>
                            <TableHead>A4</TableHead>
                            <TableHead>Κάρτα Μικρή</TableHead>
                            <TableHead>Κάρτα Μεγάλη</TableHead>
                            <TableHead>Συνολικό Κόστος</TableHead>
                            <TableHead>Πληρωμένο</TableHead>
                            <TableHead>Υπόλοιπο</TableHead>
                            <TableHead>Ημ. Εξόφλησης</TableHead>
                            <TableHead>Κατάσταση</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLaminationBilling.map((billing) => (
                            <TableRow key={billing.billingId}>
                              <TableCell className="font-medium">{billing.period}</TableCell>
                              <TableCell>{billing.totalA3}</TableCell>
                              <TableCell>{billing.totalA4}</TableCell>
                              <TableCell>{billing.totalCardSmall}</TableCell>
                              <TableCell>{billing.totalCardLarge}</TableCell>
                              <TableCell>€{billing.totalCost.toFixed(2)}</TableCell>
                              <TableCell>€{billing.paidAmount.toFixed(2)}</TableCell>
                              <TableCell className={billing.remainingBalance > 0 ? "text-red-600 font-semibold" : ""}>
                                €{billing.remainingBalance.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {billing.dueDate.toLocaleDateString("el-GR")}
                                </div>
                              </TableCell>
                              <TableCell>
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
                <div className="bg-green-50 p-6 rounded-lg">
                  <HistoryFilter
                    data={laminationJobs}
                    config={laminationJobsFilterConfig}
                    onFilteredData={setFilteredLaminationJobs}
                    title="Φίλτρα Πλαστικοποιήσεων"
                  />
                  <Card>
                    <CardHeader>
                      <CardTitle>Ιστορικό Πλαστικοποιήσεων</CardTitle>
                      <CardDescription>Λεπτομερές ιστορικό όλων των πλαστικοποιήσεων</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ημερομηνία</TableHead>
                            <TableHead>Τύπος</TableHead>
                            <TableHead>Ποσότητα</TableHead>
                            <TableHead>Τιμή/Μονάδα</TableHead>
                            <TableHead>Συνολικό Κόστος</TableHead>
                            <TableHead>Κατάσταση</TableHead>
                            <TableHead>Σημειώσεις</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLaminationJobs.map((job) => (
                            <TableRow key={job.jobId}>
                              <TableCell>{job.timestamp.toLocaleDateString("el-GR")}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{getLaminationTypeLabel(job.type)}</Badge>
                              </TableCell>
                              <TableCell>{job.quantity}</TableCell>
                              <TableCell>€{job.pricePerUnit.toFixed(2)}</TableCell>
                              <TableCell>€{job.totalCost.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant={job.status === "completed" ? "default" : "secondary"}>
                                  {job.status === "completed" ? "Ολοκληρώθηκε" : job.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">{job.notes || "-"}</TableCell>
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
