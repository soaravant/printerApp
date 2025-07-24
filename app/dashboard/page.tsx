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
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { Printer, CreditCard, TrendingUp, Receipt, Calendar, Settings, X, Download, RotateCcw, Filter } from "lucide-react"
import * as XLSX from "xlsx-js-style"

// Dynamic import for UsageChart (must be at module scope)
const UsageChart = dynamic(() => import("@/components/usage-chart"), {
  loading: () => <div className="w-full flex justify-center items-center py-8">Φόρτωση γραφήματος...</div>,
  ssr: false,
})
const PrintJobsTable = dynamic(() => import("@/components/print-jobs-table"), {
  loading: () => <div className="w-full flex justify-center items-center py-8">Φόρτωση εκτυπώσεων...</div>,
  ssr: false,
})
const LaminationJobsTable = dynamic(() => import("@/components/lamination-jobs-table"), {
  loading: () => <div className="w-full flex justify-center items-center py-8">Φόρτωση πλαστικοποιήσεων...</div>,
  ssr: false,
})
const PrintBillingTable = dynamic(() => import("@/components/print-billing-table"), {
  loading: () => <div className="w-full flex justify-center items-center py-8">Φόρτωση χρεώσεων εκτυπώσεων...</div>,
  ssr: false,
})
const LaminationBillingTable = dynamic(() => import("@/components/lamination-billing-table"), {
  loading: () => <div className="w-full flex justify-center items-center py-8">Φόρτωση χρεώσεων πλαστικοποιήσεων...</div>,
  ssr: false,
})

// Pagination helper
function Pagination({ page, total, pageSize, onPageChange }: { page: number; total: number; pageSize: number; onPageChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null
  return (
    <div className="flex gap-2 justify-end items-center mt-2">
      <Button size="sm" variant="outline" onClick={() => onPageChange(page - 1)} disabled={page === 1}>&lt;</Button>
      <span className="text-xs">Σελίδα {page} από {totalPages}</span>
      <Button size="sm" variant="outline" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>&gt;</Button>
    </div>
  )
}

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

  // Pagination state
  const [printJobsPage, setPrintJobsPage] = useState(1)
  const [laminationJobsPage, setLaminationJobsPage] = useState(1)
  const [printBillingPage, setPrintBillingPage] = useState(1)
  const [laminationBillingPage, setLaminationBillingPage] = useState(1)
  const PAGE_SIZE = 10

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

  // Reset page on filter change
  useEffect(() => {
    setPrintJobsPage(1)
    setLaminationJobsPage(1)
    setPrintBillingPage(1)
    setLaminationBillingPage(1)
  }, [searchTerm, dateFrom, dateTo, statusFilter, typeFilter, deviceFilter, userFilter])

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

  type RGB = string // e.g. "4472C4"

  // Helper for friendly Greek column names and dynamic column widths
  const exportTableXLSX = (
    data: any[],
    filename: string,
    columns: { key: string, label: string }[],
    headerColor: string
  ) => {
    // Build AOA (array of arrays)
    const aoa = [
      columns.map(col => col.label),
      ...data.map(row => columns.map(col => row[col.key] ?? ""))
    ]

    const ws = XLSX.utils.aoa_to_sheet(aoa)

    // Style header row
    const range = XLSX.utils.decode_range(ws['!ref']!)
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c })
      const cell = ws[cellAddr] ?? (ws[cellAddr] = { v: columns[c].label })
      cell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
        fill: { patternType: "solid", fgColor: { rgb: headerColor } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top:    { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left:   { style: "thin", color: { rgb: "000000" } },
          right:  { style: "thin", color: { rgb: "000000" } }
        }
      }
    }

    // Dynamic column widths based on max content length, with extra space for header
    const colWidths = columns.map((col, i) => ({
      wch: Math.max(
        col.label.length * 1.7, // more space for header
        ...data.map(row => String(row[col.key] ?? "").length),
        10 // increased minimum width
      ) + 1 // extra padding
    }))
    ws['!cols'] = colWidths

    // Row height for header
    ws['!rows'] = [{ hpt: 25 }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`)
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

  const formatPrice = (price: number) => `€${price.toFixed(2).replace('.', ',')}`

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
                  <div className="text-2xl font-bold text-red-600">{formatPrice(totalUnpaid)}</div>
                  <p className="text-xs text-muted-foreground">Εκτυπώσεις + Πλαστικοποιήσεις</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Οφειλές Εκτυπώσεων</CardTitle>
                  <Printer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{formatPrice(printUnpaid)}</div>
                  <p className="text-xs text-muted-foreground">{relevantPrintJobs.length} συνολικές εκτυπώσεις</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Οφειλές Πλαστικοποιήσεων</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatPrice(laminationUnpaid)}</div>
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
                    {formatPrice(currentMonthPrintCost + currentMonthLaminationCost)}
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
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Φίλτρα
                  </CardTitle>
                  <button
                    type="button"
                    aria-label="Επαναφορά φίλτρων"
                    className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition ml-2"
                    onClick={clearFilters}
                  >
                    <RotateCcw className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    {/* Row 1: Search (col 1-2), Status (col 3), Printer (col 4) */}
                    <div className="md:col-span-2 flex flex-col justify-end">
                      <Label htmlFor="search">Αναζήτηση</Label>
                      <Input
                        id="search"
                        placeholder="Αναζήτηση..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col justify-end">
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
                    <div className="flex flex-col justify-end">
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

                    {/* Row 2: Date From (col 1), Date To (col 2), Type (col 3), User (col 4, admin only) */}
                    <div className="flex flex-col justify-end">
                      <Label htmlFor="dateFrom">Από Ημερομηνία</Label>
                      <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>
                    <div className="flex flex-col justify-end">
                      <Label htmlFor="dateTo">Έως Ημερομηνία</Label>
                      <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                    <div className="flex flex-col justify-end">
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
                    {user.role === "admin" ? (
                      <div className="flex flex-col justify-end">
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
                    ) : (
                      <div></div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-600">
                    Εκτυπώσεις: {filteredPrintJobs.length}/{printJobs.length} | Πλαστικοποιήσεις: {filteredLaminationJobs.length}/{laminationJobs.length}
                  </div>
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
                            exportTableXLSX(
                              filteredPrintBilling.map((b) => ({
                                period: b.period,
                                userDisplayName: b.userDisplayName,
                                department: b.department,
                                totalA4BW: b.totalA4BW,
                                totalA4Color: b.totalA4Color,
                                totalA3BW: b.totalA3BW,
                                totalA3Color: b.totalA3Color,
                                totalScans: b.totalScans,
                                totalCost: formatPrice(b.totalCost),
                                paidAmount: formatPrice(b.paidAmount),
                                remainingBalance: formatPrice(b.remainingBalance),
                                dueDate: b.dueDate.toLocaleDateString("el-GR"),
                                status: b.paid ? "Πληρωμένο" : "Απλήρωτο",
                              })),
                              "print_billing",
                              [
                                { key: "period", label: "Περίοδος" },
                                { key: "userDisplayName", label: "Χρήστης" },
                                { key: "department", label: "Τμήμα" },
                                { key: "totalA4BW", label: "A4 Ασπρόμαυρες" },
                                { key: "totalA4Color", label: "A4 Έγχρωμες" },
                                { key: "totalA3BW", label: "A3 Ασπρόμαυρες" },
                                { key: "totalA3Color", label: "A3 Έγχρωμες" },
                                { key: "totalScans", label: "Σαρώσεις" },
                                { key: "totalCost", label: "Σύνολο Κόστους" },
                                { key: "paidAmount", label: "Πληρωμένο Ποσό" },
                                { key: "remainingBalance", label: "Υπόλοιπο" },
                                { key: "dueDate", label: "Ημ/νία Λήξης" },
                                { key: "status", label: "Κατάσταση" }
                              ],
                              "4472C4"
                            )
                          }
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Εξαγωγή XLSX
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <PrintBillingTable
                        data={filteredPrintBilling}
                        page={printBillingPage}
                        pageSize={PAGE_SIZE}
                        onPageChange={setPrintBillingPage}
                        userRole={user.role}
                      />
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
                            exportTableXLSX(
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
                                totalCost: formatPrice(j.totalCost),
                                status: j.status === "completed" ? "Ολοκληρώθηκε" : j.status,
                              })),
                              "print_jobs",
                              [
                                { key: "timestamp", label: "Ημερομηνία" },
                                { key: "userDisplayName", label: "Χρήστης" },
                                { key: "department", label: "Τμήμα" },
                                { key: "deviceName", label: "Εκτυπωτής" },
                                { key: "pagesA4BW", label: "A4 Ασπρόμαυρες" },
                                { key: "pagesA4Color", label: "A4 Έγχρωμες" },
                                { key: "pagesA3BW", label: "A3 Ασπρόμαυρες" },
                                { key: "pagesA3Color", label: "A3 Έγχρωμες" },
                                { key: "scans", label: "Σαρώσεις" },
                                { key: "copies", label: "Αντίγραφα" },
                                { key: "totalCost", label: "Σύνολο Κόστους" },
                                { key: "status", label: "Κατάσταση" }
                              ],
                              "4472C4"
                            )
                          }
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Εξαγωγή XLSX
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <PrintJobsTable
                        data={filteredPrintJobs}
                        page={printJobsPage}
                        pageSize={PAGE_SIZE}
                        onPageChange={setPrintJobsPage}
                        userRole={user.role}
                      />
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
                            exportTableXLSX(
                              filteredLaminationBilling.map((b) => ({
                                period: b.period,
                                userDisplayName: b.userDisplayName,
                                department: b.department,
                                totalA3: b.totalA3,
                                totalA4: b.totalA4,
                                totalCardSmall: b.totalCardSmall,
                                totalCardLarge: b.totalCardLarge,
                                totalCost: formatPrice(b.totalCost),
                                paidAmount: formatPrice(b.paidAmount),
                                remainingBalance: formatPrice(b.remainingBalance),
                                dueDate: b.dueDate.toLocaleDateString("el-GR"),
                                status: b.paid ? "Πληρωμένο" : "Απλήρωτο",
                              })),
                              "lamination_billing",
                              [
                                { key: "period", label: "Περίοδος" },
                                { key: "userDisplayName", label: "Χρήστης" },
                                { key: "department", label: "Τμήμα" },
                                { key: "totalA3", label: "A3" },
                                { key: "totalA4", label: "A4" },
                                { key: "totalCardSmall", label: "Κάρτα Μικρή" },
                                { key: "totalCardLarge", label: "Κάρτα Μεγάλη" },
                                { key: "totalCost", label: "Σύνολο Κόστους" },
                                { key: "paidAmount", label: "Πληρωμένο Ποσό" },
                                { key: "remainingBalance", label: "Υπόλοιπο" },
                                { key: "dueDate", label: "Ημ/νία Λήξης" },
                                { key: "status", label: "Κατάσταση" }
                              ],
                              "22C55E"
                            )
                          }
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Εξαγωγή XLSX
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <LaminationBillingTable
                        data={filteredLaminationBilling}
                        page={laminationBillingPage}
                        pageSize={PAGE_SIZE}
                        onPageChange={setLaminationBillingPage}
                        userRole={user.role}
                      />
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
                            exportTableXLSX(
                              filteredLaminationJobs.map((j) => ({
                                timestamp: j.timestamp.toLocaleDateString("el-GR"),
                                userDisplayName: j.userDisplayName,
                                department: j.department,
                                type: getLaminationTypeLabel(j.type),
                                quantity: j.quantity,
                                pricePerUnit: j.pricePerUnit.toFixed(2),
                                totalCost: formatPrice(j.totalCost),
                                status: j.status === "completed" ? "Ολοκληρώθηκε" : j.status,
                                notes: j.notes || "-",
                              })),
                              "lamination_jobs",
                              [
                                { key: "timestamp", label: "Ημερομηνία" },
                                { key: "userDisplayName", label: "Χρήστης" },
                                { key: "department", label: "Τμήμα" },
                                { key: "type", label: "Τύπος" },
                                { key: "quantity", label: "Ποσότητα" },
                                { key: "pricePerUnit", label: "Τιμή ανά μονάδα" },
                                { key: "totalCost", label: "Σύνολο Κόστους" },
                                { key: "status", label: "Κατάσταση" },
                                { key: "notes", label: "Σημειώσεις" }
                              ],
                              "22C55E"
                            )
                          }
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Εξαγωγή XLSX
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <LaminationJobsTable
                        data={filteredLaminationJobs}
                        page={laminationJobsPage}
                        pageSize={PAGE_SIZE}
                        onPageChange={setLaminationJobsPage}
                        userRole={user.role}
                      />
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
