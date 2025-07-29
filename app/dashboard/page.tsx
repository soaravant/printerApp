"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/lib/refresh-context"
import { dummyDB } from "@/lib/dummy-database"
import type { PrintJob, LaminationJob, PrintBilling, LaminationBilling, User, Income } from "@/lib/dummy-database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { GreekDatePicker } from "@/components/ui/greek-date-picker"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { Printer, CreditCard, TrendingUp, Receipt, Calendar, Settings, X, Download, RotateCcw, Filter, FileText, BarChart3 } from "lucide-react"
import * as XLSX from "xlsx-js-style"
import React from "react"
import { BillingFilters } from "@/components/billing-filters"
import { PrintFilters } from "@/components/print-filters"
import { LaminationFilters } from "@/components/lamination-filters"

// Error boundary component for dynamic imports
function ErrorBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  return (
    <React.Suspense fallback={fallback}>
      {children}
    </React.Suspense>
  )
}


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
const CombinedDebtTable = dynamic(() => import("@/components/combined-debt-table"), {
  loading: () => <div className="w-full flex justify-center items-center py-8">Φόρτωση συγκεντρωτικού πίνακα...</div>,
  ssr: false,
})
const LaminationBillingTable = dynamic(() => import("@/components/lamination-billing-table"), {
  loading: () => <div className="w-full flex justify-center items-center py-8">Φόρτωση χρεώσεων πλαστικοποιήσεων...</div>,
  ssr: false,
})
const IncomeTable = dynamic(() => import("@/components/income-table"), {
  loading: () => <div className="w-full flex justify-center items-center py-8">Φόρτωση εσόδων...</div>,
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
  const [income, setIncome] = useState<Income[]>([])

  // Unified filtering states
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all") // For lamination type
  const [deviceFilter, setDeviceFilter] = useState("all") // For printer device
  const [userFilter, setUserFilter] = useState("all") // For admin to filter by user

  // Tab-specific filtering states
  const [activeTab, setActiveTab] = useState("printing")
  const [printTypeFilter, setPrintTypeFilter] = useState("all") // For print type (A4 BW, A4 Color, etc.)
  const [machineFilter, setMachineFilter] = useState("all") // For lamination machine (Πλαστικοποίηση, Βιβλιοδεσία)
  const [laminationTypeFilter, setLaminationTypeFilter] = useState("all") // For lamination type based on machine

  // Billing table specific filters (copied from admin page)
  const [billingSearchTerm, setBillingSearchTerm] = useState("")
  const [billingDebtFilter, setBillingDebtFilter] = useState("all") // all, print, lamination, both
  const [billingAmountFilter, setBillingAmountFilter] = useState("all") // all, under10, 10to50, over50
  const [billingPriceRange, setBillingPriceRange] = useState<[number, number]>([0, 100])
  const [billingPriceRangeInputs, setBillingPriceRangeInputs] = useState<[string, string]>(["0", "100"])
  const [billingRoleFilter, setBillingRoleFilter] = useState("all") // all, Άτομο, Ομάδα, Ναός, Τομέας

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
  const [incomePage, setIncomePage] = useState(1)
  const PAGE_SIZE = 10

  // Hover state for highlighting statistics
  const [hoveredPrintJob, setHoveredPrintJob] = useState<{ deviceName: string; printType: string } | null>(null)
  const [hoveredLaminationJob, setHoveredLaminationJob] = useState<{ machine: string; type: string } | null>(null)

  useEffect(() => {
    if (!user) return

    if (user.accessLevel === "admin") {
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
      setIncome(dummyDB.getFreshIncome())
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
      setIncome(dummyDB.getFreshIncome(user.uid))
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
    // New tab-specific filters
    activeTab,
    printTypeFilter,
    machineFilter,
    laminationTypeFilter,
    // Billing table filters
    billingSearchTerm,
    billingDebtFilter,
    billingPriceRange,
    billingAmountFilter,
    billingRoleFilter,
  ])

  // Reset page on filter change
  useEffect(() => {
    setPrintJobsPage(1)
    setLaminationJobsPage(1)
    setPrintBillingPage(1)
    setLaminationBillingPage(1)
  }, [searchTerm, dateFrom, dateTo, statusFilter, typeFilter, deviceFilter, userFilter])

  // Auto-set print type filter when Canon B/W or Brother is selected
  useEffect(() => {
    if (deviceFilter === "Canon B/W" || deviceFilter === "Brother") {
      setPrintTypeFilter("a4BW")
    }
  }, [deviceFilter])

  // Calculate price distribution for billing table filtering
  const calculateBillingPriceDistribution = () => {
    const allAmounts: number[] = []
    
    printBilling.forEach((billing) => {
      if (billing.remainingBalance > 0) {
        allAmounts.push(billing.remainingBalance)
      }
    })

    if (allAmounts.length === 0) {
      return {
        min: 0,
        max: 100,
        distribution: {
          "0-20": 0,
          "20-35": 0,
          "35-90": 0,
          "90+": 0
        }
      }
    }

    const min = Math.min(...allAmounts)
    const max = Math.max(...allAmounts)
    
    // Create distribution buckets
    const distribution = {
      "0-20": allAmounts.filter(amount => amount <= 20).length,
      "20-35": allAmounts.filter(amount => amount > 20 && amount <= 35).length,
      "35-90": allAmounts.filter(amount => amount > 35 && amount <= 90).length,
      "90+": allAmounts.filter(amount => amount > 90).length
    }

    return { min, max, distribution }
  }

  const billingPriceDistribution = calculateBillingPriceDistribution()

  // Update billing price range when distribution changes
  useEffect(() => {
    setBillingPriceRange([0, billingPriceDistribution.max])
    setBillingPriceRangeInputs(["0", billingPriceDistribution.max.toString()])
  }, [billingPriceDistribution.max])

  const applyFilters = () => {
    // Filter Print Billing with billing-specific filters
    let filteredPB = [...printBilling]
    
    // Apply billing search filter
    if (billingSearchTerm) {
      filteredPB = filteredPB.filter(
        (item) =>
          item.period.toLowerCase().includes(billingSearchTerm.toLowerCase()) ||
          item.userDisplayName.toLowerCase().includes(billingSearchTerm.toLowerCase()),
      )
    }

    // Apply billing debt filter
    if (billingDebtFilter !== "all") {
      filteredPB = filteredPB.filter((item) => {
        if (billingDebtFilter === "paid") return item.paid
        if (billingDebtFilter === "unpaid") return !item.paid
        return true
      })
    }

    // Apply billing price range filter
    if (billingPriceRange[0] !== billingPriceDistribution.min || billingPriceRange[1] !== billingPriceDistribution.max) {
      filteredPB = filteredPB.filter((item) => {
        return item.remainingBalance >= billingPriceRange[0] && item.remainingBalance <= billingPriceRange[1]
      })
    }

    // Apply billing amount filter
    if (billingAmountFilter !== "all") {
      filteredPB = filteredPB.filter((item) => {
        switch (billingAmountFilter) {
          case "under10":
            return item.remainingBalance < 10
          case "10to50":
            return item.remainingBalance >= 10 && item.remainingBalance <= 50
          case "over50":
            return item.remainingBalance > 50
          default:
            return true
        }
      })
    }

    // Apply billing role filter
    if (billingRoleFilter !== "all") {
      filteredPB = filteredPB.filter((item) => {
        const userData = dummyDB.getUserById(item.uid)
        return userData?.userRole === billingRoleFilter
      })
    }

    // Apply legacy filters for backward compatibility
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

    // Filter Print Jobs with tab-specific filters
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
    
    // Apply print type filter
    if (printTypeFilter !== "all") {
      filteredPJ = filteredPJ.filter((item) => {
        switch (printTypeFilter) {
          case "a4BW":
            return item.pagesA4BW > 0
          case "a4Color":
            return item.pagesA4Color > 0
          case "a3BW":
            return item.pagesA3BW > 0
          case "a3Color":
            return item.pagesA3Color > 0
          case "rizochartoA3":
            return item.pagesRizochartoA3 > 0
          case "rizochartoA4":
            return item.pagesRizochartoA4 > 0
          case "chartoniA3":
            return item.pagesChartoniA3 > 0
          case "chartoniA4":
            return item.pagesChartoniA4 > 0
          case "autokollito":
            return item.pagesAutokollito > 0
          default:
            return true
        }
      })
    }
    setFilteredPrintJobs(filteredPJ)

    // Filter Lamination Billing with billing-specific filters
    let filteredLB = [...laminationBilling]
    
    // Apply billing search filter
    if (billingSearchTerm) {
      filteredLB = filteredLB.filter(
        (item) =>
          item.period.toLowerCase().includes(billingSearchTerm.toLowerCase()) ||
          item.userDisplayName.toLowerCase().includes(billingSearchTerm.toLowerCase()),
      )
    }

    // Apply billing debt filter
    if (billingDebtFilter !== "all") {
      filteredLB = filteredLB.filter((item) => {
        if (billingDebtFilter === "paid") return item.paid
        if (billingDebtFilter === "unpaid") return !item.paid
        return true
      })
    }

    // Apply billing price range filter
    if (billingPriceRange[0] !== billingPriceDistribution.min || billingPriceRange[1] !== billingPriceDistribution.max) {
      filteredLB = filteredLB.filter((item) => {
        return item.remainingBalance >= billingPriceRange[0] && item.remainingBalance <= billingPriceRange[1]
      })
    }

    // Apply billing amount filter
    if (billingAmountFilter !== "all") {
      filteredLB = filteredLB.filter((item) => {
        switch (billingAmountFilter) {
          case "under10":
            return item.remainingBalance < 10
          case "10to50":
            return item.remainingBalance >= 10 && item.remainingBalance <= 50
          case "over50":
            return item.remainingBalance > 50
          default:
            return true
        }
      })
    }

    // Apply billing role filter
    if (billingRoleFilter !== "all") {
      filteredLB = filteredLB.filter((item) => {
        const userData = dummyDB.getUserById(item.uid)
        return userData?.userRole === billingRoleFilter
      })
    }

    // Apply legacy filters for backward compatibility
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

    // Filter Lamination Jobs with tab-specific filters
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
    
    // Apply machine filter
    if (machineFilter !== "all") {
      filteredLJ = filteredLJ.filter((item) => {
        // Filter based on machine type
        if (machineFilter === "lamination") {
          // Only include laminator types: A3, A4, A5, cards
          return ["A3", "A4", "A5", "cards"].includes(item.type)
        }
        if (machineFilter === "binding") {
          // Only include binding types: spiral, colored_cardboard, plastic_cover
          return ["spiral", "colored_cardboard", "plastic_cover"].includes(item.type)
        }
        return true
      })
    }
    
    // Apply lamination type filter
    if (laminationTypeFilter !== "all") {
      filteredLJ = filteredLJ.filter((item) => item.type === laminationTypeFilter)
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
    // Clear tab-specific filters
    setPrintTypeFilter("all")
    setMachineFilter("all")
    setLaminationTypeFilter("all")
    // Clear billing table filters
    setBillingSearchTerm("")
    setBillingDebtFilter("all")
    setBillingAmountFilter("all")
    setBillingPriceRange([0, billingPriceDistribution.max])
    setBillingPriceRangeInputs(["0", billingPriceDistribution.max.toString()])
    setBillingRoleFilter("all")
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

  // Calculate totals based on user debt fields
  const allUsersData = dummyDB.getUsers()
  const relevantUsers = user.accessLevel === "admin" ? allUsersData : allUsersData.filter(u => u.uid === user.uid)
  
  const printUnpaid = relevantUsers.reduce((sum, u) => sum + (u.printDebt || 0), 0)
  const laminationUnpaid = relevantUsers.reduce((sum, u) => sum + (u.laminationDebt || 0), 0)
  const totalUnpaid = printUnpaid + laminationUnpaid

  // Calculate totals without filters for percentage calculations
  const totalPrintUnpaid = allUsersData.reduce((sum, u) => sum + (u.printDebt || 0), 0)
  const totalLaminationUnpaid = allUsersData.reduce((sum, u) => sum + (u.laminationDebt || 0), 0)

  // Check if any filters are applied
  const hasFilters = billingSearchTerm || 
                    billingDebtFilter !== "all" || 
                    billingPriceRange[0] !== billingPriceDistribution.min || 
                    billingPriceRange[1] !== billingPriceDistribution.max ||
                    billingAmountFilter !== "all" || 
                    billingRoleFilter !== "all" ||
                    searchTerm || 
                    statusFilter !== "all" || 
                    userFilter !== "all"

  // Calculate percentages for debt cards
  // Each type shows percentage of its own total (without filters)
  const printUnpaidPercentage = totalPrintUnpaid > 0 ? (printUnpaid / totalPrintUnpaid) * 100 : 0
  const laminationUnpaidPercentage = totalLaminationUnpaid > 0 ? (laminationUnpaid / totalLaminationUnpaid) * 100 : 0
  
  // Calculate total percentage (combined debts)
  const totalCombinedUnpaid = totalPrintUnpaid + totalLaminationUnpaid
  const totalUnpaidPercentage = totalCombinedUnpaid > 0 ? (totalUnpaid / totalCombinedUnpaid) * 100 : 0

  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentMonthPrintJobs = printJobs.filter((j) => j.timestamp.toISOString().slice(0, 7) === currentMonth)
  const currentMonthLaminationJobs = laminationJobs.filter((j) => j.timestamp.toISOString().slice(0, 7) === currentMonth)
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

  // Calculate print statistics
  const calculatePrintStatistics = (hoveredJob?: { deviceName: string; printType: string } | null) => {
    const stats = {
      canonBW: {
        a4BW: 0
      },
      canonColour: {
        a4BW: 0,
        a4Colour: 0,
        a3BW: 0,
        a3Colour: 0,
        a4Total: 0,
        a3Total: 0,
        total: 0
      },
      brother: {
        a4BW: 0
      },
      total: 0
    }

    filteredPrintJobs.forEach(job => {
      if (job.deviceName === "Canon B/W") {
        stats.canonBW.a4BW += job.pagesA4BW
        stats.total += job.pagesA4BW
      } else if (job.deviceName === "Canon Colour") {
        stats.canonColour.a4BW += job.pagesA4BW
        stats.canonColour.a4Colour += job.pagesA4Color
        stats.canonColour.a3BW += job.pagesA3BW
        stats.canonColour.a3Colour += job.pagesA3Color
      } else if (job.deviceName === "Brother") {
        stats.brother.a4BW += job.pagesA4BW
        stats.total += job.pagesA4BW
      }
    })

    // Calculate totals after all jobs are processed
    stats.canonColour.a4Total = stats.canonColour.a4BW + stats.canonColour.a4Colour
    stats.canonColour.a3Total = stats.canonColour.a3BW + stats.canonColour.a3Colour
    stats.canonColour.total = stats.canonColour.a4Total + stats.canonColour.a3Total
    
    // Calculate overall total
    stats.total = stats.canonBW.a4BW + stats.canonColour.total + stats.brother.a4BW

    return stats
  }

  // Calculate lamination statistics
  const calculateLaminationStatistics = (hoveredJob?: { machine: string; type: string } | null) => {
    const stats = {
      laminator: {
        a3: 0,
        a4: 0,
        a5: 0,
        cards: 0
      },
      binding: {
        spiral: 0,
        coloredCardboard: 0,
        plasticCover: 0
      }
    }

    filteredLaminationJobs.forEach(job => {
      if (["A3", "A4", "A5", "cards"].includes(job.type)) {
        if (job.type === "A3") stats.laminator.a3 += job.quantity
        else if (job.type === "A4") stats.laminator.a4 += job.quantity
        else if (job.type === "A5") stats.laminator.a5 += job.quantity
        else if (job.type === "cards") stats.laminator.cards += job.quantity
      } else if (["spiral", "colored_cardboard", "plastic_cover"].includes(job.type)) {
        if (job.type === "spiral") stats.binding.spiral += job.quantity
        else if (job.type === "colored_cardboard") stats.binding.coloredCardboard += job.quantity
        else if (job.type === "plastic_cover") stats.binding.plasticCover += job.quantity
      }
    })

    return stats
  }

  const printStats = calculatePrintStatistics(hoveredPrintJob)
  const laminationStats = calculateLaminationStatistics(hoveredLaminationJob)

  // Helper functions to determine if a statistic should be highlighted
  const isPrintStatHighlighted = (deviceName: string, printType: string) => {
    if (!hoveredPrintJob) return false
    return hoveredPrintJob.deviceName === deviceName && hoveredPrintJob.printType === printType
  }

  const isLaminationStatHighlighted = (machine: string, type: string) => {
    if (!hoveredLaminationJob) return false
    return hoveredLaminationJob.machine === machine && hoveredLaminationJob.type === type
  }

  // Generate chart data for last 6 months


  // Get unique devices for filter
  const uniqueDevices = [...new Set(printJobs.map((job) => job.deviceName).filter(Boolean))]

  // Calculate combined debt data for the total debt table
  const calculateCombinedDebtData = () => {
    const userDebtMap = new Map<string, {
      uid: string
      userDisplayName: string
      userRole: string
      responsiblePerson: string
      printDebt: number
      laminationDebt: number
      totalDebt: number
      lastPayment: Date | null
    }>()

    // Get all users and their debt information
    allUsersData.forEach(user => {
      // Skip admin users from the debt table
      if (user.accessLevel === "admin") return
      
      const responsiblePerson = user.userRole === "Άτομο" 
        ? user.displayName 
        : user.responsiblePerson || "-"
      
      // Get user's current debt from their debt fields
      const printDebt = user.printDebt || 0
      const laminationDebt = user.laminationDebt || 0
      const totalDebt = user.totalDebt || 0
      
      // Find the most recent payment date from billing records
      let lastPayment: Date | null = null
      
      const userPrintBilling = filteredPrintBilling.filter(b => b.uid === user.uid)
      const userLaminationBilling = filteredLaminationBilling.filter(b => b.uid === user.uid)
      
      // Check print billing for last payment
      userPrintBilling.forEach(billing => {
        if (billing.lastPayment && (!lastPayment || billing.lastPayment > lastPayment)) {
          lastPayment = billing.lastPayment
        }
      })
      
      // Check lamination billing for last payment
      userLaminationBilling.forEach(billing => {
        if (billing.lastPayment && (!lastPayment || billing.lastPayment > lastPayment)) {
          lastPayment = billing.lastPayment
        }
      })
      
      userDebtMap.set(user.uid, {
        uid: user.uid,
        userDisplayName: user.displayName,
        userRole: user.userRole,
        responsiblePerson: responsiblePerson,
        printDebt: printDebt,
        laminationDebt: laminationDebt,
        totalDebt: totalDebt,
        lastPayment: lastPayment
      })
    })

    return Array.from(userDebtMap.values())
  }

  const combinedDebtData = calculateCombinedDebtData()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Πίνακας Ελέγχου</h1>
                <p className="text-gray-600">
                  Καλώς ήρθατε, {user.displayName}
                  {user.accessLevel === "admin" && " - Προβολή όλων των δεδομένων"}
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Debts Card - Yellow Theme */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full overflow-hidden">
                <div className="bg-yellow-100 px-6 py-4 border-b border-yellow-200">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-8 w-8 text-yellow-700" />
                    <h3 className="text-lg font-semibold text-yellow-900">Σύνολο Χρέους/Πίστωσης</h3>
                  </div>
                </div>
                <div className={`p-6 flex-1 flex ${hasFilters && totalUnpaidPercentage < 100 ? 'justify-start gap-4 items-end' : 'justify-start items-center'}`}>
                  <div className={`text-3xl font-bold ${totalUnpaid > 0 ? 'text-red-600' : totalUnpaid < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {totalUnpaid > 0 ? formatPrice(totalUnpaid) : totalUnpaid < 0 ? `-${formatPrice(Math.abs(totalUnpaid))}` : formatPrice(totalUnpaid)}
                  </div>
                  {hasFilters && totalUnpaidPercentage < 100 && (
                    <div className="text-sm text-gray-500 pb-0.5">({totalUnpaidPercentage.toFixed(1)}% του {formatPrice(totalCombinedUnpaid)})</div>
                  )}
                </div>
              </div>

              {/* Print Debts Card - Blue Theme */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full overflow-hidden">
                <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                  <div className="flex items-center gap-3">
                    <Printer className="h-6 w-6 text-blue-700" />
                    <h3 className="text-lg font-semibold text-blue-900">Χρέος/Πίστωση ΤΟ. ΦΩ.</h3>
                  </div>
                </div>
                <div className={`p-6 flex-1 flex ${hasFilters && printUnpaidPercentage < 100 ? 'justify-start gap-4 items-end' : 'justify-start items-center'}`}>
                  <div className={`text-3xl font-bold ${printUnpaid > 0 ? 'text-red-600' : printUnpaid < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {printUnpaid > 0 ? formatPrice(printUnpaid) : printUnpaid < 0 ? `-${formatPrice(Math.abs(printUnpaid))}` : formatPrice(printUnpaid)}
                  </div>
                  {hasFilters && printUnpaidPercentage < 100 && (
                    <div className="text-sm text-gray-500 pb-0.5">({printUnpaidPercentage.toFixed(1)}% του {formatPrice(totalPrintUnpaid)})</div>
                  )}
                </div>
              </div>

              {/* Lamination Debts Card - Green Theme */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full overflow-hidden">
                <div className="bg-green-100 px-6 py-4 border-b border-green-200">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-green-700" />
                    <h3 className="text-lg font-semibold text-green-900">Χρέος/Πίστωση ΠΛΑ. ΤΟ.</h3>
                  </div>
                </div>
                <div className={`p-6 flex-1 flex ${hasFilters && laminationUnpaidPercentage < 100 ? 'justify-start gap-4 items-end' : 'justify-start items-center'}`}>
                  <div className={`text-3xl font-bold ${laminationUnpaid > 0 ? 'text-red-600' : laminationUnpaid < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                    {laminationUnpaid > 0 ? formatPrice(laminationUnpaid) : laminationUnpaid < 0 ? `-${formatPrice(Math.abs(laminationUnpaid))}` : formatPrice(laminationUnpaid)}
                  </div>
                  {hasFilters && laminationUnpaidPercentage < 100 && (
                    <div className="text-sm text-gray-500 pb-0.5">({laminationUnpaidPercentage.toFixed(1)}% του {formatPrice(totalLaminationUnpaid)})</div>
                  )}
                </div>
              </div>
            </div>

            {/* Consolidated Table Card */}
            <BillingFilters
              billingSearchTerm={billingSearchTerm}
              setBillingSearchTerm={setBillingSearchTerm}
              billingDebtFilter={billingDebtFilter}
              setBillingDebtFilter={setBillingDebtFilter}
              billingAmountFilter={billingAmountFilter}
              setBillingAmountFilter={setBillingAmountFilter}
              billingPriceRange={billingPriceRange}
              setBillingPriceRange={setBillingPriceRange}
              billingPriceRangeInputs={billingPriceRangeInputs}
              setBillingPriceRangeInputs={setBillingPriceRangeInputs}
              billingRoleFilter={billingRoleFilter}
              setBillingRoleFilter={setBillingRoleFilter}
              billingPriceDistribution={billingPriceDistribution}
              printBilling={printBilling}
              users={dummyDB.getUsers()}
              clearFilters={clearFilters}
            />
            

            
            {/* Consolidated Table Card */}
            <div className="bg-white rounded-lg border border-yellow-200 shadow-sm overflow-hidden mb-8">
              <div className="bg-yellow-100 px-6 py-4 border-b border-yellow-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-6 w-6 text-yellow-700" />
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-900">Συγκεντρωτικός Πίνακας Χρέους/Πίστωσης</h3>
                      <p className="text-sm text-yellow-700">Συγκεντρωμένα δεδομένα χρεώσεων, πληρωμών και πιστώσεων</p>
                    </div>
                  </div>
                  {user.accessLevel === "admin" && (
                    <Button
                      onClick={() =>
                        exportTableXLSX(
                          combinedDebtData.map((item) => ({
                            userRole: item.userRole,
                            userDisplayName: item.userDisplayName,
                            responsiblePerson: item.responsiblePerson,
                            currentDebt: `${item.printDebt > 0 ? formatPrice(item.printDebt) : item.printDebt < 0 ? `-${formatPrice(Math.abs(item.printDebt))}` : formatPrice(item.printDebt)} | ${item.laminationDebt > 0 ? formatPrice(item.laminationDebt) : item.laminationDebt < 0 ? `-${formatPrice(Math.abs(item.laminationDebt))}` : formatPrice(item.laminationDebt)} | ${item.totalDebt > 0 ? formatPrice(item.totalDebt) : item.totalDebt < 0 ? `-${formatPrice(Math.abs(item.totalDebt))}` : formatPrice(item.totalDebt)}`,
                            lastPayment: item.lastPayment ? item.lastPayment.toLocaleDateString("el-GR") : "-",
                          })),
                          "combined_debt",
                          [
                            { key: "userRole", label: "Ρόλος" },
                            { key: "userDisplayName", label: "Όνομα" },
                            { key: "responsiblePerson", label: "Υπεύθυνος" },
                            { key: "currentDebt", label: "Τρέχον Χρέος/Πίστωση (ΤΟ. ΦΩ. | ΠΛΑ. ΤΟ. | Σύνολο)" },
                            { key: "lastPayment", label: "Τελευταία Εξόφληση" }
                          ],
                          "EAB308",
                          "Συγκεντρωτικός Πίνακας Χρέους/Πίστωσης"
                        )
                      }
                      variant="outline"
                      size="sm"
                      className="bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Εξαγωγή XLSX
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <CombinedDebtTable
                  data={combinedDebtData}
                  page={printBillingPage}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPrintBillingPage}
                  userRole={user.accessLevel}
                  onRowHover={setHoveredPrintJob}
                />
              </div>
            </div>

            {/* Income Table */}
            <div className="bg-white rounded-lg border border-yellow-200 shadow-sm overflow-hidden mb-8">
              <div className="bg-yellow-100 px-6 py-4 border-b border-yellow-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-6 w-6 text-yellow-700" />
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-900">Έσοδα</h3>
                      <p className="text-sm text-yellow-700">Ιστορικό εσόδων από πληρωμές</p>
                    </div>
                  </div>
                  {user.accessLevel === "admin" && (
                    <Button
                      onClick={() =>
                        exportTableXLSX(
                          income.map((incomeRecord) => ({
                            timestamp: incomeRecord.timestamp.toLocaleDateString("el-GR"),
                            userDisplayName: incomeRecord.userDisplayName,
                            amount: formatPrice(incomeRecord.amount),
                          })),
                          "income_history",
                          [
                            { key: "timestamp", label: "Ημερομηνία" },
                            { key: "userDisplayName", label: "Χρήστης" },
                            { key: "amount", label: "Ποσό" }
                          ],
                          "EAB308",
                          "Έσοδα"
                        )
                      }
                      variant="outline"
                      size="sm"
                      className="bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Εξαγωγή XLSX
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <ErrorBoundary fallback={<div>Φόρτωση εσόδων...</div>}>
                  <IncomeTable
                    data={income}
                    page={incomePage}
                    pageSize={PAGE_SIZE}
                    onPageChange={setIncomePage}
                    userRole={user.accessLevel}
                  />
                </ErrorBoundary>
              </div>
            </div>

            {/* Tabs for Print and Lamination */}
            <Tabs defaultValue="printing" className="w-full mb-8 mt-12" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 h-16 p-1">
                <TabsTrigger
                  value="printing"
                  className="flex items-center gap-3 py-4 px-6 text-base font-medium data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                >
                  <Printer className="h-6 w-6" />
                  ΤΟ. ΦΩ.
                </TabsTrigger>
                <TabsTrigger
                  value="lamination"
                  className="flex items-center gap-3 py-4 px-6 text-base font-medium data-[state=active]:bg-green-100 data-[state=active]:text-green-700 hover:bg-green-50 hover:text-green-600 transition-colors duration-200"
                >
                  <CreditCard className="h-6 w-6" />
                  ΠΛΑ. ΤΟ.
                </TabsTrigger>
              </TabsList>

              {/* Tab-specific Filters */}
              <div className="mt-4">
                {activeTab === "printing" ? (
                  <PrintFilters
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    dateFrom={dateFrom}
                    setDateFrom={setDateFrom}
                    dateTo={dateTo}
                    setDateTo={setDateTo}
                    deviceFilter={deviceFilter}
                    setDeviceFilter={setDeviceFilter}
                    printTypeFilter={printTypeFilter}
                    setPrintTypeFilter={setPrintTypeFilter}
                    uniqueDevices={uniqueDevices}
                    clearFilters={clearFilters}
                  />
                ) : (
                  <LaminationFilters
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    dateFrom={dateFrom}
                    setDateFrom={setDateFrom}
                    dateTo={dateTo}
                    setDateTo={setDateTo}
                    machineFilter={machineFilter}
                    setMachineFilter={setMachineFilter}
                    laminationTypeFilter={laminationTypeFilter}
                    setLaminationTypeFilter={setLaminationTypeFilter}
                    clearFilters={clearFilters}
                  />
                )}
              </div>

              <TabsContent value="printing" className="mt-4">
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
                        {user.accessLevel === "admin" && (
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
                                
                                if (job.pagesRizochartoA3 > 0) {
                                  rows.push({
                                    timestamp: job.timestamp.toLocaleString("el-GR"),
                                    uid: job.uid,
                                    userDisplayName: job.userDisplayName,
                                    deviceName: job.deviceName,
                                    printType: "Ριζόχαρτο A3",
                                    quantity: job.pagesRizochartoA3,
                                    cost: formatPrice(job.pagesRizochartoA3 * 0.10)
                                  })
                                }
                                
                                if (job.pagesRizochartoA4 > 0) {
                                  rows.push({
                                    timestamp: job.timestamp.toLocaleString("el-GR"),
                                    uid: job.uid,
                                    userDisplayName: job.userDisplayName,
                                    deviceName: job.deviceName,
                                    printType: "Ριζόχαρτο A4",
                                    quantity: job.pagesRizochartoA4,
                                    cost: formatPrice(job.pagesRizochartoA4 * 0.10)
                                  })
                                }
                                
                                if (job.pagesChartoniA3 > 0) {
                                  rows.push({
                                    timestamp: job.timestamp.toLocaleString("el-GR"),
                                    uid: job.uid,
                                    userDisplayName: job.userDisplayName,
                                    deviceName: job.deviceName,
                                    printType: "Χαρτόνι A3",
                                    quantity: job.pagesChartoniA3,
                                    cost: formatPrice(job.pagesChartoniA3 * 0.10)
                                  })
                                }
                                
                                if (job.pagesChartoniA4 > 0) {
                                  rows.push({
                                    timestamp: job.timestamp.toLocaleString("el-GR"),
                                    uid: job.uid,
                                    userDisplayName: job.userDisplayName,
                                    deviceName: job.deviceName,
                                    printType: "Χαρτόνι A4",
                                    quantity: job.pagesChartoniA4,
                                    cost: formatPrice(job.pagesChartoniA4 * 0.10)
                                  })
                                }
                                
                                if (job.pagesAutokollito > 0) {
                                  rows.push({
                                    timestamp: job.timestamp.toLocaleString("el-GR"),
                                    uid: job.uid,
                                    userDisplayName: job.userDisplayName,
                                    deviceName: job.deviceName,
                                    printType: "Αυτοκόλλητο",
                                    quantity: job.pagesAutokollito,
                                    cost: formatPrice(job.pagesAutokollito * 0.10)
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
                                  { key: "username", label: "Χρήστης" },
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
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      <ErrorBoundary fallback={<div>Φόρτωση εκτυπώσεων...</div>}>
                        <PrintJobsTable
                          data={filteredPrintJobs}
                          page={printJobsPage}
                          pageSize={PAGE_SIZE}
                          onPageChange={setPrintJobsPage}
                          userRole={user.accessLevel}
                          onRowHover={setHoveredPrintJob}
                          printTypeFilter={printTypeFilter}
                        />
                      </ErrorBoundary>
                    </div>
                  </div>
                </div>

                {/* Print Statistics Cards */}
                <div className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Canon Colour Statistics */}
                    <div className="md:col-span-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                      <div className="bg-blue-100 px-4 py-3 border-b border-blue-200">
                        <div className="flex items-center gap-2">
                          <Printer className="h-5 w-5 text-blue-700" />
                          <h3 className="text-sm font-semibold text-blue-900">Canon Colour</h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div>
                            <div className="text-xs text-gray-600">A4 B/W</div>
                            <div className={`text-lg font-bold ${
                              isPrintStatHighlighted("Canon Colour", "A4 Ασπρόμαυρο") 
                                ? "text-blue-600 bg-blue-100 rounded px-1" 
                                : "text-black"
                            }`}>
                              {printStats.canonColour.a4BW}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">A4 Colour</div>
                            <div className={`text-lg font-bold ${
                              isPrintStatHighlighted("Canon Colour", "A4 Έγχρωμο") 
                                ? "text-blue-600 bg-blue-100 rounded px-1" 
                                : "text-black"
                            }`}>
                              {printStats.canonColour.a4Colour}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">A3 B/W</div>
                            <div className={`text-lg font-bold ${
                              isPrintStatHighlighted("Canon Colour", "A3 Ασπρόμαυρο") 
                                ? "text-blue-600 bg-blue-100 rounded px-1" 
                                : "text-black"
                            }`}>
                              {printStats.canonColour.a3BW}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">A3 Colour</div>
                            <div className={`text-lg font-bold ${
                              isPrintStatHighlighted("Canon Colour", "A3 Έγχρωμο") 
                                ? "text-blue-600 bg-blue-100 rounded px-1" 
                                : "text-black"
                            }`}>
                              {printStats.canonColour.a3Colour}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                          <div>
                            <div className="text-xs text-gray-600">A4 Total</div>
                            <div className="text-sm font-bold text-black">{printStats.canonColour.a4Total}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">A3 Total</div>
                            <div className="text-sm font-bold text-black">{printStats.canonColour.a3Total}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Total</div>
                            <div className="text-sm font-bold text-black">{printStats.canonColour.total}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Canon B/W Statistics */}
                    <div className="md:col-span-2 bg-white rounded-lg border border-blue-200 shadow-sm">
                      <div className="bg-blue-100 px-4 py-3 border-b border-blue-200">
                        <div className="flex items-center gap-2">
                          <Printer className="h-5 w-5 text-blue-700" />
                          <h3 className="text-sm font-semibold text-blue-900">Canon B/W</h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-1">A4 B/W</div>
                          <div className={`text-xl font-bold ${
                            isPrintStatHighlighted("Canon B/W", "A4 Ασπρόμαυρο") 
                              ? "text-blue-600 bg-blue-100 rounded px-1" 
                              : "text-black"
                          }`}>
                            {printStats.canonBW.a4BW}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Brother Statistics */}
                    <div className="md:col-span-2 bg-white rounded-lg border border-blue-200 shadow-sm">
                      <div className="bg-blue-100 px-4 py-3 border-b border-blue-200">
                        <div className="flex items-center gap-2">
                          <Printer className="h-5 w-5 text-blue-700" />
                          <h3 className="text-sm font-semibold text-blue-900">Brother</h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-1">A4 B/W</div>
                          <div className={`text-xl font-bold ${
                            isPrintStatHighlighted("Brother", "A4 Ασπρόμαυρο") 
                              ? "text-blue-600 bg-blue-100 rounded px-1" 
                              : "text-black"
                          }`}>
                            {printStats.brother.a4BW}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Total Print Statistics */}
                    <div className="md:col-span-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                      <div className="bg-blue-100 px-4 py-3 border-b border-blue-200">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-blue-700" />
                          <h3 className="text-sm font-semibold text-blue-900">Σύνολο</h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-1">Συνολικές Εκτυπώσεις</div>
                          <div className="text-2xl font-bold text-black">{printStats.total}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="lamination" className="mt-4">
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
                        {user.accessLevel === "admin" && (
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
                                  { key: "username", label: "Χρήστης" },
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
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      <ErrorBoundary fallback={<div>Φόρτωση πλαστικοποιήσεων...</div>}>
                        <LaminationJobsTable
                          data={filteredLaminationJobs}
                          page={laminationJobsPage}
                          pageSize={PAGE_SIZE}
                          onPageChange={setLaminationJobsPage}
                          userRole={user.accessLevel}
                          onRowHover={setHoveredLaminationJob}
                        />
                      </ErrorBoundary>
                    </div>
                  </div>
                </div>

                {/* Lamination Statistics Cards */}
                <div className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Πλαστικοποιητής Statistics */}
                    <div className="bg-green-50 rounded-lg border border-green-200 shadow-sm">
                      <div className="bg-green-100 px-4 py-3 border-b border-green-200">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-green-700" />
                          <h3 className="text-sm font-semibold text-green-900">Πλαστικοποιητής</h3>
                        </div>
                      </div>
                      <div className="bg-white p-4">
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div>
                            <div className="text-xs text-gray-600">Α3</div>
                            <div className={`text-lg font-bold ${
                              isLaminationStatHighlighted("laminator", "A3") 
                                ? "text-green-600 bg-green-100 rounded px-1" 
                                : "text-gray-900"
                            }`}>
                              {laminationStats.laminator.a3}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Α4</div>
                            <div className={`text-lg font-bold ${
                              isLaminationStatHighlighted("laminator", "A4") 
                                ? "text-green-600 bg-green-100 rounded px-1" 
                                : "text-gray-900"
                            }`}>
                              {laminationStats.laminator.a4}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Α5</div>
                            <div className={`text-lg font-bold ${
                              isLaminationStatHighlighted("laminator", "A5") 
                                ? "text-green-600 bg-green-100 rounded px-1" 
                                : "text-gray-900"
                            }`}>
                              {laminationStats.laminator.a5}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Κάρτες</div>
                            <div className={`text-lg font-bold ${
                              isLaminationStatHighlighted("laminator", "cards") 
                                ? "text-green-600 bg-green-100 rounded px-1" 
                                : "text-gray-900"
                            }`}>
                              {laminationStats.laminator.cards}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Βιβλιοδεσία Statistics */}
                    <div className="bg-green-50 rounded-lg border border-green-200 shadow-sm">
                      <div className="bg-green-100 px-4 py-3 border-b border-green-200">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-green-700" />
                          <h3 className="text-sm font-semibold text-green-900">Βιβλιοδεσία</h3>
                        </div>
                      </div>
                      <div className="bg-white p-4">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-xs text-gray-600">Σπιράλ</div>
                            <div className={`text-lg font-bold ${
                              isLaminationStatHighlighted("binding", "spiral") 
                                ? "text-green-600 bg-green-100 rounded px-1" 
                                : "text-gray-900"
                            }`}>
                              {laminationStats.binding.spiral}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Χρωματιστά Χαρτόνια</div>
                            <div className={`text-lg font-bold ${
                              isLaminationStatHighlighted("binding", "colored_cardboard") 
                                ? "text-green-600 bg-green-100 rounded px-1" 
                                : "text-gray-900"
                            }`}>
                              {laminationStats.binding.coloredCardboard}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Πλαστικό Κάλυμμα</div>
                            <div className={`text-lg font-bold ${
                              isLaminationStatHighlighted("binding", "plastic_cover") 
                                ? "text-green-600 bg-green-100 rounded px-1" 
                                : "text-gray-900"
                            }`}>
                              {laminationStats.binding.plasticCover}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>


          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
