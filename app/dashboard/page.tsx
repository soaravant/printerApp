"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Navigation } from "@/components/navigation"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/lib/refresh-context"
// import { dummyDB } from "@/lib/dummy-database"
import type {
  FirebasePrintJob,
  FirebaseLaminationJob,
  FirebaseUser,
  FirebaseIncome,
  FirebaseExcelImportRunSummary,
} from "@/lib/firebase-schema"
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
import { useState, useEffect, useRef, useMemo, useDeferredValue, useTransition } from "react"
import { Printer, CreditCard, TrendingUp, Receipt, Calendar, Settings, X, Download, RotateCcw, Filter, BarChart3 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
// Note: Load XLSX only on demand to avoid adding it to the main bundle
let XLSX: any
import React from "react"

import { ExcelPeriodTimeline } from "@/components/excel-period-timeline"
import { PrintFilters } from "@/components/print-filters"
import { LaminationFilters } from "@/components/lamination-filters"
import { DebtFilters } from "@/components/debt-filters"
import { IncomeFilters } from "@/components/income-filters"

// Firestore
import { fetchIncomeFor, fetchLaminationJobsFor, fetchPrintJobsFor, useUsers, usePrintJobsInfinite, useLaminationJobsInfinite, useIncomeInfinite, fetchPrintJobsSince, fetchLaminationJobsSince, fetchIncomeSince, fetchUsers, useExcelImportHistory } from "@/lib/firebase-queries"
import { FIREBASE_COLLECTIONS } from "@/lib/firebase-schema"
import { getDebtFilterComparableValue, getPrintTypeLabel, isExcelPrintImportType, isManagedEntityRole, isNaosLikeRole, normalizeGreek, normalizeUserRoleLabel, roundMoney } from "@/lib/utils"
import { coerceToDate, computeDebtsAndBankForUser } from "@/lib/debt-projection"
import { getSnapshot, saveSnapshot, makeScopeKey, mergeById, sortByTimestampDesc } from "@/lib/snapshot-store"
import { loadRemoteSnapshot } from "@/lib/remote-snapshot"

// Error boundary component for dynamic imports
function ErrorBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  return (
    <React.Suspense fallback={fallback}>
      {children}
    </React.Suspense>
  )
}

const useFirestore = true
const allowRemoteSnapshotUpdate = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_REMOTE_SNAPSHOT_UPDATE === "true"

type DashboardTimelineStop = FirebaseExcelImportRunSummary & {
  createdAt: Date
  completedAt?: Date | null
}

type ProjectedDashboardState = {
  users: FirebaseUser[]
  printJobs: FirebasePrintJob[]
  laminationJobs: FirebaseLaminationJob[]
  income: FirebaseIncome[]
  bank: {
    printBank: number
    laminationBank: number
  }
}

type HoveredPrintJob = {
  rawType: FirebasePrintJob["type"] | "combined"
  isExcelImport: boolean
}

type ExcelPrintStatKey = "bw" | "color" | "adjustment"

function getDisplayTotalDebt(userLike: {
  printDebt?: number | null
  laminationDebt?: number | null
  totalDebt?: number | null
}) {
  const hasCategoryDebt =
    typeof userLike.printDebt === "number" ||
    typeof userLike.laminationDebt === "number"

  if (hasCategoryDebt) {
    return roundMoney(Number(userLike.printDebt || 0) + Number(userLike.laminationDebt || 0))
  }

  return roundMoney(Number(userLike.totalDebt || 0))
}

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

function collapseImportHistoryByPeriod(history: FirebaseExcelImportRunSummary[]) {
  const latestByPeriod = new Map<string, DashboardTimelineStop>()

  for (const item of history) {
    const createdAt = coerceToDate(item.createdAt)
    if (!createdAt || item.status !== "completed") continue
    const completedAt = coerceToDate(item.completedAt ?? null)
    latestByPeriod.set(item.periodKey, {
      ...item,
      createdAt,
      completedAt,
    })
  }

  return Array.from(latestByPeriod.values()).sort((left, right) => left.periodKey.localeCompare(right.periodKey))
}

function getPeriodKeyDateRange(periodKey: string | null | undefined) {
  if (!periodKey) return null
  const [yearPart, monthPart] = String(periodKey).split("-")
  const year = Number(yearPart)
  const month = Number(monthPart)
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null

  return {
    start: new Date(year, month - 1, 1, 0, 0, 0, 0),
    end: new Date(year, month, 0, 23, 59, 59, 999),
  }
}

function isPeriodKeyWithinSelectedRange(
  periodKey: string | null | undefined,
  startPeriodKey: string | null,
  endPeriodKey: string | null,
) {
  if (!periodKey) return false
  if (startPeriodKey && periodKey < startPeriodKey) return false
  if (endPeriodKey && periodKey > endPeriodKey) return false
  return true
}

function projectDashboardState(params: {
  allUsers: FirebaseUser[]
  printJobs: FirebasePrintJob[]
  laminationJobs: FirebaseLaminationJob[]
  income: FirebaseIncome[]
  start: Date | null
  end: Date | null
  startPeriodKey: string | null
  endPeriodKey: string | null
}): ProjectedDashboardState {
  const startMs = params.start?.getTime() ?? null
  const endMs = params.end?.getTime() ?? null
  const isWithinRange = (value: unknown) => {
    const date = coerceToDate(value as any)
    if (!date) return false
    const timestamp = date.getTime()
    if (startMs !== null && timestamp < startMs) return false
    if (endMs !== null && timestamp > endMs) return false
    return true
  }

  const visiblePrintJobs = params.printJobs.filter((job) => isWithinRange(job.timestamp))
  const visibleLaminationJobs = params.laminationJobs.filter((job) => isWithinRange(job.timestamp))
  const visibleIncome = params.income.filter((entry) => isWithinRange(entry.timestamp))
  const eventsByUid = new Map<string, Array<{ kind: "print" | "lamination" | "income"; amount: number; timestamp: Date }>>()
  const incomeByUid = new Map<string, FirebaseIncome[]>()

  const pushEvent = (uid: string, event: { kind: "print" | "lamination" | "income"; amount: number; timestamp: Date }) => {
    const bucket = eventsByUid.get(uid) ?? []
    bucket.push(event)
    eventsByUid.set(uid, bucket)
  }

  for (const job of visiblePrintJobs) {
    const timestamp = coerceToDate(job.timestamp)
    if (!timestamp) continue
    pushEvent(job.uid, { kind: "print", amount: Number(job.totalCost || 0), timestamp })
  }

  for (const job of visibleLaminationJobs) {
    const timestamp = coerceToDate(job.timestamp)
    if (!timestamp) continue
    pushEvent(job.uid, { kind: "lamination", amount: Number(job.totalCost || 0), timestamp })
  }

  for (const entry of visibleIncome) {
    const timestamp = coerceToDate(entry.timestamp)
    if (!timestamp) continue
    pushEvent(entry.uid, { kind: "income", amount: Number(entry.amount || 0), timestamp })
    const bucket = incomeByUid.get(entry.uid) ?? []
    bucket.push(entry)
    incomeByUid.set(entry.uid, bucket)
  }

  let printBank = 0
  let laminationBank = 0

  const projectedUsers = params.allUsers
    .map((currentUser) => {
      const createdAt = coerceToDate(currentUser.createdAt)
      const openingDebtImportedAt = coerceToDate(currentUser.openingDebtImportedAt ?? null)
      const hasOpeningBalance =
        Number(currentUser.openingPrintDebt || 0) !== 0 ||
        Number(currentUser.openingLaminationDebt || 0) !== 0 ||
        Boolean(currentUser.openingDebtSource)
      const openingBalancesAreActive = hasOpeningBalance && (
        isPeriodKeyWithinSelectedRange(currentUser.openingDebtSource ?? null, params.startPeriodKey, params.endPeriodKey) ||
        (!currentUser.openingDebtSource && isWithinRange(openingDebtImportedAt))
      )
      const userEvents = eventsByUid.get(currentUser.uid) ?? []
      const userExistsInRange =
        (createdAt ? isWithinRange(createdAt) : false) ||
        userEvents.length > 0 ||
        openingBalancesAreActive

      if (!userExistsInRange) return null

      const { debts, bank } = computeDebtsAndBankForUser(userEvents, {
        printDebt: openingBalancesAreActive ? Number(currentUser.openingPrintDebt || 0) : 0,
        laminationDebt: openingBalancesAreActive ? Number(currentUser.openingLaminationDebt || 0) : 0,
      })
      printBank = roundMoney(printBank + bank.printBank)
      laminationBank = roundMoney(laminationBank + bank.laminationBank)

      const visibleIncomeRows = incomeByUid.get(currentUser.uid) ?? []
      const lastPayment = visibleIncomeRows.length
        ? visibleIncomeRows
          .map((entry) => coerceToDate(entry.timestamp))
          .filter((entry): entry is Date => Boolean(entry))
          .reduce((latest, current) => (current > latest ? current : latest))
        : null

      return {
        ...currentUser,
        printDebt: debts.printDebt,
        laminationDebt: debts.laminationDebt,
        totalDebt: debts.totalDebt,
        lastPayment,
      }
    })
    .filter(Boolean) as FirebaseUser[]

  return {
    users: projectedUsers,
    printJobs: visiblePrintJobs,
    laminationJobs: visibleLaminationJobs,
    income: visibleIncome,
    bank: {
      printBank,
      laminationBank,
    },
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { refreshTrigger, triggerRefresh, setLoading, setLoadingLabel } = useRefresh()
  const [printJobs, setPrintJobs] = useState<FirebasePrintJob[]>([])
  const [laminationJobs, setLaminationJobs] = useState<FirebaseLaminationJob[]>([])
  const [allUsers, setAllUsers] = useState<FirebaseUser[]>([])
  const [income, setIncome] = useState<FirebaseIncome[]>([])

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
  const [groupFilter, setGroupFilter] = useState("all")
  const [sectorFilter, setSectorFilter] = useState("all")
  const [naosFilter, setNaosFilter] = useState("all")
  const [responsibleForFilter, setResponsibleForFilter] = useState("all")

  // Income filtering states
  const [incomeSearchTerm, setIncomeSearchTerm] = useState("")
  const [incomeRoleFilter, setIncomeRoleFilter] = useState("all")
  const [incomeDateFrom, setIncomeDateFrom] = useState("")
  const [incomeDateTo, setIncomeDateTo] = useState("")
  const [incomeAmountRange, setIncomeAmountRange] = useState<[number, number]>([0, 100])
  const [incomeAmountInputs, setIncomeAmountInputs] = useState<[string, string]>(["0", "100"])
  const [incomeResponsibleForFilter, setIncomeResponsibleForFilter] = useState("all")
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const deferredIncomeSearchTerm = useDeferredValue(incomeSearchTerm)
  const [isFilteringPending, startFilteringTransition] = useTransition()
  const normalizeCacheRef = useRef<Map<string, string>>(new Map())
  const normalizeCached = (input: string) => {
    const key = input || ""
    const cached = normalizeCacheRef.current.get(key)
    if (cached !== undefined) return cached
    const norm = normalizeGreek(key)
    normalizeCacheRef.current.set(key, norm)
    return norm
  }

  // Filtered data states
  const [filteredPrintJobs, setFilteredPrintJobs] = useState<FirebasePrintJob[]>([])
  const [filteredLaminationJobs, setFilteredLaminationJobs] = useState<FirebaseLaminationJob[]>([])
  const [filteredIncome, setFilteredIncome] = useState<FirebaseIncome[]>([])

  // Pagination state
  const [printJobsPage, setPrintJobsPage] = useState(1)
  const [laminationJobsPage, setLaminationJobsPage] = useState(1)
  const [incomePage, setIncomePage] = useState(1)
  const [debtPage, setDebtPage] = useState(1)
  const PAGE_SIZE = 10
  const FETCH_BATCH_SIZE = Number(process.env.NEXT_PUBLIC_FETCH_BATCH_SIZE ?? 250)
  const BACKGROUND_CHUNK_SIZE = 100
  const printPrefetchTokenRef = useRef(0)
  const lamPrefetchTokenRef = useRef(0)
  const incomePrefetchTokenRef = useRef(0)
  const [prefetchEnabled, setPrefetchEnabled] = useState(false)
  const [snapshotsLoaded, setSnapshotsLoaded] = useState(false)
  const MAX_INITIAL_PAGES = Number(process.env.NEXT_PUBLIC_MAX_INITIAL_PAGES ?? 1)

  const persistDashboardSnapshots = async (
    currentUidFilter: string | undefined,
    nextPrintJobs: FirebasePrintJob[],
    nextLaminationJobs: FirebaseLaminationJob[],
    nextIncome: FirebaseIncome[],
  ) => {
    const scopeKey = (collection: string) => makeScopeKey(collection, currentUidFilter)
    await Promise.all([
      saveSnapshot(scopeKey(FIREBASE_COLLECTIONS.PRINT_JOBS), { lastUpdated: Date.now(), items: nextPrintJobs as any }),
      saveSnapshot(scopeKey(FIREBASE_COLLECTIONS.LAMINATION_JOBS), { lastUpdated: Date.now(), items: nextLaminationJobs as any }),
      saveSnapshot(scopeKey(FIREBASE_COLLECTIONS.INCOME), { lastUpdated: Date.now(), items: nextIncome as any }),
    ])
  }

  const fetchDashboardDataFromServer = async (currentUidFilter: string | undefined) => {
    const [nextPrintJobs, nextLaminationJobs, nextIncome, nextUsers] = await Promise.all([
      fetchPrintJobsFor(currentUidFilter),
      fetchLaminationJobsFor(currentUidFilter),
      fetchIncomeFor(currentUidFilter),
      fetchUsers(),
    ])

    return {
      nextPrintJobs,
      nextLaminationJobs,
      nextIncome,
      nextUsers,
    }
  }

  const applyDashboardDataFromServer = async (
    currentUidFilter: string | undefined,
    nextData: {
      nextPrintJobs: FirebasePrintJob[]
      nextLaminationJobs: FirebaseLaminationJob[]
      nextIncome: FirebaseIncome[]
      nextUsers: FirebaseUser[]
    },
  ) => {
    initializedDebtRangeRef.current = false
    initializedIncomeRangeRef.current = false
    setPrintJobs(nextData.nextPrintJobs as any)
    setLaminationJobs(nextData.nextLaminationJobs as any)
    setIncome(nextData.nextIncome as any)
    setAllUsers(nextData.nextUsers as any)
    setSnapshotsLoaded(true)
    setPrefetchEnabled(false)
    await persistDashboardSnapshots(
      currentUidFilter,
      nextData.nextPrintJobs,
      nextData.nextLaminationJobs,
      nextData.nextIncome,
    )
  }

  const handleManualRefresh = async () => {
    if (!user) return
    try {
      setLoadingLabel("Ανανέωση δεδομένων...")
      setLoading(true)
      const nextData = await fetchDashboardDataFromServer(uidFilter)
      await applyDashboardDataFromServer(uidFilter, nextData)
      setLoading(false)
    } catch (e) {
      setLoading(false)
    }
  }

  // Initialize debt range once based on visible users
  const initializedDebtRangeRef = useRef(false)
  // Initialize income range once based on loaded income
  const initializedIncomeRangeRef = useRef(false)
  // Server pagination cursors
  const [printCursor, setPrintCursor] = useState<any | undefined>(undefined)
  const [lamCursor, setLamCursor] = useState<any | undefined>(undefined)
  const [incomeCursor, setIncomeCursor] = useState<any | undefined>(undefined)
  const [hasMorePrint, setHasMorePrint] = useState<boolean>(false)
  const [hasMoreLam, setHasMoreLam] = useState<boolean>(false)
  const [hasMoreIncome, setHasMoreIncome] = useState<boolean>(false)

  // Hover state for highlighting statistics
  const [hoveredPrintJob, setHoveredPrintJob] = useState<HoveredPrintJob | null>(null)
  const [hoveredLaminationJob, setHoveredLaminationJob] = useState<{ machine: string; type: string } | null>(null)

  // Bank reset confirmation states
  const [showPrintBankResetDialog, setShowPrintBankResetDialog] = useState(false)
  const [showLaminationBankResetDialog, setShowLaminationBankResetDialog] = useState(false)
  const [showTotalBankResetDialog, setShowTotalBankResetDialog] = useState(false)

  // Excel timeline range state
  const [timelineStartPeriodKey, setTimelineStartPeriodKey] = useState<string | null>(null)
  const [timelineEndPeriodKey, setTimelineEndPeriodKey] = useState<string | null>(null)

  const { data: cachedUsers } = useUsers()
  const { data: excelImportHistory = [] } = useExcelImportHistory()

  // Use react-query infinite caches to avoid reloads when switching routes
  const uidFilter = (user?.accessLevel === "Χρήστης") ? user.uid : undefined
  const printInf = usePrintJobsInfinite(uidFilter, FETCH_BATCH_SIZE, { enabled: prefetchEnabled })
  const lamInf = useLaminationJobsInfinite(uidFilter, FETCH_BATCH_SIZE, { enabled: prefetchEnabled })
  const incInf = useIncomeInfinite(uidFilter, FETCH_BATCH_SIZE, { enabled: prefetchEnabled })

  // Persist a flag to resume background prefetch if user exits early
  const prefetchResumeKey = React.useMemo(() => {
    const scope = uidFilter ? `uid:${uidFilter}` : "all"
    return `dashboard:prefetch-incomplete:${scope}`
  }, [uidFilter])

  const timelineStops = useMemo(() => collapseImportHistoryByPeriod(excelImportHistory), [excelImportHistory])
  const timelineStartIndex = useMemo(
    () => timelineStops.findIndex((stop) => stop.periodKey === timelineStartPeriodKey),
    [timelineStops, timelineStartPeriodKey]
  )
  const timelineEndIndex = useMemo(
    () => timelineStops.findIndex((stop) => stop.periodKey === timelineEndPeriodKey),
    [timelineStops, timelineEndPeriodKey]
  )
  const activeTimelineStartIndex = timelineStartIndex >= 0 ? timelineStartIndex : 0
  const activeTimelineEndIndex = timelineEndIndex >= 0 ? timelineEndIndex : Math.max(0, timelineStops.length - 1)
  const normalizedTimelineStartIndex = Math.min(activeTimelineStartIndex, activeTimelineEndIndex)
  const normalizedTimelineEndIndex = Math.max(activeTimelineStartIndex, activeTimelineEndIndex)
  const selectedTimelineStartStop = timelineStops[normalizedTimelineStartIndex] ?? null
  const selectedTimelineEndStop = timelineStops[normalizedTimelineEndIndex] ?? null
  const selectedTimelineStart = getPeriodKeyDateRange(selectedTimelineStartStop?.periodKey ?? null)?.start ?? null
  const selectedTimelineEnd = getPeriodKeyDateRange(selectedTimelineEndStop?.periodKey ?? null)?.end ?? null

  const projectedDashboardState = useMemo(
    () =>
      projectDashboardState({
        allUsers,
        printJobs,
        laminationJobs,
        income,
        start: selectedTimelineStart,
        end: selectedTimelineEnd,
        startPeriodKey: selectedTimelineStartStop?.periodKey ?? null,
        endPeriodKey: selectedTimelineEndStop?.periodKey ?? null,
      }),
    [allUsers, printJobs, laminationJobs, income, selectedTimelineStart, selectedTimelineEnd, selectedTimelineStartStop, selectedTimelineEndStop]
  )

  const timelineUsers = projectedDashboardState.users
  const timelinePrintJobs = projectedDashboardState.printJobs
  const timelineLaminationJobs = projectedDashboardState.laminationJobs
  const timelineIncome = projectedDashboardState.income
  const timelineBank = projectedDashboardState.bank

  // Ensure users are always loaded into local state regardless of prefetch path
  useEffect(() => {
    if (cachedUsers && cachedUsers.length) {
      setAllUsers(cachedUsers as any)
    }
  }, [cachedUsers])

  useEffect(() => {
    if (!timelineStops.length) {
      setTimelineStartPeriodKey(null)
      setTimelineEndPeriodKey(null)
      return
    }
    const oldestPeriodKey = timelineStops[0].periodKey
    const latestPeriodKey = timelineStops[timelineStops.length - 1].periodKey
    const resolvedStartIndex = timelineStops.findIndex((stop) => stop.periodKey === timelineStartPeriodKey)
    const resolvedEndIndex = timelineStops.findIndex((stop) => stop.periodKey === timelineEndPeriodKey)

    if (resolvedStartIndex < 0 && timelineStartPeriodKey !== oldestPeriodKey) {
      setTimelineStartPeriodKey(oldestPeriodKey)
      return
    }

    if (resolvedEndIndex < 0 && timelineEndPeriodKey !== latestPeriodKey) {
      setTimelineEndPeriodKey(latestPeriodKey)
      return
    }

    if (resolvedStartIndex > resolvedEndIndex && resolvedEndIndex >= 0) {
      const clampedStartKey = timelineStops[resolvedEndIndex].periodKey
      if (timelineStartPeriodKey !== clampedStartKey) {
        setTimelineStartPeriodKey(clampedStartKey)
      }
    }
  }, [timelineStops, timelineStartPeriodKey, timelineEndPeriodKey])

  useEffect(() => {
    setPrintJobsPage(1)
    setLaminationJobsPage(1)
    setIncomePage(1)
    setDebtPage(1)
  }, [timelineStartPeriodKey, timelineEndPeriodKey])

  // Load snapshots first, then optionally enable/resume prefetch
  useEffect(() => {
    let cancelled = false
      ; (async () => {
        if (!user) return
        if (refreshTrigger > 0) {
          const nextData = await fetchDashboardDataFromServer(uidFilter)
          if (cancelled) return
          await applyDashboardDataFromServer(uidFilter, nextData)
          if (cancelled) return
          setLoading(false)
          return
        }
        const scopeKey = (collection: string) => makeScopeKey(collection, uidFilter)
        const resumeWanted = (typeof window !== "undefined") && Boolean(localStorage.getItem(prefetchResumeKey))
        const [pjSnap, ljSnap, incSnap] = await Promise.all([
          getSnapshot<any>(scopeKey(FIREBASE_COLLECTIONS.PRINT_JOBS)),
          getSnapshot<any>(scopeKey(FIREBASE_COLLECTIONS.LAMINATION_JOBS)),
          getSnapshot<any>(scopeKey(FIREBASE_COLLECTIONS.INCOME)),
        ])
        if (cancelled) return
        let hadAnySnapshot = false
        if (pjSnap && pjSnap.items?.length) {
          setPrintJobs(sortByTimestampDesc(pjSnap.items as any))
          hadAnySnapshot = true
        }
        if (ljSnap && ljSnap.items?.length) {
          setLaminationJobs(sortByTimestampDesc(ljSnap.items as any))
          hadAnySnapshot = true
        }
        if (incSnap && incSnap.items?.length) {
          setIncome(sortByTimestampDesc(incSnap.items as any))
          hadAnySnapshot = true
        }
        setSnapshotsLoaded(true)
        // If we have at least one snapshot, do delta fetches; resume full prefetch if it was incomplete
        if (hadAnySnapshot) {
          // Compute since per collection from snapshot metadata or top timestamp
          const pjSince = pjSnap?.lastUpdated ? new Date(pjSnap.lastUpdated) : (pjSnap?.items?.[0]?.timestamp ? new Date(pjSnap.items[0].timestamp) : null)
          const ljSince = ljSnap?.lastUpdated ? new Date(ljSnap.lastUpdated) : (ljSnap?.items?.[0]?.timestamp ? new Date(ljSnap.items[0].timestamp) : null)
          const incSince = incSnap?.lastUpdated ? new Date(incSnap.lastUpdated) : (incSnap?.items?.[0]?.timestamp ? new Date(incSnap.items[0].timestamp) : null)
          const [pjDelta, ljDelta, incDelta] = await Promise.all([
            pjSince ? fetchPrintJobsSince({ uid: uidFilter, since: pjSince }) : Promise.resolve([]),
            ljSince ? fetchLaminationJobsSince({ uid: uidFilter, since: ljSince }) : Promise.resolve([]),
            incSince ? fetchIncomeSince({ uid: uidFilter, since: incSince }) : Promise.resolve([]),
          ])
          if (cancelled) return
          if (pjDelta.length) {
            const merged = sortByTimestampDesc(mergeById(pjSnap?.items || [], pjDelta, ["jobId"]))
            setPrintJobs(merged as any)
            await saveSnapshot(scopeKey(FIREBASE_COLLECTIONS.PRINT_JOBS), { lastUpdated: Date.now(), items: merged as any })
          }
          if (ljDelta.length) {
            const merged = sortByTimestampDesc(mergeById(ljSnap?.items || [], ljDelta, ["jobId"]))
            setLaminationJobs(merged as any)
            await saveSnapshot(scopeKey(FIREBASE_COLLECTIONS.LAMINATION_JOBS), { lastUpdated: Date.now(), items: merged as any })
          }
          if (incDelta.length) {
            const merged = sortByTimestampDesc(mergeById(incSnap?.items || [], incDelta, ["incomeId"]))
            setIncome(merged as any)
            await saveSnapshot(scopeKey(FIREBASE_COLLECTIONS.INCOME), { lastUpdated: Date.now(), items: merged as any })
          }
          // If user had exited early previously, resume background prefetch to complete it
          setPrefetchEnabled(resumeWanted)
          // Ensure overlay stays until initial filter pass completes
          setLoading(false)
        } else {
          setPrefetchEnabled(true)
        }
      })()
    return () => { cancelled = true }
  }, [user, uidFilter, prefetchResumeKey, refreshTrigger])

  useEffect(() => {
    if (!user) return
    // If nothing cached yet, kick off fetching first page in background
    if (useFirestore && prefetchEnabled) {
      // Start/continue background prefetch loops to completion
      printPrefetchTokenRef.current += 1
      lamPrefetchTokenRef.current += 1
      incomePrefetchTokenRef.current += 1
      const pTok = printPrefetchTokenRef.current
      const lTok = lamPrefetchTokenRef.current
      const iTok = incomePrefetchTokenRef.current

        ; (async () => {
          // Ensure at least first page
          if (!printInf.data && !printInf.isFetching) await printInf.fetchNextPage()
          // Fetch remaining pages
          let pagesFetchedInLoop = 0
          while (true) {
            if (printPrefetchTokenRef.current !== pTok) break
            const lastCursor = (printInf.data?.pages.slice(-1)[0]?.nextCursor)
            if (!lastCursor) break
            if (printInf.isFetching) { await new Promise(r => setTimeout(r, 100)); continue }
            await printInf.fetchNextPage()
            pagesFetchedInLoop += 1
            if (pagesFetchedInLoop >= MAX_INITIAL_PAGES) break
          }
        })()

        ; (async () => {
          if (!lamInf.data && !lamInf.isFetching) await lamInf.fetchNextPage()
          let pagesFetchedInLoop = 0
          while (true) {
            if (lamPrefetchTokenRef.current !== lTok) break
            const lastCursor = (lamInf.data?.pages.slice(-1)[0]?.nextCursor)
            if (!lastCursor) break
            if (lamInf.isFetching) { await new Promise(r => setTimeout(r, 100)); continue }
            await lamInf.fetchNextPage()
            pagesFetchedInLoop += 1
            if (pagesFetchedInLoop >= MAX_INITIAL_PAGES) break
          }
        })()

        ; (async () => {
          if (!incInf.data && !incInf.isFetching) await incInf.fetchNextPage()
          let pagesFetchedInLoop = 0
          while (true) {
            if (incomePrefetchTokenRef.current !== iTok) break
            const lastCursor = (incInf.data?.pages.slice(-1)[0]?.nextCursor)
            if (!lastCursor) break
            if (incInf.isFetching) { await new Promise(r => setTimeout(r, 100)); continue }
            await incInf.fetchNextPage()
            pagesFetchedInLoop += 1
            if (pagesFetchedInLoop >= MAX_INITIAL_PAGES) break
          }
        })()

      const pj = (printInf.data?.pages.flatMap(p => p.items) ?? []) as any
      const lj = (lamInf.data?.pages.flatMap(p => p.items) ?? []) as any
      const inc = (incInf.data?.pages.flatMap(p => p.items) ?? []) as any
      if (prefetchEnabled) {
        // Avoid replacing larger snapshot data with smaller partial prefetch pages
        if (pj.length >= printJobs.length) setPrintJobs(pj)
        if (lj.length >= laminationJobs.length) setLaminationJobs(lj)
        if (inc.length >= income.length) setIncome(inc)
        // Save partial snapshots to speed up subsequent visits
        const scopeKey = (collection: string) => makeScopeKey(collection, uidFilter)
          ; (async () => {
            await Promise.all([
              saveSnapshot(scopeKey(FIREBASE_COLLECTIONS.PRINT_JOBS), { lastUpdated: Date.now(), items: pj }),
              saveSnapshot(scopeKey(FIREBASE_COLLECTIONS.LAMINATION_JOBS), { lastUpdated: Date.now(), items: lj }),
              saveSnapshot(scopeKey(FIREBASE_COLLECTIONS.INCOME), { lastUpdated: Date.now(), items: inc }),
            ])
          })()
      }
      setHasMorePrint(Boolean(printInf.data?.pages.slice(-1)[0]?.nextCursor))
      setHasMoreLam(Boolean(lamInf.data?.pages.slice(-1)[0]?.nextCursor))
      setHasMoreIncome(Boolean(incInf.data?.pages.slice(-1)[0]?.nextCursor))
      if (cachedUsers) setAllUsers(cachedUsers as any)
    }
  }, [user, useFirestore, prefetchEnabled, printInf.data, lamInf.data, incInf.data, cachedUsers, printInf.isFetching, lamInf.isFetching, incInf.isFetching, printJobs.length, laminationJobs.length, income.length])

  // Fallback: initialize debt range when users load even without prefetch loop
  useEffect(() => {
    if (!user) return
    if (initializedDebtRangeRef.current) return
    if (!timelineUsers || !timelineUsers.length) return
    const visibleUsers = (user.accessLevel === "Διαχειριστής")
      ? timelineUsers
      : (user.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0)
        ? timelineUsers.filter(u => {
          if (u.userRole === "Άτομο") {
            return u.memberOf?.some((g: string) => user.responsibleFor?.includes(g))
          }
          return user.responsibleFor?.includes(u.displayName)
        })
        : timelineUsers.filter(u => u.uid === user.uid)
    const amounts = visibleUsers
      .filter(u => u.accessLevel !== "Διαχειριστής")
      .map(u => getDebtFilterComparableValue(getDisplayTotalDebt(u)))
    if (amounts.length > 0) {
      const minDebt = Math.floor(Math.min(...amounts))
      const maxDebt = Math.ceil(Math.max(...amounts))
      setPriceRange([minDebt, maxDebt])
      setPriceRangeInputs([minDebt.toString(), maxDebt.toString()])
      initializedDebtRangeRef.current = true
    }
  }, [user, timelineUsers])

  // Initialize income range once when income data becomes available
  useEffect(() => {
    if (initializedIncomeRangeRef.current) return
    if (!timelineIncome || !timelineIncome.length) return
    const amounts = timelineIncome.map(i => i.amount || 0)
    if (amounts.length > 0) {
      const minIncome = Math.floor(Math.min(...amounts))
      const maxIncome = Math.ceil(Math.max(...amounts))
      setIncomeAmountRange([minIncome, maxIncome])
      setIncomeAmountInputs([minIncome.toString(), maxIncome.toString()])
      initializedIncomeRangeRef.current = true
    }
  }, [timelineIncome])

  // Persist snapshots after full prefetch completion
  useEffect(() => {
    if (!user || !prefetchEnabled) return
    const scopeKey = (collection: string) => makeScopeKey(collection, uidFilter)
    const pjDone = Boolean(printInf.data && !printInf.data.pages.slice(-1)[0]?.nextCursor)
    const ljDone = Boolean(lamInf.data && !lamInf.data.pages.slice(-1)[0]?.nextCursor)
    const incDone = Boolean(incInf.data && !incInf.data.pages.slice(-1)[0]?.nextCursor)
    const saveAll = async () => {
      const pj = (printInf.data?.pages.flatMap(p => p.items) ?? []) as any
      const lj = (lamInf.data?.pages.flatMap(p => p.items) ?? []) as any
      const inc = (incInf.data?.pages.flatMap(p => p.items) ?? []) as any
      await Promise.all([
        saveSnapshot(scopeKey(FIREBASE_COLLECTIONS.PRINT_JOBS), { lastUpdated: Date.now(), items: pj }),
        saveSnapshot(scopeKey(FIREBASE_COLLECTIONS.LAMINATION_JOBS), { lastUpdated: Date.now(), items: lj }),
        saveSnapshot(scopeKey(FIREBASE_COLLECTIONS.INCOME), { lastUpdated: Date.now(), items: inc }),
      ])
      setPrefetchEnabled(false)
      setLoading(false)
    }
    if (pjDone && ljDone && incDone) {
      saveAll()
    }
  }, [user, uidFilter, prefetchEnabled, printInf.data, lamInf.data, incInf.data])

  // Keep a persistent resume flag while prefetch is in progress; clear when done
  useEffect(() => {
    if (typeof window === "undefined") return
    if (prefetchEnabled) {
      try { localStorage.setItem(prefetchResumeKey, "1") } catch { }
    } else {
      try { localStorage.removeItem(prefetchResumeKey) } catch { }
    }
  }, [prefetchEnabled, prefetchResumeKey])

  // Handlers to change page using server pagination (forward only)
  const handlePrintPageChange = async (newPage: number) => {
    if (!user) return
    if (newPage < 1) return
    if (newPage > printJobsPage && prefetchEnabled) {
      await printInf.fetchNextPage()
      const pj = (printInf.data?.pages.flatMap(p => p.items) ?? []) as any
      setPrintJobs(pj)
    }
    setPrintJobsPage(newPage)
  }

  const handleLamPageChange = async (newPage: number) => {
    if (!user) return
    if (newPage < 1) return
    if (newPage > laminationJobsPage && prefetchEnabled) {
      await lamInf.fetchNextPage()
      const lj = (lamInf.data?.pages.flatMap(p => p.items) ?? []) as any
      setLaminationJobs(lj)
    }
    setLaminationJobsPage(newPage)
  }

  const handleIncomePageChange = async (newPage: number) => {
    if (!user) return
    if (newPage < 1) return
    if (newPage > incomePage && prefetchEnabled) {
      await incInf.fetchNextPage()
      const inc = (incInf.data?.pages.flatMap(p => p.items) ?? []) as any
      setIncome(inc)
    }
    setIncomePage(newPage)
  }

  // Apply unified filters
  // Re-apply filters as data streams in (debounced for keystrokes)
  useEffect(() => {
    const t = setTimeout(() => {
      applyFilters()
    }, 200)
    return () => clearTimeout(t)
  }, [
    deferredSearchTerm,
    dateFrom,
    dateTo,
    statusFilter,
    typeFilter,
    deviceFilter,
    userFilter,
    timelinePrintJobs,
    timelineLaminationJobs,
    timelineIncome,
    timelineUsers,
    // New tab-specific filters
    activeTab,
    printTypeFilter,
    machineFilter,
    laminationTypeFilter,
    // Income filters
    deferredIncomeSearchTerm,
    incomeRoleFilter,
    incomeDateFrom,
    incomeDateTo,
    incomeAmountRange,
    incomeResponsibleForFilter,
  ])

  // Clear global loading overlay as soon as the first stable render with filtered data is ready
  useEffect(() => {
    // Heuristic: if any of the primary datasets are present (even from snapshots), hide the overlay
    const hasAnyData = (printJobs.length + laminationJobs.length + income.length) > 0
    if (hasAnyData) {
      setLoading(false)
    }
  }, [printJobs.length, laminationJobs.length, income.length, setLoading])

  // Bank amounts
  const bankAmounts = undefined

  // ... rest of file remains unchanged

  const applyFilters = () => {
    startFilteringTransition(() => {
      // Filter Print Jobs with tab-specific filters
      let filteredPJ = [...timelinePrintJobs]
      if (deferredSearchTerm) {
        const normSearch = normalizeCached(deferredSearchTerm)
        filteredPJ = filteredPJ.filter(
          (item) =>
            normalizeCached(item.deviceName || "").includes(normSearch) ||
            normalizeCached(item.deviceIP || "").includes(normSearch) ||
            normalizeCached(item.userDisplayName || "").includes(normSearch),
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
              return item.type === "A4BW" || item.type === "ExcelBWImport"
            case "a4Color":
              return item.type === "A4Color" || item.type === "ExcelColorImport"
            case "a3BW":
              return item.type === "A3BW"
            case "a3Color":
              return item.type === "A3Color"
            case "excelAdjustment":
              return item.type === "ExcelAdjustmentImport"
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
      let filteredLJ = [...timelineLaminationJobs]
      if (deferredSearchTerm) {
        const normSearch = normalizeCached(deferredSearchTerm)
        filteredLJ = filteredLJ.filter(
          (item) =>
            normalizeCached(item.type || "").includes(normSearch) ||
            normalizeCached(item.notes || "").includes(normSearch) ||
            normalizeCached(item.userDisplayName || "").includes(normSearch),
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
      let filteredInc = [...timelineIncome]

      // Apply income search filter
      if (deferredIncomeSearchTerm) {
        const normIncomeSearch = normalizeCached(deferredIncomeSearchTerm)
        filteredInc = filteredInc.filter(
          (item) =>
            normalizeCached(item.userDisplayName || "").includes(normIncomeSearch) ||
            normalizeCached(item.username || "").includes(normIncomeSearch)
        )
      }

      // Apply income role filter
      if (incomeRoleFilter !== "all") {
        filteredInc = filteredInc.filter((item) => {
          const userData = timelineUsers.find(u => u.uid === item.uid);
          return userData && normalizeUserRoleLabel(userData.userRole) === incomeRoleFilter;
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
          const userData = timelineUsers.find(u => u.uid === item.uid);
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
    })
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
    if (timelineUsers.length > 0) {
      const userDebtAmounts = timelineUsers
        .filter(userData => userData.accessLevel !== "Διαχειριστής")
        .map(user => getDebtFilterComparableValue(getDisplayTotalDebt(user)));

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
    setGroupFilter("all")
    setSectorFilter("all")
    setNaosFilter("all")
    setResponsibleForFilter("all")
  }

  const clearIncomeFilters = () => {
    setIncomeSearchTerm("")
    setIncomeRoleFilter("all")
    setIncomeDateFrom("")
    setIncomeDateTo("")

    // Reset income amount range to actual range from data
    if (timelineIncome.length > 0) {
      const incomeAmounts = timelineIncome.map(inc => inc.amount || 0);

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
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
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
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
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
    return [...new Set(timelinePrintJobs.map((job) => job.deviceName).filter(Boolean))]
  }, [timelinePrintJobs])
  const uniqueDevices = useMemo(() => {
    return [...allDevices].sort((left, right) => left.localeCompare(right, "el"))
  }, [allDevices])

  if (!user) {
    return (
      <ProtectedRoute>
        {null}
      </ProtectedRoute>
    )
  }

  // Calculate totals based on projected users and timeline jobs
  const allUsersData = timelineUsers

  // For the top 3 cards, show personal charges for Υπεύθυνος and Χρήστης users
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

  const matchesAdminDebtMembershipFilters = (userData: FirebaseUser) => {
    if (user.accessLevel !== "Διαχειριστής") return true

    const normalizedRole = normalizeUserRoleLabel(userData.userRole)
    const memberships = Array.isArray(userData.memberOf) ? userData.memberOf : []

    if (groupFilter !== "all") {
      if (normalizedRole === "Άτομο") {
        if (!memberships.includes(groupFilter)) return false
      } else if (normalizedRole === "Ομάδα") {
        if (userData.displayName !== groupFilter) return false
      } else {
        return false
      }
    }

    if (sectorFilter !== "all") {
      if (normalizedRole === "Άτομο") {
        if (!memberships.includes(sectorFilter)) return false
      } else if (normalizedRole === "Τομέας") {
        if (userData.displayName !== sectorFilter) return false
      } else {
        return false
      }
    }

    if (naosFilter !== "all") {
      if (normalizedRole === "Άτομο") {
        if (!memberships.includes(naosFilter)) return false
      } else if (isNaosLikeRole(userData.userRole)) {
        if (userData.displayName !== naosFilter) return false
      } else {
        return false
      }
    }

    return true
  }

  const isOpeningBalanceInSelectedRange = (currentUser: FirebaseUser) => {
    if (isPeriodKeyWithinSelectedRange(
      currentUser.openingDebtSource ?? null,
      selectedTimelineStartStop?.periodKey ?? null,
      selectedTimelineEndStop?.periodKey ?? null,
    )) {
      return true
    }

    if (currentUser.openingDebtSource) return false

    const openingDebtImportedAt = coerceToDate(currentUser.openingDebtImportedAt ?? null)
    if (!openingDebtImportedAt) return false
    if (selectedTimelineStart && openingDebtImportedAt.getTime() < selectedTimelineStart.getTime()) return false
    if (selectedTimelineEnd && openingDebtImportedAt.getTime() > selectedTimelineEnd.getTime()) return false
    return true
  }

  const sumChargesForUsers = (
    users: FirebaseUser[],
    jobs: Array<{ uid: string; totalCost: number }>,
    openingBalanceKey: "openingPrintDebt" | "openingLaminationDebt",
  ) => {
    const userIds = new Set(users.map((currentUser) => currentUser.uid))
    const openingCharges = users.reduce((sum, currentUser) => {
      if (!isOpeningBalanceInSelectedRange(currentUser)) return sum
      return sum + Math.max(0, Number(currentUser[openingBalanceKey] || 0))
    }, 0)
    const jobCharges = jobs.reduce((sum, job) => {
      if (!userIds.has(job.uid)) return sum
      return sum + Number(job.totalCost || 0)
    }, 0)

    return roundMoney(openingCharges + jobCharges)
  }

  const printCharged = sumChargesForUsers(personalDebtUsers, timelinePrintJobs, "openingPrintDebt")
  const laminationCharged = sumChargesForUsers(personalDebtUsers, timelineLaminationJobs, "openingLaminationDebt")
  const totalCharged = roundMoney(printCharged + laminationCharged)
  const currentDebtTotals = personalDebtUsers.reduce((totals, currentUser) => {
    totals.print = roundMoney(totals.print + Number(currentUser.printDebt || 0))
    totals.lamination = roundMoney(totals.lamination + Number(currentUser.laminationDebt || 0))
    totals.total = roundMoney(totals.total + getDisplayTotalDebt(currentUser))
    return totals
  }, {
    print: 0,
    lamination: 0,
    total: 0,
  })
  const printCurrentDebt = currentDebtTotals.print
  const laminationCurrentDebt = currentDebtTotals.lamination
  const totalCurrentDebt = currentDebtTotals.total

  // Calculate totals without filters for percentage calculations
  const totalPrintCharged = sumChargesForUsers(allUsersData, timelinePrintJobs, "openingPrintDebt")
  const totalLaminationCharged = sumChargesForUsers(allUsersData, timelineLaminationJobs, "openingLaminationDebt")

  // Check if any filters are applied
  const hasFilters = searchTerm ||
    statusFilter !== "all" ||
    userFilter !== "all"

  // Calculate percentages for summary cards
  const printChargedPercentage = totalPrintCharged > 0 ? (printCharged / totalPrintCharged) * 100 : 0
  const laminationChargedPercentage = totalLaminationCharged > 0 ? (laminationCharged / totalLaminationCharged) * 100 : 0
  const totalCombinedCharged = totalPrintCharged + totalLaminationCharged
  const totalChargedPercentage = totalCombinedCharged > 0 ? (totalCharged / totalCombinedCharged) * 100 : 0

  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentMonthPrintJobs = timelinePrintJobs.filter((j) => j.timestamp.toISOString().slice(0, 7) === currentMonth)
  const currentMonthLaminationJobs = timelineLaminationJobs.filter((j) => j.timestamp.toISOString().slice(0, 7) === currentMonth)
  const currentMonthPrintCost = currentMonthPrintJobs.reduce((sum, j) => sum + j.totalCost, 0)
  const currentMonthLaminationCost = currentMonthLaminationJobs.reduce((sum, j) => sum + j.totalCost, 0)

  // Bank values for cards
  const printBank: number = useFirestore ? timelineBank.printBank : 0
  const laminationBank: number = useFirestore ? timelineBank.laminationBank : 0
  const totalBank = printBank + laminationBank
  const showBankResetActions = user.accessLevel === "Διαχειριστής" && timelineStops.length === 0
  const summaryCardLabel = "Χρέος|Έσοδα"

  const getLaminationTypeLabel = (type: string) => {
    switch (type) {
      case "A3":
        return "A3"
      case "A4":
        return "A4"
      case "A5":
        return "A5"
      case "cards":
        return "Κάρτες"
      case "card_small":
        return "Κάρτα Μικρή"
      case "card_large":
        return "Κάρτα Μεγάλη"
      case "spiral":
        return "Σπιράλ"
      case "colored_cardboard":
        return "Χρωματιστά Χαρτόνια"
      case "plastic_cover":
        return "Πλαστικό Κάλυμμα"
      case "ExcelLaminationImport":
        return "Excel εισαγωγή"
      default:
        return type
    }
  }

  const formatPrice = (price: number) => `€${price.toFixed(2).replace('.', ',')}`
  const formatBalance = (amount: number) => {
    const roundedAmount = roundMoney(amount)
    return roundedAmount < 0 ? `-${formatPrice(Math.abs(roundedAmount))}` : formatPrice(roundedAmount)
  }

  // Calculate print statistics
  const calculatePrintStatistics = () => {
    const stats = {
      bwPages: 0,
      colorPages: 0,
      adjustmentCost: 0,
      totalPages: 0,
    }

    filteredPrintJobs.forEach((job) => {
      if (!isExcelPrintImportType(job.type)) return

      if (job.type === "ExcelBWImport") {
        stats.bwPages += job.quantity
        stats.totalPages += job.quantity
      } else if (job.type === "ExcelColorImport") {
        stats.colorPages += job.quantity
        stats.totalPages += job.quantity
      } else if (job.type === "ExcelAdjustmentImport") {
        stats.adjustmentCost = roundMoney(stats.adjustmentCost + job.totalCost)
      }
    })

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

  const printStats = calculatePrintStatistics()
  const laminationStats = calculateLaminationStatistics(hoveredLaminationJob)

  // Helper functions to determine if a statistic should be highlighted
  const getHoveredPrintStatKey = (hoveredJob: HoveredPrintJob | null): ExcelPrintStatKey | null => {
    if (!hoveredJob?.isExcelImport) return null

    switch (hoveredJob.rawType) {
      case "ExcelBWImport":
        return "bw"
      case "ExcelColorImport":
        return "color"
      case "ExcelAdjustmentImport":
        return "adjustment"
      default:
        return null
    }
  }

  const hoveredPrintStatKey = getHoveredPrintStatKey(hoveredPrintJob)

  const isPrintStatHighlighted = (statKey: ExcelPrintStatKey) => {
    return hoveredPrintStatKey === statKey
  }

  const isPrintPagesTotalHighlighted = hoveredPrintStatKey === "bw" || hoveredPrintStatKey === "color"
  const printStatValueClass = (highlighted: boolean) =>
    highlighted ? "text-blue-600 bg-blue-100 rounded px-2 py-1" : "text-black"

  const renderPrintStatValue = (value: string | number, highlighted: boolean, sizeClass = "text-2xl") => (
    <div className={`${sizeClass} font-bold inline-flex items-center justify-center ${printStatValueClass(highlighted)}`}>
      {value}
    </div>
  )

  const renderPrintStatCard = ({
    title,
    subtitle,
    value,
    highlighted = false,
  }: {
    title: string
    subtitle: string
    value: string | number
    highlighted?: boolean
  }) => {
    return (
      <div className="bg-white rounded-lg border-2 border-blue-200 shadow-sm">
        <div className="bg-blue-100 px-4 py-3 border-b-2 border-blue-200">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-blue-700" />
            <h3 className="text-sm font-semibold text-blue-900">{title}</h3>
          </div>
        </div>
        <div className="p-4 text-center">
          <div className="text-sm text-gray-600 mb-2">{subtitle}</div>
          {renderPrintStatValue(value, highlighted)}
        </div>
      </div>
    )
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
          if (roleFilter !== "all" && normalizeUserRoleLabel(teamEntity.userRole) !== roleFilter) {
            return // Skip this team if it doesn't match the role filter
          }

          if (!matchesAdminDebtMembershipFilters(teamEntity)) {
            return
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
          const teamTotalDebt = getDisplayTotalDebt(teamEntity)

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
          const teamComparableDebt = getDebtFilterComparableValue(teamTotalDebt)

          if (priceRange[0] !== 0 || priceRange[1] !== 100) {
            if (teamComparableDebt < priceRange[0] || teamComparableDebt > priceRange[1]) {
              return // Skip this team if it doesn't match the price range filter
            }
          }

          // Find the latest income date for this team
          const teamIncome = timelineIncome.filter(inc => inc.uid === teamEntity.uid)
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
          normalizeGreek(normalizeUserRoleLabel(userData.userRole)).includes(norm) ||
          normalizeGreek(responsiblePerson).includes(norm);
        if (!matchesSearch) return
      }

      // Apply role filter
      if (roleFilter !== "all" && normalizeUserRoleLabel(userData.userRole) !== roleFilter) {
        return
      }

      if (!matchesAdminDebtMembershipFilters(userData)) {
        return
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

        if (isManagedEntityRole(userData.userRole)) {
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
      } else if (isManagedEntityRole(userData.userRole)) {
        const responsibleUsers = getDynamicResponsiblePersons(userData)
        responsiblePerson = responsibleUsers.length > 0 ? responsibleUsers.join(", ") : "Δεν έχει ανατεθεί Υπεύθυνος"
      } else {
        // For any other cases, show the default message
        responsiblePerson = "Δεν έχει ανατεθεί Υπεύθυνος"
      }

      const printDebt = userData.printDebt || 0
      const laminationDebt = userData.laminationDebt || 0
      const totalDebt = getDisplayTotalDebt(userData)

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
      const comparableDebt = getDebtFilterComparableValue(totalDebt)

      if (priceRange[0] !== 0 || priceRange[1] !== 100) {
        if (comparableDebt < priceRange[0] || comparableDebt > priceRange[1]) {
          return // Skip this user if it doesn't match the price range filter
        }
      }

      // Use precomputed lastPayment on user when available to avoid recomputing per visit
      const latestUserIncome = (userData as any).lastPayment ? new Date((userData as any).lastPayment) : null

      // Add user to the map
      userDebtMap.set(userData.uid, {
        uid: userData.uid,
        userDisplayName: userData.displayName,
        userRole: normalizeUserRoleLabel(userData.userRole),
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

            {/* Add Refresh Button */}
            <div className="mb-6 flex justify-end gap-3">
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                size="sm"
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                title="Ανανέωση δεδομένων"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Ανανέωση δεδομένων
              </Button>
            </div>

            <ExcelPeriodTimeline
              stops={timelineStops}
              startIndex={normalizedTimelineStartIndex}
              endIndex={normalizedTimelineEndIndex}
              onRangeChange={({ startIndex, endIndex }) => {
                const nextStart = timelineStops[startIndex]
                const nextEnd = timelineStops[endIndex]
                if (!nextStart || !nextEnd) return
                setTimelineStartPeriodKey(nextStart.periodKey)
                setTimelineEndPeriodKey(nextEnd.periodKey)
              }}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Debts Card - Yellow Theme */}
              <div className="bg-white rounded-lg border-2 border-yellow-200 shadow-sm h-full overflow-hidden">
                <div className="bg-yellow-100 px-6 py-4 border-b-2 border-yellow-200">
                  <div className="flex items-center justify-between">
                    <Receipt className="h-6 w-6 text-yellow-700" />
                    <div className="text-center flex-1">
                      <div className="text-lg font-semibold text-yellow-900">ΣΥΝΟΛΟ</div>
                      <div className="text-sm font-medium text-yellow-800">{summaryCardLabel}</div>
                    </div>
                    {showBankResetActions && (
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
                    <div
                      className={`summary-debt-stroke text-3xl font-bold ${
                        totalCurrentDebt > 0
                          ? "summary-debt-stroke-red text-red-600"
                          : "summary-debt-stroke-green text-green-600"
                      }`}
                    >
                      {formatBalance(totalCurrentDebt)}
                    </div>
                    {user.accessLevel === "Διαχειριστής" && (
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(totalBank)}
                      </div>
                    )}
                  </div>
                  {hasFilters && totalChargedPercentage < 100 && user.accessLevel === "Διαχειριστής" && (
                    <div className="text-sm text-gray-500 mt-3">({totalChargedPercentage.toFixed(1)}% του {formatPrice(totalCombinedCharged)})</div>
                  )}
                </div>
              </div>

              {/* Print Debts Card - Blue Theme */}
              <div className="bg-white rounded-lg border-2 border-blue-200 shadow-sm h-full overflow-hidden">
                <div className="bg-blue-100 px-6 py-4 border-b-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <Printer className="h-6 w-6 text-blue-700" />
                    <div className="text-center flex-1">
                      <div className="text-lg font-semibold text-blue-900">ΤΟ. ΦΩ.</div>
                      <div className="text-sm font-medium text-blue-800">{summaryCardLabel}</div>
                    </div>
                    {showBankResetActions && (
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
                    <div
                      className={`summary-debt-stroke text-3xl font-bold ${
                        printCurrentDebt > 0
                          ? "summary-debt-stroke-red text-red-600"
                          : "summary-debt-stroke-green text-green-600"
                      }`}
                    >
                      {formatBalance(printCurrentDebt)}
                    </div>
                    {user.accessLevel === "Διαχειριστής" && (
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(printBank)}
                      </div>
                    )}
                  </div>
                  {hasFilters && printChargedPercentage < 100 && user.accessLevel === "Διαχειριστής" && (
                    <div className="text-sm text-gray-500 mt-3">({printChargedPercentage.toFixed(1)}% του {formatPrice(totalPrintCharged)})</div>
                  )}
                </div>
              </div>

              {/* Lamination Debts Card - Green Theme */}
              <div className="bg-white rounded-lg border-2 border-green-200 shadow-sm h-full overflow-hidden">
                <div className="bg-green-100 px-6 py-4 border-b-2 border-green-200">
                  <div className="flex items-center justify-between">
                    <CreditCard className="h-6 w-6 text-green-700" />
                    <div className="text-center flex-1">
                      <div className="text-lg font-semibold text-green-900">ΠΛΑ. ΤΟ.</div>
                      <div className="text-sm font-medium text-green-800">{summaryCardLabel}</div>
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
                    <div
                      className={`summary-debt-stroke text-3xl font-bold ${
                        laminationCurrentDebt > 0
                          ? "summary-debt-stroke-red text-red-600"
                          : "summary-debt-stroke-green text-green-600"
                      }`}
                    >
                      {formatBalance(laminationCurrentDebt)}
                    </div>
                    {user.accessLevel === "Διαχειριστής" && (
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(laminationBank)}
                      </div>
                    )}
                  </div>
                  {hasFilters && laminationChargedPercentage < 100 && user.accessLevel === "Διαχειριστής" && (
                    <div className="text-sm text-gray-500 mt-3">({laminationChargedPercentage.toFixed(1)}% του {formatPrice(totalLaminationCharged)})</div>
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
                    groupFilter={groupFilter}
                    setGroupFilter={setGroupFilter}
                    sectorFilter={sectorFilter}
                    setSectorFilter={setSectorFilter}
                    naosFilter={naosFilter}
                    setNaosFilter={setNaosFilter}
                    responsibleForFilter={responsibleForFilter}
                    setResponsibleForFilter={setResponsibleForFilter}
                    priceDistribution={{ min: 0, max: 100 }}
                    users={timelineUsers}
                    clearFilters={clearFilters}
                    combinedDebtData={combinedDebtData}
                    resetDebtPage={() => setDebtPage(1)}
                  />
                </div>
              </div>

              {/* Right Column: Debt Table */}
              <div className="lg:col-span-3">
                {/* Consolidated Table Card */}
                <div className="bg-white rounded-lg border-2 border-yellow-200 shadow-sm overflow-hidden h-full flex flex-col">
                  <div className="bg-yellow-100 px-6 py-4 border-b-2 border-yellow-200 flex-shrink-0">
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
                    incomeData={timelineIncome}
                    users={timelineUsers}
                    clearIncomeFilters={clearIncomeFilters}
                    resetIncomePage={() => setIncomePage(1)}
                  />
                </div>
              </div>

              {/* Right Column: Income Table */}
              <div className="lg:col-span-3">
                {/* Income Table Card */}
                <div className="bg-white rounded-lg border-2 border-yellow-200 shadow-sm overflow-hidden h-full flex flex-col">
                  <div className="bg-yellow-100 px-6 py-4 border-b-2 border-yellow-200 flex-shrink-0">
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
                    <div className="rounded-lg">
                      {/* Print Jobs Table */}
                      <div className="bg-white rounded-lg border-2 border-blue-200 shadow-sm overflow-hidden">
                        <div className="bg-blue-100 px-6 py-4 border-b-2 border-blue-200">
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {renderPrintStatCard({
                      title: "Excel Ασπρόμαυρο",
                      subtitle: "A4 Ασπρόμαυρο",
                      value: printStats.bwPages,
                      highlighted: isPrintStatHighlighted("bw"),
                    })}
                    {renderPrintStatCard({
                      title: "Excel Έγχρωμο",
                      subtitle: "A4 Έγχρωμο",
                      value: printStats.colorPages,
                      highlighted: isPrintStatHighlighted("color"),
                    })}
                    {renderPrintStatCard({
                      title: "Προσαρμογή Excel",
                      subtitle: "Χρέωση από Excel",
                      value: formatPrice(printStats.adjustmentCost),
                      highlighted: isPrintStatHighlighted("adjustment"),
                    })}
                    <div className="bg-white rounded-lg border-2 border-blue-200 shadow-sm">
                      <div className="bg-blue-100 px-4 py-3 border-b-2 border-blue-200">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-blue-700" />
                          <h3 className="text-sm font-semibold text-blue-900">Σύνολο Σελίδων</h3>
                        </div>
                      </div>
                      <div className="p-4 text-center">
                        <div className="text-sm text-gray-600 mb-2">Μόνο από εισαγωγές Excel</div>
                        {renderPrintStatValue(printStats.totalPages, isPrintPagesTotalHighlighted)}
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
                    <div className="rounded-lg">
                      {/* Lamination Jobs Table */}
                      <div className="bg-white rounded-lg border-2 border-green-200 shadow-sm overflow-hidden">
                        <div className="bg-green-100 px-6 py-4 border-b-2 border-green-200">
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
                    <div className="bg-white rounded-lg border-2 border-green-200 shadow-sm overflow-hidden">
                      <div className="bg-green-100 px-4 py-3 border-b-2 border-green-200">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-green-700" />
                          <h3 className="text-sm font-semibold text-green-900">Πλαστικοποιητής</h3>
                        </div>
                      </div>
                      <div className="bg-white p-4">
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div>
                            <div className="text-xs text-gray-600">Α3</div>
                            <div className={`text-lg font-bold ${isLaminationStatHighlighted("laminator", "A3")
                              ? "text-green-600 bg-green-100 rounded px-1"
                              : "text-gray-900"
                              }`}>
                              {laminationStats.laminator.a3}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Α4</div>
                            <div className={`text-lg font-bold ${isLaminationStatHighlighted("laminator", "A4")
                              ? "text-green-600 bg-green-100 rounded px-1"
                              : "text-gray-900"
                              }`}>
                              {laminationStats.laminator.a4}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Α5</div>
                            <div className={`text-lg font-bold ${isLaminationStatHighlighted("laminator", "A5")
                              ? "text-green-600 bg-green-100 rounded px-1"
                              : "text-gray-900"
                              }`}>
                              {laminationStats.laminator.a5}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Κάρτες</div>
                            <div className={`text-lg font-bold ${isLaminationStatHighlighted("laminator", "cards")
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
                    <div className="bg-white rounded-lg border-2 border-green-200 shadow-sm overflow-hidden">
                      <div className="bg-green-100 px-4 py-3 border-b-2 border-green-200">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-green-700" />
                          <h3 className="text-sm font-semibold text-green-900">Βιβλιοδεσία</h3>
                        </div>
                      </div>
                      <div className="bg-white p-4">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-xs text-gray-600">Σπιράλ</div>
                            <div className={`text-lg font-bold ${isLaminationStatHighlighted("binding", "spiral")
                              ? "text-green-600 bg-green-100 rounded px-1"
                              : "text-gray-900"
                              }`}>
                              {laminationStats.binding.spiral}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Χρωματιστά Χαρτόνια</div>
                            <div className={`text-lg font-bold ${isLaminationStatHighlighted("binding", "colored_cardboard")
                              ? "text-green-600 bg-green-100 rounded px-1"
                              : "text-gray-900"
                              }`}>
                              {laminationStats.binding.coloredCardboard}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600">Πλαστικό Κάλυμμα</div>
                            <div className={`text-lg font-bold ${isLaminationStatHighlighted("binding", "plastic_cover")
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
