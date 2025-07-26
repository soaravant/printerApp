"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/lib/refresh-context"
import { dummyDB } from "@/lib/dummy-database"
import type { PrintJob, LaminationJob, PrintBilling, LaminationBilling, User } from "@/lib/dummy-database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { GreekDatePicker } from "@/components/ui/greek-date-picker"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { Printer, CreditCard, TrendingUp, Receipt, Calendar, Settings, X, Download, RotateCcw, Filter, FileText, BarChart3 } from "lucide-react"
import * as XLSX from "xlsx-js-style"
import React from "react"

// Error boundary component for dynamic imports
function ErrorBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  return (
    <React.Suspense fallback={fallback}>
      {children}
    </React.Suspense>
  )
}

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
  const { refreshTrigger } = useRefresh()
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
  }, [user, refreshTrigger]) // Add refreshTrigger to dependencies

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
    headerColor: string,
    title?: string
  ) => {
    // Build AOA (array of arrays)
    const aoa = title 
      ? [
          [title], // Title row
          columns.map(col => col.label), // Header row
          ...data.map(row => columns.map(col => row[col.key] ?? "")) // Data rows
        ]
      : [
          columns.map(col => col.label), // Header row
          ...data.map(row => columns.map(col => row[col.key] ?? "")) // Data rows
        ]

    const ws = XLSX.utils.aoa_to_sheet(aoa)

    // Style title row if present
    if (title) {
      const titleCellAddr = XLSX.utils.encode_cell({ r: 0, c: 0 })
      const titleCell = ws[titleCellAddr] ?? (ws[titleCellAddr] = { v: title })
      titleCell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 },
        fill: { patternType: "solid", fgColor: { rgb: headerColor } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top:    { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left:   { style: "thin", color: { rgb: "000000" } },
          right:  { style: "thin", color: { rgb: "000000" } }
        }
      }
      
      // Merge title cell across all columns
      if (!ws['!merges']) ws['!merges'] = []
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } })
    }

    // Style header row
    const range = XLSX.utils.decode_range(ws['!ref']!)
    const headerRowIndex = title ? 1 : 0
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: headerRowIndex, c })
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

    // Row heights for title and header
    const rowHeights = title 
      ? [{ hpt: 35 }, { hpt: 25 }] // Title row taller, header row normal
      : [{ hpt: 25 }] // Just header row
    ws['!rows'] = rowHeights

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
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Πίνακας Ελέγχου</h1>
                  <p className="text-gray-600">
                    Καλώς ήρθατε, {user.displayName}
                    {user.role === "admin" && " - Προβολή όλων των δεδομένων"}
                  </p>
                </div>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Ανανέωση
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Debts Card - Yellow Theme */}
              <div className="bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm h-full">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
                  <div className="bg-yellow-100 px-6 py-4 border-b border-yellow-200">
                    <div className="flex items-center gap-3">
                      <Receipt className="h-8 w-8 text-yellow-700" />
                      <h3 className="text-lg font-semibold text-yellow-900">Σύνολο Οφειλών</h3>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex items-center">
                    <div className="text-3xl font-bold text-red-600">{formatPrice(totalUnpaid)}</div>
                  </div>
                </div>
              </div>

              {/* Print Debts Card - Blue Theme */}
              <div className="bg-blue-50 rounded-lg border border-blue-200 shadow-sm h-full">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
                  <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                    <div className="flex items-center gap-3">
                      <Printer className="h-6 w-6 text-blue-700" />
                      <h3 className="text-lg font-semibold text-blue-900">Οφειλές ΤΟ. ΦΩ.</h3>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex items-center">
                    <div className="text-3xl font-bold text-blue-600">{formatPrice(printUnpaid)}</div>
                  </div>
                </div>
              </div>

              {/* Lamination Debts Card - Green Theme */}
              <div className="bg-green-50 rounded-lg border border-green-200 shadow-sm h-full">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
                  <div className="bg-green-100 px-6 py-4 border-b border-green-200">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-6 w-6 text-green-700" />
                      <h3 className="text-lg font-semibold text-green-900">Οφειλές ΠΛΑ. ΤΟ.</h3>
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex items-center">
                    <div className="text-3xl font-bold text-green-600">{formatPrice(laminationUnpaid)}</div>
                  </div>
                </div>
              </div>
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
                      <GreekDatePicker
                        id="dateFrom"
                        label="Από Ημερομηνία"
                        value={dateFrom}
                        onChange={setDateFrom}
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <GreekDatePicker
                        id="dateTo"
                        label="Έως Ημερομηνία"
                        value={dateTo}
                        onChange={setDateTo}
                      />
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

            {/* Print Billing Table - Outside Tabs */}
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm mb-8">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-yellow-100 px-6 py-4 border-b border-yellow-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-6 w-6 text-yellow-700" />
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-900">Συγκεντρωτικός Χρεωστικός Πίνακας</h3>
                        <p className="text-sm text-yellow-700">Συγκεντρωμένα δεδομένα χρεώσεων και πληρωμών</p>
                      </div>
                    </div>
                    <Button
                      onClick={() =>
                                                    exportTableXLSX(
                              filteredPrintBilling.map((b) => {
                                const userData = dummyDB.getUserById(b.uid)
                                const responsiblePerson = userData?.userRole === "Άτομο" 
                                  ? userData.displayName 
                                  : userData?.responsiblePerson || "-"
                                
                                return {
                                  userRole: userData?.userRole || "-",
                                  userDisplayName: b.userDisplayName,
                                  responsiblePerson: responsiblePerson,
                                  remainingBalance: formatPrice(b.remainingBalance),
                                  lastPayment: b.lastPayment ? b.lastPayment.toLocaleDateString("el-GR") : "-",
                                }
                              }),
                              "print_billing",
                              [
                                { key: "userRole", label: "Ρόλος" },
                                { key: "userDisplayName", label: "Όνομα" },
                                { key: "responsiblePerson", label: "Υπεύθυνος" },
                                { key: "remainingBalance", label: "Συνολικό Χρέος" },
                                { key: "lastPayment", label: "Τελευταία Εξόφληση" }
                              ],
                              "EAB308",
                              "Συγκεντρωτικός Χρεωστικός Πίνακας"
                            )
                      }
                      variant="outline"
                      size="sm"
                      className="bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Εξαγωγή XLSX
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  <PrintBillingTable
                    data={filteredPrintBilling}
                    page={printBillingPage}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPrintBillingPage}
                    userRole={user.role}
                  />
                </div>
              </div>
            </div>

            {/* Tabs for Print and Lamination */}
            <Tabs defaultValue="printing" className="w-full mb-8">
              <TabsList className="grid w-full grid-cols-2 h-16 p-1">
                <TabsTrigger
                  value="printing"
                  className="flex items-center gap-3 py-4 px-6 text-base font-medium data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                >
                  <Printer className="h-6 w-6" />
                  ΤΟ. ΦΩ.
                </TabsTrigger>
                <TabsTrigger
                  value="lamination"
                  className="flex items-center gap-3 py-4 px-6 text-base font-medium data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
                >
                  <CreditCard className="h-6 w-6" />
                  ΠΛΑ. ΤΟ.
                </TabsTrigger>
              </TabsList>

              <TabsContent value="printing" className="mt-8">
                <div className="bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                  {/* Print Jobs Table */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Printer className="h-6 w-6 text-blue-700" />
                          <div>
                            <h3 className="text-lg font-semibold text-blue-900">Ιστορικό Εκτυπώσεων</h3>
                            <p className="text-sm text-blue-700">Λεπτομερές ιστορικό όλων των εκτυπώσεων</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            // Helper function to expand a print job into individual rows
                            const expandPrintJob = (job: any) => {
                              const rows = []
                              
                              if (job.pagesA4BW > 0) {
                                rows.push({
                                  timestamp: job.timestamp.toLocaleString("el-GR"),
                                  uid: job.uid,
                                  userDisplayName: job.userDisplayName,
                                  deviceName: job.deviceName,
                                  printType: "A4 Ασπρόμαυρο",
                                  quantity: job.pagesA4BW,
                                  cost: formatPrice(job.pagesA4BW * 0.05)
                                })
                              }
                              
                              if (job.pagesA4Color > 0) {
                                rows.push({
                                  timestamp: job.timestamp.toLocaleString("el-GR"),
                                  uid: job.uid,
                                  userDisplayName: job.userDisplayName,
                                  deviceName: job.deviceName,
                                  printType: "A4 Έγχρωμο",
                                  quantity: job.pagesA4Color,
                                  cost: formatPrice(job.pagesA4Color * 0.20)
                                })
                              }
                              
                              if (job.pagesA3BW > 0) {
                                rows.push({
                                  timestamp: job.timestamp.toLocaleString("el-GR"),
                                  uid: job.uid,
                                  userDisplayName: job.userDisplayName,
                                  deviceName: job.deviceName,
                                  printType: "A3 Ασπρόμαυρο",
                                  quantity: job.pagesA3BW,
                                  cost: formatPrice(job.pagesA3BW * 0.10)
                                })
                              }
                              
                              if (job.pagesA3Color > 0) {
                                rows.push({
                                  timestamp: job.timestamp.toLocaleString("el-GR"),
                                  uid: job.uid,
                                  userDisplayName: job.userDisplayName,
                                  deviceName: job.deviceName,
                                  printType: "A3 Έγχρωμο",
                                  quantity: job.pagesA3Color,
                                  cost: formatPrice(job.pagesA3Color * 0.40)
                                })
                              }
                              
                              return rows
                            }

                            const expandedData = filteredPrintJobs.flatMap(expandPrintJob)
                            
                            exportTableXLSX(
                              expandedData,
                              "print_jobs",
                              [
                                { key: "timestamp", label: "Ημερομηνία/Ώρα" },
                                { key: "uid", label: "Χρήστης (ID)" },
                                { key: "userDisplayName", label: "Όνομα" },
                                { key: "deviceName", label: "Εκτυπωτής" },
                                { key: "printType", label: "Είδος Εκτύπωσης" },
                                { key: "quantity", label: "Ποσότητα" },
                                { key: "cost", label: "Κόστος" }
                              ],
                              "4472C4",
                              "Ιστορικό Εκτυπώσεων"
                            )
                          }}
                          variant="outline"
                          size="sm"
                          className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Εξαγωγή XLSX
                        </Button>
                      </div>
                    </div>
                    <div className="p-6">
                      <ErrorBoundary fallback={<div>Φόρτωση εκτυπώσεων...</div>}>
                        <PrintJobsTable
                          data={filteredPrintJobs}
                          page={printJobsPage}
                          pageSize={PAGE_SIZE}
                          onPageChange={setPrintJobsPage}
                          userRole={user.role}
                        />
                      </ErrorBoundary>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="lamination" className="mt-8">
                <div className="bg-green-50 rounded-lg border border-green-200 shadow-sm">
                  {/* Lamination Jobs Table */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-green-100 px-6 py-4 border-b border-green-200">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-6 w-6 text-green-700" />
                          <div>
                            <h3 className="text-lg font-semibold text-green-900">Ιστορικό Πλαστικοποιήσεων</h3>
                            <p className="text-sm text-green-700">Ιστορικό καταχωρημένων πλαστικοποιήσεων</p>
                          </div>
                        </div>
                        <Button
                          onClick={() =>
                            exportTableXLSX(
                              filteredLaminationJobs.map((j) => ({
                                timestamp: j.timestamp.toLocaleDateString("el-GR"),
                                uid: j.uid,
                                userDisplayName: j.userDisplayName,
                                type: getLaminationTypeLabel(j.type),
                                quantity: j.quantity,
                                totalCost: formatPrice(j.totalCost),
                              })),
                              "lamination_jobs",
                              [
                                { key: "timestamp", label: "Ημερομηνία" },
                                { key: "uid", label: "Χρήστης (ID)" },
                                { key: "userDisplayName", label: "Όνομα" },
                                { key: "type", label: "Είδος" },
                                { key: "quantity", label: "Ποσότητα" },
                                { key: "totalCost", label: "Κόστος" }
                              ],
                              "22C55E",
                              "Ιστορικό Πλαστικοποιήσεων"
                            )
                          }
                          variant="outline"
                          size="sm"
                          className="bg-white border-green-300 text-green-700 hover:bg-green-50"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Εξαγωγή XLSX
                        </Button>
                      </div>
                    </div>
                    <div className="p-6">
                      <ErrorBoundary fallback={<div>Φόρτωση πλαστικοποιήσεων...</div>}>
                        <LaminationJobsTable
                          data={filteredLaminationJobs}
                          page={laminationJobsPage}
                          pageSize={PAGE_SIZE}
                          onPageChange={setLaminationJobsPage}
                          userRole={user.role}
                        />
                      </ErrorBoundary>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Chart at the bottom */}
            <div className="bg-blue-50 p-6 rounded-lg space-y-6 w-full max-w-full">
              <UsageChart
                data={generateChartData()}
                title="Μηνιαία Κόστη (Τελευταίοι 6 Μήνες)"
                printLabel="Εκτυπώσεις"
                laminationLabel="Πλαστικοποιήσεις"
              />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
