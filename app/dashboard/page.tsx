"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { dummyDB } from "@/lib/dummy-database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { UsageChart } from "@/components/usage-chart"
import { useState, useEffect } from "react"
import { Printer, CreditCard, TrendingUp, Receipt, Calendar, Settings, X, Download } from "lucide-react"
import type { PrintJob, LaminationJob, PrintBilling, LaminationBilling, User } from "@/lib/dummy-database"

export default function DashboardPage() {
  const { user } = useAuth()
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([])
  const [laminationJobs, setLaminationJobs] = useState<LaminationJob[]>([])
  const [printBilling, setPrintBilling] = useState<PrintBilling[]>([])
  const [laminationBilling, setLaminationBilling] = useState<LaminationBilling[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])

  // Unified filtering states
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all") // For lamination type
  const [deviceFilter, setDeviceFilter] = useState("all") // For printer device
  const [userFilter, setUserFilter] = useState("all") // For admin to filter by user

  // Filtered data states
  const [filteredPrintBilling, setFilteredPrintBilling] = useState<PrintBilling[]>([])
  const [filteredPrintJobs, setFilteredPrintJobs] = useState<PrintJob[]>([])
  const [filteredLaminationBilling, setFilteredLaminationBilling] = useState<LaminationBilling[]>([])
  const [filteredLaminationJobs, setFilteredLaminationJobs] = useState<LaminationJob[]>([])

  useEffect(() => {
    if (!user) return

    if (user.role === "admin") {
      // Admin sees all data
      const allPrintJobs = dummyDB.getAllPrintJobs()
      const allLaminationJobs = dummyDB.getAllLaminationJobs()
      const allPrintBilling = dummyDB.getAllPrintBilling()
      const allLaminationBilling = dummyDB.getAllLaminationBilling()
      const users = dummyDB.getUsers()

      setPrintJobs(allPrintJobs)
      setLaminationJobs(allLaminationJobs)
      setPrintBilling(allPrintBilling)
      setLaminationBilling(allLaminationBilling)
      setAllUsers(users)
    } else {
      // Regular user sees only their data
      const pJobs = dummyDB.getPrintJobs(user.uid)
      const lJobs = dummyDB.getLaminationJobs(user.uid)
      const pBilling = dummyDB.getPrintBilling(user.uid)
      const lBilling = dummyDB.getLaminationBilling(user.uid)

      setPrintJobs(pJobs)
      setLaminationJobs(lJobs)
      setPrintBilling(pBilling)
      setLaminationBilling(lBilling)
    }
  }, [user])

  // Apply unified filters
  useEffect(() => {
    applyFilters()
  }, [
    searchTerm,
    dateFrom,
    dateTo,
    statusFilter,
    typeFilter,
    deviceFilter,
    userFilter,
    printJobs,
    laminationJobs,
    printBilling,
    laminationBilling,
  ])

  const applyFilters = () => {
    // Filter Print Billing
    let filteredPB = [...printBilling]
    if (searchTerm) {
      filteredPB = filteredPB.filter(
        (item) =>
          item.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userDisplayName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    if (statusFilter !== "all") {
      filteredPB = filteredPB.filter((item) => {
        if (statusFilter === "paid") return item.paid
        if (statusFilter === "unpaid") return !item.paid
        return true
      })
    }
    if (userFilter !== "all") {
      filteredPB = filteredPB.filter((item) => item.uid === userFilter)
    }
    setFilteredPrintBilling(filteredPB)

    // Filter Print Jobs
    let filteredPJ = [...printJobs]
    if (searchTerm) {
      filteredPJ = filteredPJ.filter(
        (item) =>
          item.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.deviceIP?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userDisplayName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    if (dateFrom || dateTo) {
      filteredPJ = filteredPJ.filter((item) => {
        const itemDate = new Date(item.timestamp)
        const fromDate = dateFrom ? new Date(dateFrom) : null
        const toDate = dateTo ? new Date(dateTo) : null
        if (fromDate && itemDate < fromDate) return false
        if (toDate && itemDate > toDate) return false
        return true
      })
    }
    if (statusFilter !== "all" && statusFilter !== "paid" && statusFilter !== "unpaid") {
      filteredPJ = filteredPJ.filter((item) => item.status === statusFilter)
    }
    if (deviceFilter !== "all") {
      filteredPJ = filteredPJ.filter((item) => item.deviceName === deviceFilter)
    }
    if (userFilter !== "all") {
      filteredPJ = filteredPJ.filter((item) => item.uid === userFilter)
    }
    setFilteredPrintJobs(filteredPJ)

    // Filter Lamination Billing
    let filteredLB = [...laminationBilling]
    if (searchTerm) {
      filteredLB = filteredLB.filter(
        (item) =>
          item.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userDisplayName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    if (statusFilter !== "all") {
      filteredLB = filteredLB.filter((item) => {
        if (statusFilter === "paid") return item.paid
        if (statusFilter === "unpaid") return !item.paid
        return true
      })
    }
    if (userFilter !== "all") {
      filteredLB = filteredLB.filter((item) => item.uid === userFilter)
    }
    setFilteredLaminationBilling(filteredLB)

    // Filter Lamination Jobs
    let filteredLJ = [...laminationJobs]
    if (searchTerm) {
      filteredLJ = filteredLJ.filter(
        (item) =>
          item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userDisplayName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    if (dateFrom || dateTo) {
      filteredLJ = filteredLJ.filter((item) => {
        const itemDate = new Date(item.timestamp)
        const fromDate = dateFrom ? new Date(dateFrom) : null
        const toDate = dateTo ? new Date(dateTo) : null
        if (fromDate && itemDate < fromDate) return false
        if (toDate && itemDate > toDate) return false
        return true
      })
    }
    if (statusFilter !== "all" && statusFilter !== "paid" && statusFilter !== "unpaid") {
      filteredLJ = filteredLJ.filter((item) => item.status === statusFilter)
    }
    if (typeFilter !== "all") {
      filteredLJ = filteredLJ.filter((item) => item.type === typeFilter)
    }
    if (userFilter !== "all") {
      filteredLJ = filteredLJ.filter((item) => item.uid === userFilter)
    }
    setFilteredLaminationJobs(filteredLJ)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setDateFrom("")
    setDateTo("")
    setStatusFilter("all")
    setTypeFilter("all")
    setDeviceFilter("all")
    setUserFilter("all")
  }

  const exportTableCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((header) => row[header] || "").join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!user) return null

  // Calculate totals based on filtered data or user-specific data
  const relevantPrintBilling = user.role === "admin" ? printBilling : printBilling
  const relevantLaminationBilling = user.role === "admin" ? laminationBilling : laminationBilling
  const relevantPrintJobs = user.role === "admin" ? printJobs : printJobs
  const relevantLaminationJobs = user.role === "admin" ? laminationJobs : laminationJobs

  const printUnpaid = relevantPrintBilling.filter((b) => !b.paid).reduce((sum, b) => sum + b.remainingBalance, 0)
  const laminationUnpaid = relevantLaminationBilling
    .filter((b) => !b.paid)
    .reduce((sum, b) => sum + b.remainingBalance, 0)
  const totalUnpaid = printUnpaid + laminationUnpaid

  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentMonthPrintJobs = relevantPrintJobs.filter((j) => j.timestamp.toISOString().slice(0, 7) === currentMonth)
  const currentMonthLaminationJobs = relevantLaminationJobs.filter(
    (j) => j.timestamp.toISOString().slice(0, 7) === currentMonth,
  )
  const currentMonthPrintCost = currentMonthPrintJobs.reduce((sum, j) => sum + j.totalCost, 0)
  const currentMonthLaminationCost = currentMonthLaminationJobs.reduce((sum, j) => sum + j.totalCost, 0)

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

  // Generate chart data for last 6 months
  const generateChartData = () => {
    const months = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toISOString().slice(0, 7)
      const monthLabel = date.toLocaleDateString("el-GR", { month: "short", year: "numeric" })

      const monthPrintCost = relevantPrintJobs
        .filter((j) => j.timestamp.toISOString().slice(0, 7) === monthKey)
        .reduce((sum, j) => sum + j.totalCost, 0)

      const monthLaminationCost = relevantLaminationJobs
        .filter((j) => j.timestamp.toISOString().slice(0, 7) === monthKey)
        .reduce((sum, j) => sum + j.totalCost, 0)

      months.push({
        label: monthLabel,
        printValue: monthPrintCost,
        laminationValue: monthLaminationCost,
      })
    }

    return months
  }

  // Get unique devices for filter
  const uniqueDevices = [...new Set(printJobs.map((job) => job.deviceName).filter(Boolean))]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Πίνακας Ελέγχου</h1>
              <p className="text-gray-600">
                Καλώς ήρθατε, {user.displayName}
                {user.role === "admin" && " - Προβολή όλων των δεδομένων"}
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {user.role === "admin" ? "Συνολικά Οφειλόμενα (Όλοι)" : "Συνολικά Οφειλόμενα"}
                  </CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">€{totalUnpaid.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Εκτυπώσεις + Πλαστικοποιήσεις</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Οφειλές Εκτυπώσεων</CardTitle>
                  <Printer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">€{printUnpaid.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{relevantPrintJobs.length} συνολικές εκτυπώσεις</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Οφειλές Πλαστικοποιήσεων</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">€{laminationUnpaid.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    {relevantLaminationJobs.length} συνολικές πλαστικοποιήσεις
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Τρέχων Μήνας</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    €{(currentMonthPrintCost + currentMonthLaminationCost).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentMonthPrintJobs.length + currentMonthLaminationJobs.length} εργασίες
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Unified Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Φίλτρα
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 p-4 bg-gray-50 rounded-lg">
                  {/* Search */}
                  <div className="space-y-2">
                    <Label htmlFor="search">Αναζήτηση</Label>
                    <Input
                      id="search"
                      placeholder="Αναζήτηση..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Date From */}
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom">Από Ημερομηνία</Label>
                    <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>

                  {/* Date To */}
                  <div className="space-y-2">
                    <Label htmlFor="dateTo">Έως Ημερομηνία</Label>
                    <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Κατάσταση</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Όλες</SelectItem>
                        <SelectItem value="paid">Πληρωμένο</SelectItem>
                        <SelectItem value="unpaid">Απλήρωτο</SelectItem>
                        <SelectItem value="completed">Ολοκληρώθηκε</SelectItem>
                        <SelectItem value="pending">Εκκρεμεί</SelectItem>
                        <SelectItem value="failed">Αποτυχία</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Device Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="device">Εκτυπωτής</Label>
                    <Select value={deviceFilter} onValueChange={setDeviceFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Όλοι</SelectItem>
                        {uniqueDevices.map((device) => (
                          <SelectItem key={device} value={device}>
                            {device}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="type">Τύπος Πλαστικοποίησης</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Όλοι</SelectItem>
                        <SelectItem value="A3">A3</SelectItem>
                        <SelectItem value="A4">A4</SelectItem>
                        <SelectItem value="card_small">Κάρτα Μικρή</SelectItem>
                        <SelectItem value="card_large">Κάρτα Μεγάλη</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* User Filter - Only for Admin */}
                  {user.role === "admin" && (
                    <div className="space-y-2">
                      <Label htmlFor="userFilter">Χρήστης</Label>
                      <Select value={userFilter} onValueChange={setUserFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Όλοι οι χρήστες</SelectItem>
                          {allUsers
                            .filter((u) => u.role === "user")
                            .map((u) => (
                              <SelectItem key={u.uid} value={u.uid}>
                                {u.displayName} ({u.username})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-600">
                    Εκτυπώσεις: {filteredPrintJobs.length}/{printJobs.length} | Πλαστικοποιήσεις:{" "}
                    {filteredLaminationJobs.length}/{laminationJobs.length}
                  </div>
                  <Button onClick={clearFilters} variant="outline" size="sm" className="bg-transparent">
                    <X className="h-4 w-4 mr-2" />
                    Καθαρισμός
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Print and Lamination */}
            <Tabs defaultValue="printing" className="w-full mb-8">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="printing"
                  className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                >
                  <Printer className="h-4 w-4" />
                  Εκτυπώσεις
                </TabsTrigger>
                <TabsTrigger
                  value="lamination"
                  className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
                >
                  <CreditCard className="h-4 w-4" />
                  Πλαστικοποιήσεις
                </TabsTrigger>
              </TabsList>

              <TabsContent value="printing" className="mt-6">
                <div className="bg-blue-50 p-6 rounded-lg space-y-6">
                  {/* Print Billing Table */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Χρεώσεις Εκτυπώσεων</CardTitle>
                          <p className="text-sm text-gray-600">Μηνιαίες χρεώσεις και κατάσταση πληρωμών</p>
                        </div>
                        <Button
                          onClick={() =>
                            exportTableCSV(
                              filteredPrintBilling.map((b) => ({
                                period: b.period,
                                userDisplayName: b.userDisplayName,
                                department: b.department,
                                totalA4BW: b.totalA4BW,
                                totalA4Color: b.totalA4Color,
                                totalA3BW: b.totalA3BW,
                                totalA3Color: b.totalA3Color,
                                totalScans: b.totalScans,
                                totalCost: b.totalCost.toFixed(2),
                                paidAmount: b.paidAmount.toFixed(2),
                                remainingBalance: b.remainingBalance.toFixed(2),
                                dueDate: b.dueDate.toLocaleDateString("el-GR"),
                                status: b.paid ? "Πληρωμένο" : "Απλήρωτο",
                              })),
                              "print_billing",
                              [
                                "period",
                                "userDisplayName",
                                "department",
                                "totalA4BW",
                                "totalA4Color",
                                "totalA3BW",
                                "totalA3Color",
                                "totalScans",
                                "totalCost",
                                "paidAmount",
                                "remainingBalance",
                                "dueDate",
                                "status",
                              ],
                            )
                          }
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Εξαγωγή CSV
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg" style={{ maxHeight: "400px", overflowY: "auto" }}>
                        <Table>
                          <TableHeader className="sticky top-0 bg-white z-10">
                            <TableRow>
                              <TableHead className="font-medium">Περίοδος</TableHead>
                              {user.role === "admin" && <TableHead>Χρήστης</TableHead>}
                              {user.role === "admin" && <TableHead>Τμήμα</TableHead>}
                              <TableHead>A4 Α/Μ</TableHead>
                              <TableHead>A4 Έγχρωμο</TableHead>
                              <TableHead>A3 Α/Μ</TableHead>
                              <TableHead>A3 Έγχρωμο</TableHead>
                              <TableHead>Σαρώσεις</TableHead>
                              <TableHead>Συνολικό Κόστος</TableHead>
                              <TableHead>Πληρωμένο</TableHead>
                              <TableHead>Υπόλοιπο</TableHead>
                              <TableHead>Ημ. Εξόφλησης</TableHead>
                              <TableHead>Κατάσταση</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredPrintBilling.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={user.role === "admin" ? 13 : 11}
                                  className="text-center py-8 text-gray-500"
                                >
                                  Δεν βρέθηκαν αποτελέσματα
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredPrintBilling.map((billing) => (
                                <TableRow key={billing.billingId}>
                                  <TableCell className="font-medium">{billing.period}</TableCell>
                                  {user.role === "admin" && <TableCell>{billing.userDisplayName}</TableCell>}
                                  {user.role === "admin" && <TableCell>{billing.department}</TableCell>}
                                  <TableCell>{billing.totalA4BW}</TableCell>
                                  <TableCell>{billing.totalA4Color}</TableCell>
                                  <TableCell>{billing.totalA3BW}</TableCell>
                                  <TableCell>{billing.totalA3Color}</TableCell>
                                  <TableCell>{billing.totalScans}</TableCell>
                                  <TableCell>€{billing.totalCost.toFixed(2)}</TableCell>
                                  <TableCell>€{billing.paidAmount.toFixed(2)}</TableCell>
                                  <TableCell
                                    className={
                                      billing.remainingBalance > 0 ? "text-red-600 font-semibold" : "text-green-600"
                                    }
                                  >
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
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Print Jobs Table */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Ιστορικό Εκτυπώσεων</CardTitle>
                          <p className="text-sm text-gray-600">Λεπτομερές ιστορικό όλων των εκτυπώσεων</p>
                        </div>
                        <Button
                          onClick={() =>
                            exportTableCSV(
                              filteredPrintJobs.map((j) => ({
                                timestamp: j.timestamp.toLocaleDateString("el-GR"),
                                userDisplayName: j.userDisplayName,
                                department: j.department,
                                deviceName: j.deviceName,
                                pagesA4BW: j.pagesA4BW,
                                pagesA4Color: j.pagesA4Color,
                                pagesA3BW: j.pagesA3BW,
                                pagesA3Color: j.pagesA3Color,
                                scans: j.scans,
                                copies: j.copies,
                                totalCost: j.totalCost.toFixed(2),
                                status: j.status === "completed" ? "Ολοκληρώθηκε" : j.status,
                              })),
                              "print_jobs",
                              [
                                "timestamp",
                                "userDisplayName",
                                "department",
                                "deviceName",
                                "pagesA4BW",
                                "pagesA4Color",
                                "pagesA3BW",
                                "pagesA3Color",
                                "scans",
                                "copies",
                                "totalCost",
                                "status",
                              ],
                            )
                          }
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Εξαγωγή CSV
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg" style={{ maxHeight: "400px", overflowY: "auto" }}>
                        <Table>
                          <TableHeader className="sticky top-0 bg-white z-10">
                            <TableRow>
                              <TableHead>Ημερομηνία</TableHead>
                              {user.role === "admin" && <TableHead>Χρήστης</TableHead>}
                              {user.role === "admin" && <TableHead>Τμήμα</TableHead>}
                              <TableHead>Εκτυπωτής</TableHead>
                              <TableHead>A4 Α/Μ</TableHead>
                              <TableHead>A4 Έγχρωμο</TableHead>
                              <TableHead>A3 Α/Μ</TableHead>
                              <TableHead>A3 Έγχρωμο</TableHead>
                              <TableHead>Σαρώσεις</TableHead>
                              <TableHead>Φωτοαντίγραφα</TableHead>
                              <TableHead>Κόστος</TableHead>
                              <TableHead>Κατάσταση</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredPrintJobs.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={user.role === "admin" ? 12 : 10}
                                  className="text-center py-8 text-gray-500"
                                >
                                  Δεν βρέθηκαν αποτελέσματα
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredPrintJobs.map((job) => (
                                <TableRow key={job.jobId}>
                                  <TableCell>{job.timestamp.toLocaleDateString("el-GR")}</TableCell>
                                  {user.role === "admin" && <TableCell>{job.userDisplayName}</TableCell>}
                                  {user.role === "admin" && <TableCell>{job.department}</TableCell>}
                                  <TableCell>
                                    <Badge variant="outline">{job.deviceName}</Badge>
                                  </TableCell>
                                  <TableCell>{job.pagesA4BW}</TableCell>
                                  <TableCell>{job.pagesA4Color}</TableCell>
                                  <TableCell>{job.pagesA3BW}</TableCell>
                                  <TableCell>{job.pagesA3Color}</TableCell>
                                  <TableCell>{job.scans}</TableCell>
                                  <TableCell>{job.copies}</TableCell>
                                  <TableCell>€{job.totalCost.toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Badge variant={job.status === "completed" ? "default" : "secondary"}>
                                      {job.status === "completed" ? "Ολοκληρώθηκε" : job.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="lamination" className="mt-6">
                <div className="bg-green-50 p-6 rounded-lg space-y-6">
                  {/* Lamination Billing Table */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Χρεώσεις Πλαστικοποιήσεων</CardTitle>
                          <p className="text-sm text-gray-600">Μηνιαίες χρεώσεις και κατάσταση πληρωμών</p>
                        </div>
                        <Button
                          onClick={() =>
                            exportTableCSV(
                              filteredLaminationBilling.map((b) => ({
                                period: b.period,
                                userDisplayName: b.userDisplayName,
                                department: b.department,
                                totalA3: b.totalA3,
                                totalA4: b.totalA4,
                                totalCardSmall: b.totalCardSmall,
                                totalCardLarge: b.totalCardLarge,
                                totalCost: b.totalCost.toFixed(2),
                                paidAmount: b.paidAmount.toFixed(2),
                                remainingBalance: b.remainingBalance.toFixed(2),
                                dueDate: b.dueDate.toLocaleDateString("el-GR"),
                                status: b.paid ? "Πληρωμένο" : "Απλήρωτο",
                              })),
                              "lamination_billing",
                              [
                                "period",
                                "userDisplayName",
                                "department",
                                "totalA3",
                                "totalA4",
                                "totalCardSmall",
                                "totalCardLarge",
                                "totalCost",
                                "paidAmount",
                                "remainingBalance",
                                "dueDate",
                                "status",
                              ],
                            )
                          }
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Εξαγωγή CSV
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg" style={{ maxHeight: "400px", overflowY: "auto" }}>
                        <Table>
                          <TableHeader className="sticky top-0 bg-white z-10">
                            <TableRow>
                              <TableHead className="font-medium">Περίοδος</TableHead>
                              {user.role === "admin" && <TableHead>Χρήστης</TableHead>}
                              {user.role === "admin" && <TableHead>Τμήμα</TableHead>}
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
                            {filteredLaminationBilling.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={user.role === "admin" ? 12 : 10}
                                  className="text-center py-8 text-gray-500"
                                >
                                  Δεν βρέθηκαν αποτελέσματα
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredLaminationBilling.map((billing) => (
                                <TableRow key={billing.billingId}>
                                  <TableCell className="font-medium">{billing.period}</TableCell>
                                  {user.role === "admin" && <TableCell>{billing.userDisplayName}</TableCell>}
                                  {user.role === "admin" && <TableCell>{billing.department}</TableCell>}
                                  <TableCell>{billing.totalA3}</TableCell>
                                  <TableCell>{billing.totalA4}</TableCell>
                                  <TableCell>{billing.totalCardSmall}</TableCell>
                                  <TableCell>{billing.totalCardLarge}</TableCell>
                                  <TableCell>€{billing.totalCost.toFixed(2)}</TableCell>
                                  <TableCell>€{billing.paidAmount.toFixed(2)}</TableCell>
                                  <TableCell
                                    className={
                                      billing.remainingBalance > 0 ? "text-red-600 font-semibold" : "text-green-600"
                                    }
                                  >
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
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lamination Jobs Table */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Ιστορικό Πλαστικοποιήσεων</CardTitle>
                          <p className="text-sm text-gray-600">Λεπτομερές ιστορικό όλων των πλαστικοποιήσεων</p>
                        </div>
                        <Button
                          onClick={() =>
                            exportTableCSV(
                              filteredLaminationJobs.map((j) => ({
                                timestamp: j.timestamp.toLocaleDateString("el-GR"),
                                userDisplayName: j.userDisplayName,
                                department: j.department,
                                type: getLaminationTypeLabel(j.type),
                                quantity: j.quantity,
                                pricePerUnit: j.pricePerUnit.toFixed(2),
                                totalCost: j.totalCost.toFixed(2),
                                status: j.status === "completed" ? "Ολοκληρώθηκε" : j.status,
                                notes: j.notes || "-",
                              })),
                              "lamination_jobs",
                              [
                                "timestamp",
                                "userDisplayName",
                                "department",
                                "type",
                                "quantity",
                                "pricePerUnit",
                                "totalCost",
                                "status",
                                "notes",
                              ],
                            )
                          }
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Εξαγωγή CSV
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg" style={{ maxHeight: "400px", overflowY: "auto" }}>
                        <Table>
                          <TableHeader className="sticky top-0 bg-white z-10">
                            <TableRow>
                              <TableHead>Ημερομηνία</TableHead>
                              {user.role === "admin" && <TableHead>Χρήστης</TableHead>}
                              {user.role === "admin" && <TableHead>Τμήμα</TableHead>}
                              <TableHead>Τύπος</TableHead>
                              <TableHead>Ποσότητα</TableHead>
                              <TableHead>Τιμή/Μονάδα</TableHead>
                              <TableHead>Συνολικό Κόστος</TableHead>
                              <TableHead>Κατάσταση</TableHead>
                              <TableHead>Σημειώσεις</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredLaminationJobs.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={user.role === "admin" ? 9 : 7}
                                  className="text-center py-8 text-gray-500"
                                >
                                  Δεν βρέθηκαν αποτελέσματα
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredLaminationJobs.map((job) => (
                                <TableRow key={job.jobId}>
                                  <TableCell>{job.timestamp.toLocaleDateString("el-GR")}</TableCell>
                                  {user.role === "admin" && <TableCell>{job.userDisplayName}</TableCell>}
                                  {user.role === "admin" && <TableCell>{job.department}</TableCell>}
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
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Chart at the bottom */}
            <UsageChart
              data={generateChartData()}
              title="Μηνιαία Κόστη (Τελευταίοι 6 Μήνες)"
              printLabel="Εκτυπώσεις"
              laminationLabel="Πλαστικοποιήσεις"
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
