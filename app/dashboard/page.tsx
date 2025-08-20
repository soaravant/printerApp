"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/lib/refresh-context"
// import { dummyDB } from "@/lib/dummy-database"
import type { PrintJob, LaminationJob, User, Income } from "@/lib/dummy-database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { GreekDatePicker } from "@/components/ui/greek-date-picker"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import dynamic from "next/dynamic"
import { useState, useEffect, useRef, useMemo } from "react"
import { Printer, CreditCard, TrendingUp, Receipt, Calendar, Settings, X, Download, RotateCcw, Filter, FileText, BarChart3 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
// Note: Load XLSX only on demand to avoid adding it to the main bundle
let XLSX: any
import React from "react"

import { PrintFilters } from "@/components/print-filters"
import { LaminationFilters } from "@/components/lamination-filters"
import { DebtFilters } from "@/components/debt-filters"
import { IncomeFilters } from "@/components/income-filters"

// Firestore
import { fetchBankTotals, fetchIncomeFor, fetchLaminationJobsFor, fetchPrintJobsFor, useUsers, usePrintJobsInfinite, useLaminationJobsInfinite, useIncomeInfinite } from "@/lib/firebase-queries"
import { FIREBASE_COLLECTIONS } from "@/lib/firebase-schema"
import { normalizeGreek } from "@/lib/utils"

// Error boundary component for dynamic imports
function ErrorBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  return (
    <React.Suspense fallback={fallback}>
      {children}
    </React.Suspense>
  )
}

const useFirestore = process.env.NEXT_PUBLIC_USE_FIRESTORE === "true"

const PrintJobsTable = dynamic(() => import("@/components/print-jobs-table"), {
  loading: () => <div className="w-full flex justify-center items-center py-8">Φόρτωση εκτυπώσεων...</div>,
  ssr: false,
})
const LaminationJobsTable = dynamic(() => import("@/components/lamination-jobs-table"), {
  loading: () => <div className="w-full flex justify-center items-center py-8">Φόρτωση πλαστικοποιήσεων...</div>,
  ssr: false,
})
const DebtTable = dynamic(() => import("@/components/debt-table"), {
  loading: () => <div className="w-full flex justify-center items-center py-8">Φόρτωση συγκεντρωτικού πίνακα...</div>,
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
  const { refreshTrigger, triggerRefresh, setLoading } = useRefresh()
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([])
  const [laminationJobs, setLaminationJobs] = useState<LaminationJob[]>([])
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

  // Debt filtering states
  const [debtSearchTerm, setDebtSearchTerm] = useState("")
  const [debtFilter, setDebtFilter] = useState("all")
  const [amountFilter, setAmountFilter] = useState("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])
  const [priceRangeInputs, setPriceRangeInputs] = useState<[string, string]>(["0", "100"])
  const [roleFilter, setRoleFilter] = useState("all")
  const [teamFilter, setTeamFilter] = useState("all")
  const [responsibleForFilter, setResponsibleForFilter] = useState("all")

  // Income filtering states
  const [incomeSearchTerm, setIncomeSearchTerm] = useState("")
  const [incomeRoleFilter, setIncomeRoleFilter] = useState("all")
  const [incomeDateFrom, setIncomeDateFrom] = useState("")
  const [incomeDateTo, setIncomeDateTo] = useState("")
  const [incomeAmountRange, setIncomeAmountRange] = useState<[number, number]>([0, 100])
  const [incomeAmountInputs, setIncomeAmountInputs] = useState<[string, string]>(["0", "100"])
  const [incomeResponsibleForFilter, setIncomeResponsibleForFilter] = useState("all")

  // Filtered data states
  const [filteredPrintJobs, setFilteredPrintJobs] = useState<PrintJob[]>([])
  const [filteredLaminationJobs, setFilteredLaminationJobs] = useState<LaminationJob[]>([])
  const [filteredIncome, setFilteredIncome] = useState<Income[]>([])

  // Pagination state
  const [printJobsPage, setPrintJobsPage] = useState(1)
  const [laminationJobsPage, setLaminationJobsPage] = useState(1)
  const [incomePage, setIncomePage] = useState(1)
  const [debtPage, setDebtPage] = useState(1)
  const PAGE_SIZE = 10
  const FETCH_BATCH_SIZE = 100
  const BACKGROUND_CHUNK_SIZE = 100
  const printPrefetchTokenRef = useRef(0)
  const lamPrefetchTokenRef = useRef(0)
  const incomePrefetchTokenRef = useRef(0)

  // Initialize debt range once based on visible users
  const initializedDebtRangeRef = useRef(false)
  // Server pagination cursors
  const [printCursor, setPrintCursor] = useState<any | undefined>(undefined)
  const [lamCursor, setLamCursor] = useState<any | undefined>(undefined)
  const [incomeCursor, setIncomeCursor] = useState<any | undefined>(undefined)
  const [hasMorePrint, setHasMorePrint] = useState<boolean>(false)
  const [hasMoreLam, setHasMoreLam] = useState<boolean>(false)
  const [hasMoreIncome, setHasMoreIncome] = useState<boolean>(false)

  // Hover state for highlighting statistics
  const [hoveredPrintJob, setHoveredPrintJob] = useState<{ deviceName: string; printType: string } | null>(null)
  const [hoveredLaminationJob, setHoveredLaminationJob] = useState<{ machine: string; type: string } | null>(null)

  // Bank reset confirmation states
  const [showPrintBankResetDialog, setShowPrintBankResetDialog] = useState(false)
  const [showLaminationBankResetDialog, setShowLaminationBankResetDialog] = useState(false)
  const [showTotalBankResetDialog, setShowTotalBankResetDialog] = useState(false)

  const { data: cachedUsers } = useUsers()

  // Use react-query infinite caches to avoid reloads when switching routes
  const uidFilter = (user?.accessLevel === "Χρήστης") ? user.uid : undefined
  const printInf = usePrintJobsInfinite(uidFilter, FETCH_BATCH_SIZE)
  const lamInf = useLaminationJobsInfinite(uidFilter, FETCH_BATCH_SIZE)
  const incInf = useIncomeInfinite(uidFilter, FETCH_BATCH_SIZE)

  useEffect(() => {
    if (!user) return
    // If nothing cached yet, kick off fetching first page in background
    if (useFirestore) {
      // Start/continue background prefetch loops to completion
      printPrefetchTokenRef.current += 1
      lamPrefetchTokenRef.current += 1
      incomePrefetchTokenRef.current += 1
      const pTok = printPrefetchTokenRef.current
      const lTok = lamPrefetchTokenRef.current
      const iTok = incomePrefetchTokenRef.current

      ;(async () => {
        // Ensure at least first page
        if (!printInf.data && !printInf.isFetching) await printInf.fetchNextPage()
        // Fetch remaining pages
        while (true) {
          if (printPrefetchTokenRef.current !== pTok) break
          const lastCursor = (printInf.data?.pages.slice(-1)[0]?.nextCursor)
          if (!lastCursor) break
          if (printInf.isFetching) { await new Promise(r => setTimeout(r, 100)); continue }
          await printInf.fetchNextPage()
        }
      })()

      ;(async () => {
        if (!lamInf.data && !lamInf.isFetching) await lamInf.fetchNextPage()
        while (true) {
          if (lamPrefetchTokenRef.current !== lTok) break
          const lastCursor = (lamInf.data?.pages.slice(-1)[0]?.nextCursor)
          if (!lastCursor) break
          if (lamInf.isFetching) { await new Promise(r => setTimeout(r, 100)); continue }
          await lamInf.fetchNextPage()
        }
      })()

      ;(async () => {
        if (!incInf.data && !incInf.isFetching) await incInf.fetchNextPage()
        while (true) {
          if (incomePrefetchTokenRef.current !== iTok) break
          const lastCursor = (incInf.data?.pages.slice(-1)[0]?.nextCursor)
          if (!lastCursor) break
          if (incInf.isFetching) { await new Promise(r => setTimeout(r, 100)); continue }
          await incInf.fetchNextPage()
        }
      })()

      const pj = (printInf.data?.pages.flatMap(p => p.items) ?? []) as any
      const lj = (lamInf.data?.pages.flatMap(p => p.items) ?? []) as any
      const inc = (incInf.data?.pages.flatMap(p => p.items) ?? []) as any
      setPrintJobs(pj)
      setLaminationJobs(lj)
      setIncome(inc)
      setHasMorePrint(Boolean(printInf.data?.pages.slice(-1)[0]?.nextCursor))
      setHasMoreLam(Boolean(lamInf.data?.pages.slice(-1)[0]?.nextCursor))
      setHasMoreIncome(Boolean(incInf.data?.pages.slice(-1)[0]?.nextCursor))
      if (cachedUsers) setAllUsers(cachedUsers as any)

      // Initialize debt slider range once
      if (!initializedDebtRangeRef.current && (cachedUsers && cachedUsers.length)) {
        const visibleUsers = (user.accessLevel === "Διαχειριστής")
          ? cachedUsers
          : (user.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0)
            ? cachedUsers.filter(u => {
                if (u.userRole === "Άτομο") {
                  return u.memberOf?.some((g: string) => user.responsibleFor?.includes(g))
                }
                return user.responsibleFor?.includes(u.displayName)
              })
            : cachedUsers.filter(u => u.uid === user.uid)
        const amounts = visibleUsers
          .filter(u => u.accessLevel !== "Διαχειριστής")
          .map(u => typeof u.totalDebt === "number" ? u.totalDebt : (u.printDebt || 0) + (u.laminationDebt || 0))
        if (amounts.length > 0) {
          const minDebt = Math.floor(Math.min(...amounts))
          const maxDebt = Math.ceil(Math.max(...amounts))
          setPriceRange([minDebt, maxDebt])
          setPriceRangeInputs([minDebt.toString(), maxDebt.toString()])
          initializedDebtRangeRef.current = true
        }
      }
    }
  }, [user, useFirestore, printInf.data, lamInf.data, incInf.data, cachedUsers, printInf.isFetching, lamInf.isFetching, incInf.isFetching])

  // Handlers to change page using server pagination (forward only)
  const handlePrintPageChange = async (newPage: number) => {
    if (!user) return
    if (newPage < 1) return
    if (newPage > printJobsPage) {
      await printInf.fetchNextPage()
      const pj = (printInf.data?.pages.flatMap(p => p.items) ?? []) as any
      setPrintJobs(pj)
    }
    setPrintJobsPage(newPage)
  }

  const handleLamPageChange = async (newPage: number) => {
    if (!user) return
    if (newPage < 1) return
    if (newPage > laminationJobsPage) {
      await lamInf.fetchNextPage()
      const lj = (lamInf.data?.pages.flatMap(p => p.items) ?? []) as any
      setLaminationJobs(lj)
    }
    setLaminationJobsPage(newPage)
  }

  const handleIncomePageChange = async (newPage: number) => {
    if (!user) return
    if (newPage < 1) return
    if (newPage > incomePage) {
      await incInf.fetchNextPage()
      const inc = (incInf.data?.pages.flatMap(p => p.items) ?? []) as any
      setIncome(inc)
    }
    setIncomePage(newPage)
  }

  // Apply unified filters
  // Re-apply filters as data streams in (debounced for keystrokes)
  useEffect(() => {
    const t = setTimeout(() => applyFilters(), 120)
    return () => clearTimeout(t)
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
    income,
    // New tab-specific filters
    activeTab,
    printTypeFilter,
    machineFilter,
    laminationTypeFilter,
    // Income filters
    incomeSearchTerm,
    incomeRoleFilter,
    incomeDateFrom,
    incomeDateTo,
    incomeAmountRange,
    incomeResponsibleForFilter,
  ])

  // Bank amounts
  const bankAmounts = undefined
  const [firestoreBank, setFirestoreBank] = useState<{ printBank: number; laminationBank: number } | null>(null)
  useEffect(() => {
    if (!useFirestore) return
    fetchBankTotals().then(setFirestoreBank)
  }, [])

  // ... rest of file remains unchanged

  const applyFilters = () => {
    // Filter Print Jobs with tab-specific filters
    let filteredPJ = [...printJobs]
    if (searchTerm) {
      const normSearch = normalizeGreek(searchTerm)
      filteredPJ = filteredPJ.filter(
        (item) =>
          normalizeGreek(item.deviceName || "").includes(normSearch) ||
          normalizeGreek(item.deviceIP || "").includes(normSearch) ||
          normalizeGreek(item.userDisplayName || "").includes(normSearch),
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
            return item.type === "A4BW"
          case "a4Color":
            return item.type === "A4Color"
          case "a3BW":
            return item.type === "A3BW"
          case "a3Color":
            return item.type === "A3Color"
          case "rizochartoA3":
            return item.type === "RizochartoA3"
          case "rizochartoA4":
            return item.type === "RizochartoA4"
          case "chartoniA3":
            return item.type === "ChartoniA3"
          case "chartoniA4":
            return item.type === "ChartoniA4"
          case "autokollito":
            return item.type === "Autokollito"
          default:
            return true
        }
      })
    }
    setFilteredPrintJobs(filteredPJ)

    // Filter Lamination Jobs with tab-specific filters
    let filteredLJ = [...laminationJobs]
    if (searchTerm) {
      const normSearch = normalizeGreek(searchTerm)
      filteredLJ = filteredLJ.filter(
        (item) =>
          normalizeGreek(item.type || "").includes(normSearch) ||
          normalizeGreek(item.notes || "").includes(normSearch) ||
          normalizeGreek(item.userDisplayName || "").includes(normSearch),
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

    // Filter Income with new income filters
    let filteredInc = [...income]
    
    // Apply income search filter
    if (incomeSearchTerm) {
      const normIncomeSearch = normalizeGreek(incomeSearchTerm)
      filteredInc = filteredInc.filter(
        (item) =>
          normalizeGreek(item.userDisplayName || "").includes(normIncomeSearch) ||
          normalizeGreek(item.username || "").includes(normIncomeSearch)
      )
    }
    
    // Apply income role filter
    if (incomeRoleFilter !== "all") {
      filteredInc = filteredInc.filter((item) => {
        const userData = allUsers.find(u => u.uid === item.uid);
        return userData && userData.userRole === incomeRoleFilter;
      })
    }
    
    // Apply income date filters
    if (incomeDateFrom) {
      filteredInc = filteredInc.filter((item) => {
        const itemDate = new Date(item.timestamp);
        const fromDate = new Date(incomeDateFrom);
        return itemDate >= fromDate;
      })
    }
    
    if (incomeDateTo) {
      filteredInc = filteredInc.filter((item) => {
        const itemDate = new Date(item.timestamp);
        const toDate = new Date(incomeDateTo);
        return itemDate <= toDate;
      })
    }
    
    // Apply income amount range filter
    filteredInc = filteredInc.filter((item) => {
      const amount = item.amount || 0;
      return amount >= incomeAmountRange[0] && amount <= incomeAmountRange[1];
    })
    
    // Apply income responsibleFor filter for Υπεύθυνος users
    if (user?.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0 && incomeResponsibleForFilter !== "all") {
      filteredInc = filteredInc.filter((item) => {
        const userData = allUsers.find(u => u.uid === item.uid);
        if (!userData) return false;
        
        // For individual users, check if they belong to any of the responsibleFor groups
        if (userData.userRole === "Άτομο") {
          return userData.memberOf?.some((group: string) => user.responsibleFor?.includes(group));
        } else {
          // For groups, check if the group is in the responsibleFor list
          return user.responsibleFor?.includes(userData.displayName);
        }
      })
    }
    
    setFilteredIncome(filteredInc)
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
    // Clear debt filters
    setDebtSearchTerm("")
    setDebtFilter("all")
    setAmountFilter("all")
    
    // Reset price range to actual debt range from data
    if (allUsers.length > 0) {
      const userDebtAmounts = allUsers
        .filter(userData => userData.accessLevel !== "Διαχειριστής")
        .map(user => user.totalDebt || 0);
      
      if (userDebtAmounts.length > 0) {
        const actualMinDebt = Math.floor(Math.min(...userDebtAmounts));
        const actualMaxDebt = Math.ceil(Math.max(...userDebtAmounts));
        
        setPriceRange([actualMinDebt, actualMaxDebt]);
        setPriceRangeInputs([
          actualMinDebt.toString(),
          actualMaxDebt.toString()
        ]);
      } else {
        // Fallback to default values if no debt data
        setPriceRange([0, 100]);
        setPriceRangeInputs(["0", "100"]);
      }
    } else {
      // Fallback to default values if no users loaded
      setPriceRange([0, 100]);
      setPriceRangeInputs(["0", "100"]);
    }
    
    setRoleFilter("all")
    setTeamFilter("all")
    setResponsibleForFilter("all")
  }

  const clearIncomeFilters = () => {
    setIncomeSearchTerm("")
    setIncomeRoleFilter("all")
    setIncomeDateFrom("")
    setIncomeDateTo("")
    
    // Reset income amount range to actual range from data
    if (income.length > 0) {
      const incomeAmounts = income.map(inc => inc.amount || 0);
      
      if (incomeAmounts.length > 0) {
        const actualMinIncome = Math.floor(Math.min(...incomeAmounts));
        const actualMaxIncome = Math.ceil(Math.max(...incomeAmounts));
        
        setIncomeAmountRange([actualMinIncome, actualMaxIncome]);
        setIncomeAmountInputs([
          actualMinIncome.toString(),
          actualMaxIncome.toString()
        ]);
      } else {
        // Fallback to default values if no income data
        setIncomeAmountRange([0, 100]);
        setIncomeAmountInputs(["0", "100"]);
      }
    } else {
      // Fallback to default values if no income loaded
      setIncomeAmountRange([0, 100]);
      setIncomeAmountInputs(["0", "100"]);
    }
    
    setIncomeResponsibleForFilter("all")
  }

  // Bank reset functions
  const handlePrintBankReset = () => {
    setShowPrintBankResetDialog(false)
    // Trigger refresh to update the UI without page reload
    triggerRefresh()
  }

  const handleLaminationBankReset = () => {
    setShowLaminationBankResetDialog(false)
    // Trigger refresh to update the UI without page reload
    triggerRefresh()
  }

  const handleTotalBankReset = () => {
    setShowTotalBankResetDialog(false)
    // Trigger refresh to update the UI without page reload
    triggerRefresh()
  }

  type RGB = string // e.g. "4472C4"

  // Helper for friendly Greek column names and dynamic column widths
  const exportTableXLSX = async (
    data: any[],
    filename: string,
    columns: { key: string, label: string }[],
    headerColor: string,
    title?: string
  ) => {
    if (!XLSX) {
      const mod = await import("xlsx-js-style")
      XLSX = mod
    }
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

  // Memoized unique devices list used in filters (must be before any early return)
  const allDevices = useMemo(() => {
    return [...new Set(printJobs.map((job) => job.deviceName).filter(Boolean))]
  }, [printJobs])
  const uniqueDevices = useMemo(() => {
    return ["Canon Color", "Canon B/W", "Brother", "Κυδωνιών"].filter(device => allDevices.includes(device))
  }, [allDevices])

  if (!user) {
    return (
      <ProtectedRoute>
        {null}
      </ProtectedRoute>
    )
  }

  // Calculate totals based on user debt fields
  const allUsersData = allUsers
  
  // For the top 3 cards, show personal debts for Υπεύθυνος and Χρήστης users
  const personalDebtUsers = user.accessLevel === "Διαχειριστής" 
    ? allUsersData 
    : allUsersData.filter(u => u.uid === user.uid) // Both Υπεύθυνος and Χρήστης see only their personal data
  
  // For the debt table, show different data based on access level
  const relevantUsers = user.accessLevel === "Διαχειριστής" 
    ? allUsersData 
    : user.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0
      ? allUsersData.filter(u => {
          // For individual users, check if they belong to any of the responsibleFor groups
          if (u.userRole === "Άτομο") {
            return u.memberOf?.some(group => user.responsibleFor?.includes(group)) || false
          }
          // For groups, check if the group is in the responsibleFor list
          return user.responsibleFor?.includes(u.displayName) || false
        })
      : allUsersData.filter(u => u.uid === user.uid) // Regular users (Χρήστης) see only their personal data
  
  const printUnpaid = personalDebtUsers.reduce((sum, u) => sum + (u.printDebt || 0), 0)
  const laminationUnpaid = personalDebtUsers.reduce((sum, u) => sum + (u.laminationDebt || 0), 0)
  // Use users' totalDebt directly so negative credit is reflected in the summary
  const totalUnpaid = personalDebtUsers.reduce(
    (sum, u) => sum + (typeof u.totalDebt === "number" ? u.totalDebt : (u.printDebt || 0) + (u.laminationDebt || 0)),
    0
  )

  // Calculate totals without filters for percentage calculations
  const totalPrintUnpaid = allUsersData.reduce((sum, u) => sum + (u.printDebt || 0), 0)
  const totalLaminationUnpaid = allUsersData.reduce((sum, u) => sum + (u.laminationDebt || 0), 0)

  // Check if any filters are applied
  const hasFilters = searchTerm || 
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
  
  // Bank values for cards
  const printBank: number = useFirestore ? (firestoreBank?.printBank ?? 0) : 0
  const laminationBank: number = useFirestore ? (firestoreBank?.laminationBank ?? 0) : 0
  const totalBank = printBank + laminationBank

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
      kydonion: {
        a4BW: 0,
        total: 0
      },
      total: 0
    }

    filteredPrintJobs.forEach(job => {
      if (job.deviceName === "Canon B/W") {
        if (job.type === "A4BW") {
          stats.canonBW.a4BW += job.quantity
          stats.total += job.quantity
        }
      } else if (job.deviceName === "Canon Color") {
        if (job.type === "A4BW") {
          stats.canonColour.a4BW += job.quantity
        } else if (job.type === "A4Color") {
          stats.canonColour.a4Colour += job.quantity
        } else if (job.type === "A3BW") {
          stats.canonColour.a3BW += job.quantity
        } else if (job.type === "A3Color") {
          stats.canonColour.a3Colour += job.quantity
        }
      } else if (job.deviceName === "Brother") {
        if (job.type === "A4BW") {
          stats.brother.a4BW += job.quantity
          stats.total += job.quantity
        }
      } else if (job.deviceName === "Κυδωνιών") {
        if (job.type === "A4BW") {
          stats.kydonion.a4BW += job.quantity
          stats.total += job.quantity
        }
      }
    })

    // Calculate totals after all jobs are processed
    stats.canonColour.a4Total = stats.canonColour.a4BW + stats.canonColour.a4Colour
    stats.canonColour.a3Total = stats.canonColour.a3BW + stats.canonColour.a3Colour
    stats.canonColour.total = stats.canonColour.a4Total + stats.canonColour.a3Total
    stats.kydonion.total = stats.kydonion.a4BW
    
    // Calculate overall total
    stats.total = stats.canonBW.a4BW + stats.canonColour.total + stats.brother.a4BW + stats.kydonion.total

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


  // Get unique devices for filter with specific order

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

    // For Υπεύθυνος users, first add all teams they are responsible for
    if (user?.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0) {
      user.responsibleFor.forEach(teamName => {
        // Find the team entity itself (not its members)
        const teamEntity = allUsersData.find(u => u.displayName === teamName && u.userRole === "Ομάδα")
        
        if (teamEntity) {
          // Apply role filter to team entries
          if (roleFilter !== "all" && teamEntity.userRole !== roleFilter) {
            return // Skip this team if it doesn't match the role filter
          }
          
          // Apply team filter for admin users to team entries
          if (user?.accessLevel === "Διαχειριστής" && teamFilter !== "all") {
            // For teams, check if the team name matches the selected team filter
            if (teamEntity.displayName !== teamFilter) {
              return // Skip this team if it doesn't match the team filter
            }
          }
          
          // Apply responsibleFor filter to team entries
          if (responsibleForFilter !== "all") {
            // For teams, check if the team name matches the selected responsibleFor filter
            if (teamEntity.displayName !== responsibleForFilter) {
              return // Skip this team if it doesn't match the responsibleFor filter
            }
          }
          
          // Use the team's own debt values, not the sum of member debts
          const teamPrintDebt = teamEntity.printDebt || 0
          const teamLaminationDebt = teamEntity.laminationDebt || 0
          const teamTotalDebt = teamEntity.totalDebt || 0
          
          // Apply debt status filter to team entries
          if (debtFilter !== "all") {
            const hasUnpaidDebt = (teamPrintDebt > 0) || (teamLaminationDebt > 0)
            if (debtFilter === "paid" && hasUnpaidDebt) {
              return // Skip this team if it doesn't match the debt status filter
            }
            if (debtFilter === "unpaid" && !hasUnpaidDebt) {
              return // Skip this team if it doesn't match the debt status filter
            }
          }
          
          // Apply amount filter to team entries
          if (amountFilter !== "all") {
            switch (amountFilter) {
              case "under10":
                if (teamTotalDebt >= 10) return // Skip this team
                break
              case "10to50":
                if (teamTotalDebt < 10 || teamTotalDebt > 50) return // Skip this team
                break
              case "over50":
                if (teamTotalDebt <= 50) return // Skip this team
                break
            }
          }
          
          // Apply price range filter to team entries
          if (priceRange[0] !== 0 || priceRange[1] !== 100) {
            if (teamTotalDebt < priceRange[0] || teamTotalDebt > priceRange[1]) {
              return // Skip this team if it doesn't match the price range filter
            }
          }
          
                // Find the latest income date for this team
      const teamIncome = income.filter(inc => inc.uid === teamEntity.uid)
      const latestTeamIncome = teamIncome.length > 0 
        ? teamIncome.reduce((latest, current) => 
            current.timestamp > latest.timestamp ? current : latest
          ).timestamp
        : null

      // Add team to the map
      userDebtMap.set(`team-${teamName}`, {
        uid: `team-${teamName}`,
        userDisplayName: teamName,
        userRole: "Ομάδα",
        responsiblePerson: user.displayName,
        printDebt: teamPrintDebt,
        laminationDebt: teamLaminationDebt,
        totalDebt: teamTotalDebt,
        lastPayment: latestTeamIncome
      })
        }
      })
    }

    // Get all users and their debt information
    relevantUsers.forEach(userData => {
      // Skip admin users from the debt table
      if (userData.accessLevel === "Διαχειριστής") return
      
      // Skip if this is a team entry that was already added for Υπεύθυνος users
      if (user?.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.includes(userData.displayName) && userData.userRole === "Ομάδα") {
        return
      }
      
      // Apply search filter
      if (debtSearchTerm) {
        const responsiblePerson = userData.userRole === "Άτομο" 
          ? userData.displayName 
          : "-";
        const norm = normalizeGreek(debtSearchTerm)
        const matchesSearch = normalizeGreek(userData.displayName).includes(norm) ||
                             normalizeGreek(userData.userRole).includes(norm) ||
                             normalizeGreek(responsiblePerson).includes(norm);
        if (!matchesSearch) return
      }
      
      // Apply role filter
      if (roleFilter !== "all" && userData.userRole !== roleFilter) {
        return
      }
      
      // Apply team filter for admin users
      if (user?.accessLevel === "Διαχειριστής" && teamFilter !== "all") {
        // For individual users, check if they belong to the selected team
        if (userData.userRole === "Άτομο") {
          if (!userData.memberOf?.includes(teamFilter)) {
            return
          }
        } else {
          // For groups, check if the group name matches the selected team
          if (userData.displayName !== teamFilter) {
            return
          }
        }
      }
      
      // Apply responsibleFor filter
      if (responsibleForFilter !== "all") {
        // For individual users, check if they belong to the selected responsibleFor group
        if (userData.userRole === "Άτομο") {
          if (!userData.memberOf?.includes(responsibleForFilter)) {
            return
          }
        } else {
          // For groups, check if the group matches the selected responsibleFor filter
          if (userData.displayName !== responsibleForFilter) {
            return
          }
        }
      }
      
      // Function to get dynamic responsible persons for Ομάδα/Ναός/Τομέας
      const getDynamicResponsiblePersons = (userData: any) => {
        const responsibleUsers: string[] = []
        
        if (userData.userRole === "Ομάδα" || userData.userRole === "Ναός" || userData.userRole === "Τομέας") {
          const ypefthynoiUsers = allUsersData.filter((user: any) => user.accessLevel === "Υπεύθυνος")
          
          ypefthynoiUsers.forEach((ypefthynos: any) => {
            if (ypefthynos.responsibleFor && ypefthynos.responsibleFor.length > 0) {
              const isResponsible = ypefthynos.responsibleFor.some((responsibleFor: string) => {
                return responsibleFor === userData.displayName
              })
              
              if (isResponsible) {
                responsibleUsers.push(ypefthynos.displayName)
              }
            }
          })
        }
        
        return responsibleUsers
      }

      // Function to get responsible users for Άτομο users based on their team membership
      const getResponsibleUsers = (userData: any) => {
        const responsibleUsers: string[] = []
        
        if (userData.userRole === "Άτομο" && userData.memberOf && userData.memberOf.length > 0) {
          const userTeam = userData.memberOf.find((member: string) => {
            const teamAccount = allUsersData.find((user: any) => 
              user.userRole === "Ομάδα" && user.displayName === member
            )
            return teamAccount
          })
          
          if (userTeam) {
            const teamAccount = allUsersData.find((user: any) => 
              user.userRole === "Ομάδα" && user.displayName === userTeam
            )
            
            if (teamAccount) {
              const teamResponsiblePersons = getDynamicResponsiblePersons(teamAccount)
              responsibleUsers.push(...teamResponsiblePersons)
            }
          }
        }
        
        return responsibleUsers
      }

      // Get responsible person based on user role
      let responsiblePerson = "Δεν έχει ανατεθεί Υπεύθυνος"
      
      if ((userData.accessLevel as string) === "Υπεύθυνος") {
        responsiblePerson = "-"
      } else if ((userData.accessLevel as string) === "Διαχειριστής") {
        responsiblePerson = "Διαχειριστής"
      } else if (userData.userRole === "Άτομο") {
        const responsibleUsers = getResponsibleUsers(userData)
        responsiblePerson = responsibleUsers.length > 0 ? responsibleUsers.join(", ") : "Δεν έχει ανατεθεί Υπεύθυνος"
      } else if (userData.userRole === "Ομάδα" || userData.userRole === "Ναός" || userData.userRole === "Τομέας") {
        const responsibleUsers = getDynamicResponsiblePersons(userData)
        responsiblePerson = responsibleUsers.length > 0 ? responsibleUsers.join(", ") : "Δεν έχει ανατεθεί Υπεύθυνος"
      } else {
        // For any other cases, show the default message
        responsiblePerson = "Δεν έχει ανατεθεί Υπεύθυνος"
      }
      
      const printDebt = userData.printDebt || 0
      const laminationDebt = userData.laminationDebt || 0
      const totalDebt = userData.totalDebt || 0
      
      // Apply debt status filter
      if (debtFilter !== "all") {
        const hasUnpaidDebt = (printDebt > 0) || (laminationDebt > 0)
        if (debtFilter === "paid" && hasUnpaidDebt) {
          return // Skip this user if it doesn't match the debt status filter
        }
        if (debtFilter === "unpaid" && !hasUnpaidDebt) {
          return // Skip this user if it doesn't match the debt status filter
        }
      }
      
      // Apply amount filter
      if (amountFilter !== "all") {
        switch (amountFilter) {
          case "under10":
            if (totalDebt >= 10) return // Skip this user
            break
          case "10to50":
            if (totalDebt < 10 || totalDebt > 50) return // Skip this user
            break
          case "over50":
            if (totalDebt <= 50) return // Skip this user
            break
        }
      }
      
      // Apply price range filter
      if (priceRange[0] !== 0 || priceRange[1] !== 100) {
        if (totalDebt < priceRange[0] || totalDebt > priceRange[1]) {
          return // Skip this user if it doesn't match the price range filter
        }
      }
      
      // Find the latest income date for this user
      const userIncome = income.filter(inc => inc.uid === userData.uid)
      const latestUserIncome = userIncome.length > 0 
        ? userIncome.reduce((latest, current) => 
            current.timestamp > latest.timestamp ? current : latest
          ).timestamp
        : null

      // Add user to the map
      userDebtMap.set(userData.uid, {
        uid: userData.uid,
        userDisplayName: userData.displayName,
        userRole: userData.userRole,
        responsiblePerson: responsiblePerson,
        printDebt: printDebt,
        laminationDebt: laminationDebt,
        totalDebt: totalDebt,
        lastPayment: latestUserIncome
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
                  {user.accessLevel === "Διαχειριστής" && " - Προβολή όλων των δεδομένων"}
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Debts Card - Yellow Theme */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full overflow-hidden">
                                  <div className="bg-yellow-100 px-6 py-4 border-b border-yellow-200">
                    <div className="flex items-center justify-between">
                      <Receipt className="h-6 w-6 text-yellow-700" />
                      <div className="text-center flex-1">
                        <div className="text-lg font-semibold text-yellow-900">ΣΥΝΟΛΟ</div>
                        <div className="text-sm font-medium text-yellow-800">
                          {user.accessLevel === "Διαχειριστής" ? "Χρέος|Έσοδα" : "Χρέος"}
                        </div>
                      </div>
                      {user.accessLevel === "Διαχειριστής" && (
                        <AlertDialog open={showTotalBankResetDialog} onOpenChange={setShowTotalBankResetDialog}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 border-yellow-300 bg-white hover:bg-yellow-50 text-yellow-600"
                              title="Επαναφορά Συνολικού Τραπεζικού Λογαριασμού"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Επαναφορά Συνολικού Τραπεζικού Λογαριασμού</AlertDialogTitle>
                              <AlertDialogDescription>
                                Είστε σίγουροι ότι θέλετε να επαναφέρετε τον συνολικό τραπεζικό λογαριασμό στο 0;
                                <br /><br />
                                <strong>Τρέχουσα τιμή: {formatPrice(totalBank)}</strong>
                                <br /><br />
                                <span className="text-red-600 font-medium">Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.</span>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Ακύρωση</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleTotalBankReset} 
                                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                              >
                                Επαναφορά
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                <div className="p-6">
                  <div className="flex justify-between items-center">
                    <div className={`text-3xl font-bold ${totalUnpaid <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalUnpaid > 0 ? formatPrice(totalUnpaid) : totalUnpaid < 0 ? `-${formatPrice(Math.abs(totalUnpaid))}` : formatPrice(totalUnpaid)}
                    </div>
                   {user.accessLevel === "Διαχειριστής" && (
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(totalBank)}
                      </div>
                    )}
                  </div>
                  {hasFilters && totalUnpaidPercentage < 100 && user.accessLevel === "Διαχειριστής" && (
                    <div className="text-sm text-gray-500 mt-3">({totalUnpaidPercentage.toFixed(1)}% του {formatPrice(totalCombinedUnpaid)})</div>
                  )}
                </div>
              </div>

              {/* Print Debts Card - Blue Theme */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full overflow-hidden">
                                  <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
                    <div className="flex items-center justify-between">
                      <Printer className="h-6 w-6 text-blue-700" />
                      <div className="text-center flex-1">
                        <div className="text-lg font-semibold text-blue-900">ΤΟ. ΦΩ.</div>
                        <div className="text-sm font-medium text-blue-800">
                          {user.accessLevel === "Διαχειριστής" ? "Χρέος|Έσοδα" : "Χρέος"}
                        </div>
                      </div>
                    {user.accessLevel === "Διαχειριστής" && (
                      <AlertDialog open={showPrintBankResetDialog} onOpenChange={setShowPrintBankResetDialog}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 border-blue-300 bg-white hover:bg-blue-50 text-blue-600"
                            title="Επαναφορά Τραπεζικού Λογαριασμού Εκτυπώσεων"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Επαναφορά Τραπεζικού Λογαριασμού Εκτυπώσεων</AlertDialogTitle>
                            <AlertDialogDescription>
                              Είστε σίγουροι ότι θέλετε να επαναφέρετε τον τραπεζικό λογαριασμό εκτυπώσεων στο 0;
                              <br /><br />
                              <strong>Τρέχουσα τιμή: {formatPrice(printBank)}</strong>
                              <br /><br />
                              <span className="text-red-600 font-medium">Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.</span>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Ακύρωση</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handlePrintBankReset} 
                              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                            >
                              Επαναφορά
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center">
                    <div className={`text-3xl font-bold ${printUnpaid > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                      {printUnpaid > 0 ? formatPrice(printUnpaid) : printUnpaid < 0 ? `-${formatPrice(Math.abs(printUnpaid))}` : formatPrice(printUnpaid)}
                    </div>
                    {user.accessLevel === "Διαχειριστής" && (
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(printBank)}
                      </div>
                    )}
                  </div>
                  {hasFilters && printUnpaidPercentage < 100 && user.accessLevel === "Διαχειριστής" && (
                    <div className="text-sm text-gray-500 mt-3">({printUnpaidPercentage.toFixed(1)}% του {formatPrice(totalPrintUnpaid)})</div>
                  )}
                </div>
              </div>

              {/* Lamination Debts Card - Green Theme */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full overflow-hidden">
                                  <div className="bg-green-100 px-6 py-4 border-b border-green-200">
                    <div className="flex items-center justify-between">
                      <CreditCard className="h-6 w-6 text-green-700" />
                      <div className="text-center flex-1">
                        <div className="text-lg font-semibold text-green-900">ΠΛΑ. ΤΟ.</div>
                        <div className="text-sm font-medium text-green-800">
                          {user.accessLevel === "Διαχειριστής" ? "Χρέος|Έσοδα" : "Χρέος"}
                        </div>
                      </div>
                    {user.accessLevel === "Διαχειριστής" && (
                      <AlertDialog open={showLaminationBankResetDialog} onOpenChange={setShowLaminationBankResetDialog}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 border-green-300 bg-white hover:bg-green-50 text-green-600"
                            title="Επαναφορά Τραπεζικού Λογαριασμού Πλαστικοποιήσεων"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Επαναφορά Τραπεζικού Λογαριασμού Πλαστικοποιήσεων</AlertDialogTitle>
                            <AlertDialogDescription>
                              Είστε σίγουροι ότι θέλετε να επαναφέρετε τον τραπεζικό λογαριασμό πλαστικοποιήσεων στο 0;
                              <br /><br />
                              <strong>Τρέχουσα τιμή: {formatPrice(laminationBank)}</strong>
                              <br /><br />
                              <span className="text-red-600 font-medium">Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.</span>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Ακύρωση</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleLaminationBankReset} 
                              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                            >
                              Επαναφορά
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center">
                    <div className={`text-3xl font-bold ${laminationUnpaid > 0 ? 'text-green-600' : 'text-green-600'}`}>
                      {laminationUnpaid > 0 ? formatPrice(laminationUnpaid) : laminationUnpaid < 0 ? `-${formatPrice(Math.abs(laminationUnpaid))}` : formatPrice(laminationUnpaid)}
                    </div>
                    {user.accessLevel === "Διαχειριστής" && (
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(laminationBank)}
                      </div>
                    )}
                  </div>
                  {hasFilters && laminationUnpaidPercentage < 100 && user.accessLevel === "Διαχειριστής" && (
                    <div className="text-sm text-gray-500 mt-3">({laminationUnpaidPercentage.toFixed(1)}% του {formatPrice(totalLaminationUnpaid)})</div>
                  )}
                </div>
              </div>
            </div>

            {/* Debt Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              {/* Left Column: Debt Filters */}
              <div className="lg:col-span-1">
                <div className="h-full">
                  <DebtFilters
                    debtSearchTerm={debtSearchTerm}
                    setDebtSearchTerm={setDebtSearchTerm}
                    debtFilter={debtFilter}
                    setDebtFilter={setDebtFilter}
                    amountFilter={amountFilter}
                    setAmountFilter={setAmountFilter}
                    priceRange={priceRange}
                    setPriceRange={setPriceRange}
                    priceRangeInputs={priceRangeInputs}
                    setPriceRangeInputs={setPriceRangeInputs}
                    roleFilter={roleFilter}
                    setRoleFilter={setRoleFilter}
                    teamFilter={teamFilter}
                    setTeamFilter={setTeamFilter}
                    responsibleForFilter={responsibleForFilter}
                    setResponsibleForFilter={setResponsibleForFilter}
                    priceDistribution={{ min: 0, max: 100 }}
                    users={allUsers}
                    clearFilters={clearFilters}
                    combinedDebtData={combinedDebtData}
                  />
                </div>
              </div>

              {/* Right Column: Debt Table */}
              <div className="lg:col-span-3">
                {/* Consolidated Table Card */}
                <div className="bg-white rounded-lg border border-yellow-200 shadow-sm overflow-hidden h-full flex flex-col">
                  <div className="bg-yellow-100 px-6 py-4 border-b border-yellow-200 flex-shrink-0">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-6 w-6 text-yellow-700" />
                        <div>
                          <h3 className="text-lg font-semibold text-yellow-900">Συγκεντρωτικός Πίνακας Χρέους</h3>
                          <p className="text-sm text-yellow-700">Συγκεντρωμένα δεδομένα χρεώσεων, πληρωμών και πιστώσεων</p>
                        </div>
                      </div>
                      {(user.accessLevel === "Διαχειριστής" || user.accessLevel === "Υπεύθυνος") && (
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
                                { key: "lastPayment", label: "Τελευταία Πληρωμή" }
                              ],
                              "EAB308",
                              "Συγκεντρωτικός Πίνακας Χρέους"
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
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex-1">
                      <DebtTable
                        data={combinedDebtData}
                        page={debtPage}
                        pageSize={PAGE_SIZE}
                        onPageChange={setDebtPage}
                        userRole={user.accessLevel}
                        onRowHover={setHoveredPrintJob}
                      />
                    </div>
                  </div>
                </div>


              </div>
            </div>

            {/* Income Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              {/* Left Column: Income Filters */}
              <div className="lg:col-span-1">
                <div className="h-full">
                  <IncomeFilters
                    incomeSearchTerm={incomeSearchTerm}
                    setIncomeSearchTerm={setIncomeSearchTerm}
                    incomeRoleFilter={incomeRoleFilter}
                    setIncomeRoleFilter={setIncomeRoleFilter}
                    incomeDateFrom={incomeDateFrom}
                    setIncomeDateFrom={setIncomeDateFrom}
                    incomeDateTo={incomeDateTo}
                    setIncomeDateTo={setIncomeDateTo}
                    incomeAmountRange={incomeAmountRange}
                    setIncomeAmountRange={setIncomeAmountRange}
                    incomeAmountInputs={incomeAmountInputs}
                    setIncomeAmountInputs={setIncomeAmountInputs}
                    incomeResponsibleForFilter={incomeResponsibleForFilter}
                    setIncomeResponsibleForFilter={setIncomeResponsibleForFilter}
                    incomeData={income}
                    users={allUsers}
                    clearIncomeFilters={clearIncomeFilters}
                  />
                </div>
              </div>

              {/* Right Column: Income Table */}
              <div className="lg:col-span-3">
                {/* Income Table Card */}
                <div className="bg-white rounded-lg border border-yellow-200 shadow-sm overflow-hidden h-full flex flex-col">
                  <div className="bg-yellow-100 px-6 py-4 border-b border-yellow-200 flex-shrink-0">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Receipt className="h-6 w-6 text-yellow-700" />
                        <div>
                          <h3 className="text-lg font-semibold text-yellow-900">Έσοδα</h3>
                          <p className="text-sm text-yellow-700">Ιστορικό εσόδων από πληρωμές</p>
                        </div>
                      </div>
                      {(user.accessLevel === "Διαχειριστής" || user.accessLevel === "Υπεύθυνος") && (
                        <Button
                          onClick={() =>
                            exportTableXLSX(
                              filteredIncome.map((incomeRecord) => ({
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
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex-1">
                      <ErrorBoundary fallback={<div>Φόρτωση εσόδων...</div>}>
                        <IncomeTable
                          data={filteredIncome}
                          page={incomePage}
                          pageSize={PAGE_SIZE}
                          onPageChange={handleIncomePageChange}
                          userRole={user.accessLevel}
                        />
                      </ErrorBoundary>
                    </div>
                  </div>
                </div>
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



              <TabsContent value="printing" className="mt-4">
                {/* Two Column Layout: Filters on Left, Table on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Left Column: Print Filters */}
                  <div className="lg:col-span-1 h-full">
                    <div className="h-full">
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
                    </div>
                  </div>

                  {/* Right Column: Print Table */}
                  <div className="lg:col-span-3">
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
                            {(user.accessLevel === "Διαχειριστής" || user.accessLevel === "Υπεύθυνος") && (
                              <Button
                                onClick={() => {
                                  // Helper function to get print type label
                                  const getPrintTypeLabel = (type: string) => {
                                    switch (type) {
                                      case "A4BW": return "A4 Ασπρόμαυρο"
                                      case "A4Color": return "A4 Έγχρωμο"
                                      case "A3BW": return "A3 Ασπρόμαυρο"
                                      case "A3Color": return "A3 Έγχρωμο"
                                      case "RizochartoA3": return "Ριζόχαρτο A3"
                                      case "RizochartoA4": return "Ριζόχαρτο A4"
                                      case "ChartoniA3": return "Χαρτόνι A3"
                                      case "ChartoniA4": return "Χαρτόνι A4"
                                      case "Autokollito": return "Αυτοκόλλητο"
                                      default: return type
                                    }
                                  }
                                  
                                  const expandedData = filteredPrintJobs.map(job => ({
                                    timestamp: job.timestamp.toLocaleString("el-GR"),
                                    uid: job.uid,
                                    userDisplayName: job.userDisplayName,
                                    deviceName: job.deviceName,
                                    printType: getPrintTypeLabel(job.type),
                                    quantity: job.quantity,
                                    cost: formatPrice(job.totalCost)
                                  }))
                                  
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
                              onPageChange={handlePrintPageChange}
                              userRole={user.accessLevel}
                              onRowHover={setHoveredPrintJob}
                              printTypeFilter={printTypeFilter}
                              hasMore={hasMorePrint}
                            />
                          </ErrorBoundary>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print Statistics Cards */}
                <div className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Canon Color Statistics */}
                    <div className="md:col-span-4 bg-white rounded-lg border border-blue-200 shadow-sm">
                      <div className="bg-blue-100 px-4 py-3 border-b border-blue-200">
                        <div className="flex items-center gap-2">
                          <Printer className="h-5 w-5 text-blue-700" />
                          <h3 className="text-sm font-semibold text-blue-900">Canon Color</h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-4 grid-rows-2 gap-2 text-center">
                          {/* Row 1 */}
                          <div>
                            <div className="text-xs text-gray-600">A4 B/W</div>
                            <div className={`text-lg font-bold ${
                              isPrintStatHighlighted("Canon Color", "A4 Ασπρόμαυρο")
                                ? "text-blue-600 bg-blue-100 rounded px-1"
                                : "text-black"
                            }`}>
                              {printStats.canonColour.a4BW}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">A4 Colour</div>
                            <div className={`text-lg font-bold ${
                              isPrintStatHighlighted("Canon Color", "A4 Έγχρωμο")
                                ? "text-blue-600 bg-blue-100 rounded px-1"
                                : "text-black"
                            }`}>
                              {printStats.canonColour.a4Colour}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">A4 Total</div>
                            <div className="text-lg font-bold text-black">{printStats.canonColour.a4Total}</div>
                          </div>
                          <div className="row-span-2 flex flex-col items-center justify-center">
                            <div className="text-xs text-gray-600">Total</div>
                            <div className="text-xl font-bold text-black">{printStats.canonColour.total}</div>
                          </div>

                          {/* Row 2 */}
                          <div>
                            <div className="text-xs text-gray-600">A3 B/W</div>
                            <div className={`text-lg font-bold ${
                              isPrintStatHighlighted("Canon Color", "A3 Ασπρόμαυρο")
                                ? "text-blue-600 bg-blue-100 rounded px-1"
                                : "text-black"
                            }`}>
                              {printStats.canonColour.a3BW}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">A3 Colour</div>
                            <div className={`text-lg font-bold ${
                              isPrintStatHighlighted("Canon Color", "A3 Έγχρωμο")
                                ? "text-blue-600 bg-blue-100 rounded px-1"
                                : "text-black"
                            }`}>
                              {printStats.canonColour.a3Colour}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">A3 Total</div>
                            <div className="text-lg font-bold text-black">{printStats.canonColour.a3Total}</div>
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

                    {/* Κυδωνιών Statistics */}
                    <div className="md:col-span-2 bg-white rounded-lg border border-blue-200 shadow-sm">
                      <div className="bg-blue-100 px-4 py-3 border-b border-blue-200">
                        <div className="flex items-center gap-2">
                          <Printer className="h-5 w-5 text-blue-700" />
                          <h3 className="text-sm font-semibold text-blue-900">Κυδωνιών</h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-1">A4 B/W</div>
                          <div className={`text-xl font-bold ${
                            isPrintStatHighlighted("Κυδωνιών", "A4 Ασπρόμαυρο") 
                              ? "text-blue-600 bg-blue-100 rounded px-1" 
                              : "text-black"
                          }`}>
                            {printStats.kydonion.a4BW}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Total Print Statistics */}
                    <div className="md:col-span-2 bg-white rounded-lg border border-blue-200 shadow-sm">
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
                {/* Two Column Layout: Filters on Left, Table on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Left Column: Lamination Filters */}
                  <div className="lg:col-span-1 h-full">
                    <div className="h-full">
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
                    </div>
                  </div>

                  {/* Right Column: Lamination Table */}
                  <div className="lg:col-span-3">
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
                            {(user.accessLevel === "Διαχειριστής" || user.accessLevel === "Υπεύθυνος") && (
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
                              onPageChange={handleLamPageChange}
                              userRole={user.accessLevel}
                              onRowHover={setHoveredLaminationJob}
                              hasMore={hasMoreLam}
                            />
                          </ErrorBoundary>
                        </div>
                      </div>
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
