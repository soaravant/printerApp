"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  Upload,
  X,
} from "lucide-react"

import type { ExcelImportPlan, ParsedExcelImportResult, ParsedPhotocopierWorkbook } from "@/lib/excel-import"
import {
  buildExcelImportPlan,
  parseExcelImportFiles,
  parsePhotocopierWorkbook,
} from "@/lib/excel-import"
import { auth } from "@/lib/firebase-app"
import type { FirebaseExcelImportRunSummary, FirebaseUser } from "@/lib/firebase-schema"
import { useAuth } from "@/lib/auth-context"
import { useRefresh } from "@/lib/refresh-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Step = 1 | 2 | 3 | 4
type SyncStage = "idle" | "creating_jobs" | "updating_users" | "done" | "error"

const STEP_LABELS: Array<{ step: Step; title: string; subtitle: string }> = [
  { step: 1, title: "Φωτοτυπικό", subtitle: "ΦΩΤΟΤΥΠΙΚΟ.xlsx" },
  { step: 2, title: "Πλαστικοποιητής", subtitle: "ΠΛΑΣΤΙΚΟΠΟΙΗΤΗΣ.xlsx" },
  { step: 3, title: "Προεπισκόπηση", subtitle: "Έλεγχος & συγχώνευση" },
  { step: 4, title: "Συγχρονισμός", subtitle: "Εγγραφή στο Firebase" },
]

function formatMoney(value: number) {
  return `€${value.toFixed(2).replace(".", ",")}`
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string" && message.trim().length > 0) {
      return message
    }
  }
  return fallback
}

function formatServerDate(value: unknown) {
  if (!value) return "-"
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value).toLocaleString("el-GR")
  }
  if (typeof value === "object" && value !== null) {
    const maybeSeconds = Number((value as { _seconds?: number })._seconds)
    if (Number.isFinite(maybeSeconds)) {
      return new Date(maybeSeconds * 1000).toLocaleString("el-GR")
    }
  }
  return "-"
}

function syncStageLabel(stage: SyncStage) {
  switch (stage) {
    case "creating_jobs":
      return "Δημιουργία synthetic jobs"
    case "updating_users":
      return "Ενημέρωση χρηστών και refresh dashboard"
    case "done":
      return "Ολοκληρώθηκε"
    case "error":
      return "Αποτυχία"
    default:
      return "Έτοιμο"
  }
}

async function getAdminToken() {
  const token = await auth.currentUser?.getIdToken()
  if (!token) {
    throw new Error("Δεν βρέθηκε ενεργό session διαχειριστή.")
  }
  return token
}

async function validateFileExtension(file: File) {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("Υποστηρίζονται μόνο αρχεία .xlsx.")
  }
}

export function ExcelImportWizard({
  open,
  onOpenChange,
  onImportCompleted,
  users,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportCompleted?: (importRun: FirebaseExcelImportRunSummary) => void
  users: FirebaseUser[]
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { triggerRefresh } = useRefresh()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [laminationFile, setLaminationFile] = useState<File | null>(null)
  const [photoValidation, setPhotoValidation] = useState<ParsedPhotocopierWorkbook | null>(null)
  const [importPreview, setImportPreview] = useState<ParsedExcelImportResult | null>(null)
  const [allowCreateUsers, setAllowCreateUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [syncStage, setSyncStage] = useState<SyncStage>("idle")
  const [importRun, setImportRun] = useState<FirebaseExcelImportRunSummary | null>(null)
  const [latestImport, setLatestImport] = useState<FirebaseExcelImportRunSummary | null>(null)
  const [rollbackCandidateImport, setRollbackCandidateImport] = useState<FirebaseExcelImportRunSummary | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const laminationInputRef = useRef<HTMLInputElement>(null)
  const autoCloseTimerRef = useRef<number | null>(null)

  const plan: ExcelImportPlan | null = useMemo(() => {
    if (!importPreview) return null
    return buildExcelImportPlan(importPreview, users, {
      allowCreateUsers,
      latestCompletedImportPeriodKey: rollbackCandidateImport?.periodKey ?? null,
    })
  }, [allowCreateUsers, importPreview, rollbackCandidateImport?.periodKey, users])

  const displayedImport = rollbackCandidateImport ?? latestImport
  const latestRolledBackImport =
    latestImport?.status === "rolled_back" &&
    latestImport.importId !== rollbackCandidateImport?.importId
      ? latestImport
      : null

  const resetWizard = () => {
    setCurrentStep(1)
    setPhotoFile(null)
    setLaminationFile(null)
    setPhotoValidation(null)
    setImportPreview(null)
    setAllowCreateUsers(false)
    setError(null)
    setIsParsing(false)
    setIsImporting(false)
    setIsRollingBack(false)
    setSyncStage("idle")
    setImportRun(null)
  }

  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        window.clearTimeout(autoCloseTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!open || user?.accessLevel !== "Διαχειριστής") return

    let cancelled = false
    ;(async () => {
      try {
        const token = await getAdminToken()
        const response = await fetch("/api/import/excel", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const payload = await response.json()
        if (!response.ok) {
          throw new Error(payload.error || "Αποτυχία φόρτωσης ιστορικού εισαγωγών.")
        }
        if (!cancelled) {
          setLatestImport(payload.latestImport || null)
          setRollbackCandidateImport(payload.rollbackCandidateImport || null)
        }
      } catch (requestError: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(requestError, "Αποτυχία φόρτωσης ιστορικού εισαγωγών."))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, user?.accessLevel])

  const handleClose = (nextOpen: boolean) => {
    if (isImporting || isRollingBack) return
    if (!nextOpen) {
      if (autoCloseTimerRef.current) {
        window.clearTimeout(autoCloseTimerRef.current)
      }
      window.setTimeout(resetWizard, 250)
    }
    onOpenChange(nextOpen)
  }

  const refreshDashboardState = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["users"] }),
      queryClient.invalidateQueries({ queryKey: ["printJobs"] }),
      queryClient.invalidateQueries({ queryKey: ["laminationJobs"] }),
      queryClient.invalidateQueries({ queryKey: ["income"] }),
      queryClient.invalidateQueries({ queryKey: ["bankTotals"] }),
      queryClient.invalidateQueries({ queryKey: ["excelImports"] }),
    ])
    triggerRefresh()
    router.refresh()
  }

  const handlePhotoSelection = async (file: File | null) => {
    if (!file) return

    setIsParsing(true)
    setError(null)
    try {
      await validateFileExtension(file)
      const preview = parsePhotocopierWorkbook(await file.arrayBuffer())
      if (preview.errors.length > 0) {
        throw new Error(preview.errors.join(" "))
      }
      setPhotoFile(file)
      setPhotoValidation(preview)
      setLaminationFile(null)
      setImportPreview(null)
      setAllowCreateUsers(false)
    } catch (selectionError: unknown) {
      setError(getErrorMessage(selectionError, "Το αρχείο του φωτοτυπικού δεν είναι έγκυρο."))
      setPhotoFile(null)
      setPhotoValidation(null)
      setLaminationFile(null)
      setImportPreview(null)
    } finally {
      setIsParsing(false)
    }
  }

  const handleLaminationSelection = async (file: File | null) => {
    if (!file || !photoFile) return

    setIsParsing(true)
    setError(null)
    try {
      await validateFileExtension(file)
      const [photoBuffer, laminationBuffer] = await Promise.all([photoFile.arrayBuffer(), file.arrayBuffer()])
      const preview = parseExcelImportFiles(photoBuffer, laminationBuffer)
      if (preview.errors.length > 0) {
        throw new Error(preview.errors.join(" "))
      }
      setLaminationFile(file)
      setImportPreview(preview)
      setAllowCreateUsers(false)
    } catch (selectionError: unknown) {
      setError(getErrorMessage(selectionError, "Το αρχείο του πλαστικοποιητή δεν είναι έγκυρο."))
      setLaminationFile(null)
      setImportPreview(null)
    } finally {
      setIsParsing(false)
    }
  }

  const executeImport = async () => {
    if (!photoFile || !laminationFile || !plan) return

    setCurrentStep(4)
    setIsImporting(true)
    setError(null)
    setSyncStage("creating_jobs")
    try {
      const token = await getAdminToken()
      const formData = new FormData()
      formData.append("photoFile", photoFile)
      formData.append("lamFile", laminationFile)
      formData.append("allowCreateUsers", String(allowCreateUsers))

      const response = await fetch("/api/import/excel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "Η εισαγωγή απέτυχε.")
      }

      setSyncStage("updating_users")
      await refreshDashboardState()
      setImportRun(payload.importRun)
      setLatestImport(payload.latestImport || payload.importRun)
      setRollbackCandidateImport(payload.rollbackCandidateImport || payload.importRun)
      onImportCompleted?.(payload.importRun)
      setSyncStage("done")
      autoCloseTimerRef.current = window.setTimeout(() => {
        handleClose(false)
      }, 3000)
    } catch (requestError: unknown) {
      setSyncStage("error")
      setError(getErrorMessage(requestError, "Η εισαγωγή απέτυχε."))
    } finally {
      setIsImporting(false)
    }
  }

  const handleRollback = async () => {
    if (!rollbackCandidateImport?.importId) return
    setIsRollingBack(true)
    setError(null)
    try {
      const token = await getAdminToken()
      const response = await fetch("/api/import/excel/rollback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ importId: rollbackCandidateImport.importId }),
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "Η αναίρεση απέτυχε.")
      }

      setLatestImport(payload.latestImport || null)
      setRollbackCandidateImport(payload.rollbackCandidateImport || null)
      await refreshDashboardState()
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, "Η αναίρεση απέτυχε."))
    } finally {
      setIsRollingBack(false)
    }
  }

  const nextDisabled = useMemo(() => {
    if (isParsing || isImporting || isRollingBack) return true
    if (currentStep === 1) return !photoValidation || !photoFile
    if (currentStep === 2) return !importPreview || !laminationFile
    if (currentStep === 3) return !plan || plan.blockingErrors.length > 0 || users.length === 0
    return true
  }, [currentStep, importPreview, isImporting, isParsing, isRollingBack, laminationFile, photoFile, photoValidation, plan, users.length])

  const previousDisabled = isImporting || isRollingBack

  const goNext = async () => {
    if (currentStep === 3) {
      await executeImport()
      return
    }
    setError(null)
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step)
    }
  }

  const goPrevious = () => {
    setError(null)
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    }
  }

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
    kind: "photo" | "lamination"
  ) => {
    const file = event.target.files?.[0] ?? null
    if (kind === "photo") {
      await handlePhotoSelection(file)
      return
    }
    await handleLaminationSelection(file)
  }

  const handleDrop = async (
    event: DragEvent<HTMLDivElement>,
    kind: "photo" | "lamination"
  ) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0] ?? null
    if (kind === "photo") {
      await handlePhotoSelection(file)
      return
    }
    await handleLaminationSelection(file)
  }

  if (user?.accessLevel !== "Διαχειριστής") return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Οδηγός Εισαγωγής Excel</DialogTitle>
          <DialogDescription>
            Η πρώτη εισαγωγή αρχικοποιεί opening balances. Οι επόμενες περίοδοι προσθέτουν μόνο synthetic jobs ώστε να
            διατηρείται σωστό ιστορικό χρεών.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-4 gap-3">
            {STEP_LABELS.map((item) => {
              const isActive = currentStep === item.step
              const isComplete = currentStep > item.step || (item.step === 4 && syncStage === "done")
              return (
                <div key={item.step} className="flex items-center gap-3 rounded-xl border bg-slate-50/70 px-3 py-3">
                  <div
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold",
                      isComplete ? "border-emerald-500 bg-emerald-500 text-white" : "",
                      isActive && !isComplete ? "border-blue-600 bg-blue-600 text-white" : "",
                      !isActive && !isComplete ? "border-slate-200 bg-white text-slate-500" : "",
                    ].join(" ")}
                  >
                    {isComplete ? <CheckCircle2 className="h-5 w-5" /> : item.step}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                    <div className="truncate text-xs text-slate-500">{item.subtitle}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {displayedImport && (
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-amber-900">
                  {rollbackCandidateImport ? "Τελευταία ενεργή εισαγωγή Excel" : "Τελευταία εισαγωγή Excel"}
                </div>
                <div className="text-xs text-amber-800">
                  Περίοδος {displayedImport.periodLabel} • {displayedImport.rowCount} γραμμές •{" "}
                  {formatServerDate(displayedImport.createdAt)}
                </div>
                <div className="text-xs text-amber-700">
                  Κατάσταση:{" "}
                  {displayedImport.status === "rolled_back"
                    ? "Αναιρέθηκε"
                    : displayedImport.status === "completed"
                      ? "Ολοκληρώθηκε"
                      : displayedImport.status}
                </div>
                {latestRolledBackImport && (
                  <div className="text-xs text-amber-700">
                    Τελευταία ενέργεια: {latestRolledBackImport.periodLabel} • Κατάσταση: Αναιρέθηκε
                  </div>
                )}
              </div>
              {rollbackCandidateImport?.status === "completed" && !rollbackCandidateImport.rolledBackAt && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-amber-300 bg-white text-amber-900" disabled={isRollingBack || isImporting}>
                      {isRollingBack ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                      Αναίρεση τελευταίας εισαγωγής
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Αναίρεση τελευταίας εισαγωγής</AlertDialogTitle>
                      <AlertDialogDescription>
                        Η αναίρεση θα αφαιρέσει τα synthetic jobs της πιο πρόσφατης εισαγωγής και θα επαναφέρει τα opening balances.
                        Θα απορριφθεί αν επιχειρήσετε να αναιρέσετε παλαιότερη εισαγωγή.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isRollingBack}>Ακύρωση</AlertDialogCancel>
                      <AlertDialogAction disabled={isRollingBack} onClick={handleRollback}>
                        {isRollingBack && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Αναίρεση
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
              <div
                onClick={() => photoInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => void handleDrop(event, "photo")}
                className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 px-6 py-10 text-center"
              >
                <input
                  ref={photoInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(event) => void handleFileChange(event, "photo")}
                />
                <Upload className="mb-4 h-10 w-10 text-blue-600" />
                <div className="text-lg font-semibold text-blue-900">Ανεβάστε το ΦΩΤΟΤΥΠΙΚΟ.xlsx</div>
                <div className="mt-2 max-w-md text-sm text-blue-800">
                  Ελέγχονται οι κεφαλίδες, οι τύποι των στηλών B/C/D/L/M και η περίοδος χρεώσεων πριν ενεργοποιηθεί το επόμενο βήμα.
                </div>
                {photoFile && (
                  <div className="mt-6 flex items-center gap-3 rounded-xl border border-blue-200 bg-white px-4 py-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-slate-900">{photoFile.name}</div>
                      <div className="text-xs text-slate-500">{(photoFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation()
                        setPhotoFile(null)
                        setPhotoValidation(null)
                        setImportPreview(null)
                        setLaminationFile(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="mb-4 text-sm font-semibold text-slate-900">Έλεγχος βήματος</div>
                {isParsing && !photoValidation ? (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Έλεγχος workbook...
                  </div>
                ) : photoValidation ? (
                  <div className="space-y-3 text-sm">
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <div className="text-slate-500">Περίοδος</div>
                      <div className="font-semibold text-slate-900">{photoValidation.period.label}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <div className="text-slate-500">Κωδικοποιημένες γραμμές</div>
                      <div className="font-semibold text-slate-900">{photoValidation.rows.length}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <div className="text-slate-500">Νέες εκτυπωτικές χρεώσεις</div>
                      <div className="font-semibold text-slate-900">{formatMoney(photoValidation.totals.newPrintCharge)}</div>
                    </div>
                    {photoValidation.warnings.length > 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                        {photoValidation.warnings.join(" ")}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Δεν έχει φορτωθεί ακόμα το πρώτο Excel.
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
              <div
                onClick={() => laminationInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => void handleDrop(event, "lamination")}
                className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 px-6 py-10 text-center"
              >
                <input
                  ref={laminationInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(event) => void handleFileChange(event, "lamination")}
                />
                <Upload className="mb-4 h-10 w-10 text-emerald-600" />
                <div className="text-lg font-semibold text-emerald-900">Ανεβάστε το ΠΛΑΣΤΙΚΟΠΟΙΗΤΗΣ.xlsx</div>
                <div className="mt-2 max-w-md text-sm text-emerald-800">
                  Ελέγχονται οι στήλες B/C/D/E/F και η ευθυγράμμιση με τις κωδικοποιημένες γραμμές του φωτοτυπικού.
                </div>
                {laminationFile && (
                  <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-slate-900">{laminationFile.name}</div>
                      <div className="text-xs text-slate-500">{(laminationFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation()
                        setLaminationFile(null)
                        setImportPreview(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border bg-white p-5">
                <div className="mb-4 text-sm font-semibold text-slate-900">Έλεγχος βήματος</div>
                {isParsing && !importPreview ? (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Έλεγχος συνδυασμού αρχείων...
                  </div>
                ) : importPreview ? (
                  <div className="space-y-3 text-sm">
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <div className="text-slate-500">Ευθυγραμμισμένες γραμμές</div>
                      <div className="font-semibold text-slate-900">{importPreview.rows.length}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                      <div className="text-slate-500">Νέες χρεώσεις πλαστικοποιητή</div>
                      <div className="font-semibold text-slate-900">{formatMoney(importPreview.totals.newLaminationCharge)}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
                      Η εισαγωγή θα χρησιμοποιήσει ως primary key το code του φωτοτυπικού και θα αντιστοιχίσει τις γραμμές του πλαστικοποιητή
                      με το ίδιο row number.
                    </div>
                    {importPreview.warnings.length > 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                        {importPreview.warnings.join(" ")}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Περιμένει το δεύτερο Excel για έλεγχο συγχώνευσης.
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && plan && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border bg-white px-4 py-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Εισαγώγιμες γραμμές</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{plan.totals.importableRows}</div>
                </div>
                <div className="rounded-2xl border bg-white px-4 py-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Άγνωστοι χρήστες</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{plan.totals.missingUsers}</div>
                </div>
                <div className="rounded-2xl border bg-white px-4 py-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Νέες εκτυπωτικές χρεώσεις</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{formatMoney(plan.totals.newPrintCharge)}</div>
                </div>
                <div className="rounded-2xl border bg-white px-4 py-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Νέες χρεώσεις πλαστικοποιητή</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{formatMoney(plan.totals.newLaminationCharge)}</div>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl border bg-white px-4 py-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-900">Πολιτική για missing users</div>
                  <div className="text-sm text-slate-600">
                    Αν κάποιο code δεν υπάρχει στη βάση, μπορείτε να επιλέξετε αν θα δημιουργηθεί νέος χρήστης με username το code του Excel.
                  </div>
                  <label className="flex items-center gap-3 text-sm text-slate-900">
                    <input
                      type="checkbox"
                      checked={allowCreateUsers}
                      onChange={(event) => setAllowCreateUsers(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Δημιουργία άγνωστων χρηστών κατά την εισαγωγή
                  </label>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <div>Excel τελικό σύνολο: {formatMoney(plan.totals.finalExcelDebt)}</div>
                  <div>Υπολογισμένο σύνολο: {formatMoney(plan.totals.computedFinalDebt)}</div>
                </div>
              </div>

              {plan.blockingErrors.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {plan.blockingErrors.join(" ")}
                </div>
              )}

              <div className="max-h-[360px] overflow-auto rounded-2xl border bg-white">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-100">
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>DB Όνομα</TableHead>
                      <TableHead>Παλιό Χρέος</TableHead>
                      <TableHead>Νέα Περίοδος</TableHead>
                      <TableHead>Τελικό Υπολογισμένο</TableHead>
                      <TableHead>Τελικό Excel</TableHead>
                      <TableHead>Κατάσταση</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plan.rows.map((row) => {
                      const hasBlockingIssue = row.warnings.some((warning) => warning.severity === "error")
                      const hasWarning = row.warnings.length > 0
                      const rowClassName = hasBlockingIssue
                        ? "bg-red-50"
                        : hasWarning
                          ? "bg-amber-50"
                          : ""
                      return (
                        <TableRow key={row.code} className={rowClassName}>
                          <TableCell className="font-medium">{row.code}</TableCell>
                          <TableCell>
                            <div>{row.dbUserName}</div>
                            <div className="text-xs text-slate-500">{row.excelName}</div>
                          </TableCell>
                          <TableCell>
                            <div>{formatMoney(row.oldPrintDebt)}</div>
                            <div className="text-xs text-slate-500">Πλαστ.: {formatMoney(row.oldLaminationDebt)}</div>
                          </TableCell>
                          <TableCell>
                            <div>{formatMoney(row.newPrintCharge)}</div>
                            <div className="text-xs text-slate-500">Πλαστ.: {formatMoney(row.newLaminationCharge)}</div>
                          </TableCell>
                          <TableCell>{formatMoney(row.computedFinalTotalDebt)}</TableCell>
                          <TableCell>{formatMoney(row.finalExcelTotalDebt)}</TableCell>
                          <TableCell>
                            <div className={row.canImport ? "text-emerald-700" : "text-red-700"}>
                              {row.canImport ? "Έτοιμο" : "Μπλοκαρισμένο"}
                            </div>
                            {row.warnings.map((warning, index) => (
                              <div key={`${row.code}-${warning.code}-${index}`} className="text-xs text-slate-600">
                                {warning.message}
                              </div>
                            ))}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-5 rounded-2xl border bg-white p-6">
              {syncStage === "done" && importRun ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-slate-900">Η εισαγωγή ολοκληρώθηκε</div>
                    <div className="mt-2 text-sm text-slate-600">
                      Περίοδος {importRun.periodLabel}. Το modal θα κλείσει αυτόματα σε 3 δευτερόλεπτα.
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="text-lg font-semibold text-slate-900">Συγχρονισμός με Firebase</div>
                    <div className="text-sm text-slate-600">
                      Μην κλείσετε το tab όσο εκτελείται η εισαγωγή. Αν υπάρξει timeout ή disconnect, η διαδικασία μπορεί να ξαναδοκιμαστεί χωρίς διπλοχρέωση.
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(["creating_jobs", "updating_users"] as SyncStage[]).map((stage) => {
                      const isActive = syncStage === stage
                      const isComplete = syncStage === "done" || (syncStage === "updating_users" && stage === "creating_jobs")
                      return (
                        <div key={stage} className="flex items-center gap-3 rounded-xl border bg-slate-50 px-4 py-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                            {isComplete ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            ) : isActive ? (
                              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                            ) : (
                              <ShieldAlert className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{syncStageLabel(stage)}</div>
                            <div className="text-sm text-slate-500">
                              {stage === "creating_jobs"
                                ? "Εφαρμογή deterministic synthetic jobs και rollback metadata."
                                : "Επανυπολογισμός χρηστών και invalidation cache dashboard."}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {syncStage === "error" && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      Η εισαγωγή δεν ολοκληρώθηκε. Τα εγγεγραμμένα βήματα έχουν γίνει compensate αυτόματα όπου χρειάστηκε.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex w-full items-center justify-between sm:justify-between">
          <div>
            {currentStep > 1 && currentStep < 4 && (
              <Button variant="outline" onClick={goPrevious} disabled={previousDisabled}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Πίσω
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => handleClose(false)} disabled={isImporting || isRollingBack}>
              Κλείσιμο
            </Button>
            {currentStep < 4 && (
              <Button onClick={() => void goNext()} disabled={nextDisabled}>
                {currentStep === 3 ? "Εισαγωγή" : "Επόμενο"}
                {currentStep === 3 ? <CheckCircle2 className="ml-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
