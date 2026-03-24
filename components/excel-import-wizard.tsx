"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
  Undo2,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Step = 1 | 2 | 3
type SyncStage = "idle" | "creating_jobs" | "updating_users" | "done" | "error"

const STEP_LABELS: Array<{ step: Step; title: string }> = [
  { step: 1, title: "Εισαγωγή" },
  { step: 2, title: "Έλεγχος" },
  { step: 3, title: "Ανέβασμα" },
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
      return "Καταχώρηση χρεώσεων"
    case "updating_users":
      return "Ενημέρωση χρηστών"
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
  onImportCompleted,
  users,
}: {
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
  const [hasUploadBeenTriggered, setHasUploadBeenTriggered] = useState(false)
  const [importRun, setImportRun] = useState<FirebaseExcelImportRunSummary | null>(null)
  const [latestImport, setLatestImport] = useState<FirebaseExcelImportRunSummary | null>(null)
  const [rollbackCandidateImport, setRollbackCandidateImport] = useState<FirebaseExcelImportRunSummary | null>(null)
  const [completedImportPeriods, setCompletedImportPeriods] = useState<string[]>([])
  const photoInputRef = useRef<HTMLInputElement>(null)
  const laminationInputRef = useRef<HTMLInputElement>(null)

  const plan: ExcelImportPlan | null = useMemo(() => {
    if (!importPreview) return null
    return buildExcelImportPlan(importPreview, users, {
      allowCreateUsers,
      latestCompletedImportPeriodKey: rollbackCandidateImport?.periodKey ?? null,
      completedImportPeriodKeys: completedImportPeriods,
    })
  }, [allowCreateUsers, completedImportPeriods, importPreview, rollbackCandidateImport?.periodKey, users])

  const displayedImport = rollbackCandidateImport ?? latestImport
  const hasExistingImportForSelectedPeriod = photoValidation
    ? completedImportPeriods.includes(photoValidation.period.key)
    : false
  const latestRolledBackImport =
    latestImport?.status === "rolled_back" &&
    latestImport.importId !== rollbackCandidateImport?.importId
      ? latestImport
      : null
  const canRollbackLatestImport =
    rollbackCandidateImport?.status === "completed" && !rollbackCandidateImport.rolledBackAt

  const applyImportState = (payload: {
    latestImport?: FirebaseExcelImportRunSummary | null
    rollbackCandidateImport?: FirebaseExcelImportRunSummary | null
    completedImportPeriods?: string[]
  }) => {
    setLatestImport(payload.latestImport || null)
    setRollbackCandidateImport(payload.rollbackCandidateImport || null)
    setCompletedImportPeriods(payload.completedImportPeriods || [])
  }

  const fetchImportState = async () => {
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
    return payload as {
      latestImport?: FirebaseExcelImportRunSummary | null
      rollbackCandidateImport?: FirebaseExcelImportRunSummary | null
      completedImportPeriods?: string[]
    }
  }

  const resetWizard = () => {
    if (photoInputRef.current) {
      photoInputRef.current.value = ""
    }
    if (laminationInputRef.current) {
      laminationInputRef.current.value = ""
    }
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
    setHasUploadBeenTriggered(false)
    setImportRun(null)
  }

  useEffect(() => {
    if (user?.accessLevel !== "Διαχειριστής") return

    let cancelled = false
    ;(async () => {
      try {
        const payload = await fetchImportState()
        if (!cancelled) {
          applyImportState(payload)
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
  }, [user?.accessLevel])

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
      setHasUploadBeenTriggered(false)
      setSyncStage("idle")
      setImportRun(null)
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
      setHasUploadBeenTriggered(false)
      setSyncStage("idle")
      setImportRun(null)
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

    setCurrentStep(3)
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
      applyImportState({
        latestImport: payload.latestImport || payload.importRun,
        rollbackCandidateImport: payload.rollbackCandidateImport || payload.importRun,
        completedImportPeriods: Array.from(new Set([...completedImportPeriods, payload.importRun.periodKey])),
      })
      try {
        applyImportState(await fetchImportState())
      } catch {
        // Keep the successful import result even if the follow-up refresh snapshot fails.
      }
      onImportCompleted?.(payload.importRun)
      setSyncStage("done")
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

      applyImportState({
        latestImport: payload.latestImport || null,
        rollbackCandidateImport: payload.rollbackCandidateImport || null,
        completedImportPeriods,
      })
      try {
        applyImportState(await fetchImportState())
      } catch {
        // Keep the immediate rollback result even if the follow-up refresh snapshot fails.
      }
      await refreshDashboardState()
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, "Η αναίρεση απέτυχε."))
    } finally {
      setIsRollingBack(false)
    }
  }

  const isImportStepReady = Boolean(photoValidation && photoFile && importPreview && laminationFile)
  const isUploadStepReady = Boolean(plan && plan.blockingErrors.length === 0 && users.length > 0)
  const hasUploadStarted =
    isImporting || syncStage === "creating_jobs" || syncStage === "updating_users"
  const canStartUpload =
    isUploadStepReady && !isParsing && !isRollingBack && !hasUploadStarted && syncStage !== "done"
  const showUploadProgress = hasUploadBeenTriggered || hasUploadStarted || syncStage === "error"
  const replacementWarnings = useMemo(
    () => plan?.warnings.filter((warning) => warning.includes("θα αντικατασταθούν")) ?? [],
    [plan]
  )
  const reviewPeriodLabel = photoValidation?.period.label ?? "-"
  const reviewPhotoCharges = photoValidation ? formatMoney(photoValidation.totals.newPrintCharge) : "-"
  const reviewLaminationCharges = importPreview ? formatMoney(importPreview.totals.newLaminationCharge) : "-"
  const reviewAlignedRows = importPreview ? String(importPreview.rows.length) : "-"

  const isStepDisabled = (step: Step) => {
    if (step === currentStep) return false
    if (isParsing || isImporting || isRollingBack) return true
    if (step === 1) return false
    if (step === 2) return !isImportStepReady
    return !isUploadStepReady
  }

  const handleStepSelection = (step: Step) => {
    if (step === currentStep || isStepDisabled(step)) return
    setError(null)
    if (step === 1) {
      setCurrentStep(1)
      return
    }
    if (step === 2) {
      setHasUploadBeenTriggered(false)
      setCurrentStep(2)
      return
    }
    if (!isImporting && syncStage !== "done") {
      setHasUploadBeenTriggered(false)
      setSyncStage("idle")
    }
    setCurrentStep(3)
  }

  const handleStartUpload = async () => {
    if (!canStartUpload) return
    setHasUploadBeenTriggered(true)
    await executeImport()
  }

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
    kind: "photo" | "lamination"
  ) => {
    const file = event.target.files?.[0] ?? null
    event.target.value = ""
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
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[28px] border border-amber-200 bg-white shadow-sm">
        <div className="border-b border-amber-200 bg-yellow-100 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-50 p-2">
                <Upload className="h-5 w-5 text-yellow-700" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-yellow-900">Εισαγωγή Excel</h2>
                <p className="text-sm text-yellow-700">Ανεβάστε τα 2 αρχεία και ελέγξτε το αποτέλεσμα.</p>
              </div>
            </div>
            <button
              type="button"
              aria-label={syncStage === "done" ? "Νέα εισαγωγή" : "Επαναφορά εισαγωγής"}
              title={syncStage === "done" ? "Νέα εισαγωγή" : "Επαναφορά εισαγωγής"}
              className="rounded-full border border-yellow-300 bg-white p-2 transition hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={resetWizard}
              disabled={isImporting || isRollingBack}
            >
              <RotateCcw className="h-4 w-4 text-yellow-600" />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid grid-cols-3 gap-3">
            {STEP_LABELS.map((item) => {
              const isActive = currentStep === item.step
              const isComplete = currentStep > item.step || (item.step === 3 && syncStage === "done")
              const isDisabled = isStepDisabled(item.step)
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => void handleStepSelection(item.step)}
                  disabled={isDisabled}
                  className={[
                    "flex items-center gap-3 rounded-xl border bg-slate-50/70 px-3 py-3 text-left transition",
                    isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-slate-300 hover:bg-slate-50",
                  ].join(" ")}
                >
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
                  </div>
                </button>
              )
            })}
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid items-stretch gap-5 md:grid-cols-[1.2fr_0.8fr]">
              <div className="grid gap-5 md:h-full md:grid-rows-2">
                <div
                  onClick={() => photoInputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => void handleDrop(event, "photo")}
                  className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 px-6 py-6 text-center md:h-full md:min-h-0"
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
                  {isParsing && !photoValidation && <Loader2 className="mt-3 h-5 w-5 animate-spin text-blue-600" />}
                  {photoFile && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-white px-4 py-3">
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
                          if (photoInputRef.current) {
                            photoInputRef.current.value = ""
                          }
                          if (laminationInputRef.current) {
                            laminationInputRef.current.value = ""
                          }
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

                <div
                  onClick={() => {
                    if (!photoValidation) return
                    laminationInputRef.current?.click()
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    if (!photoValidation) return
                    void handleDrop(event, "lamination")
                  }}
                  className={[
                    "flex min-h-[160px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-6 text-center md:h-full md:min-h-0",
                    photoValidation
                      ? "cursor-pointer border-emerald-300 bg-emerald-50"
                      : "cursor-not-allowed border-emerald-200 bg-emerald-50/70 opacity-80",
                  ].join(" ")}
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
                  {isParsing && photoValidation && !importPreview && <Loader2 className="mt-3 h-5 w-5 animate-spin text-emerald-600" />}
                  {laminationFile && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3">
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
                          if (laminationInputRef.current) {
                            laminationInputRef.current.value = ""
                          }
                          setLaminationFile(null)
                          setImportPreview(null)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5 md:h-full">
                <div className="mb-4 text-sm font-semibold text-slate-900">Έλεγχος</div>
                <div className="grid gap-3 text-sm md:h-[calc(100%-2rem)] md:grid-rows-4">
                  <div
                    className={[
                      "flex flex-col justify-center rounded-xl px-4 py-3",
                      hasExistingImportForSelectedPeriod
                        ? "border border-yellow-200 bg-yellow-50"
                        : "bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>Περίοδος</span>
                      {hasExistingImportForSelectedPeriod && (
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label="Προειδοποίηση αντικατάστασης δεδομένων περιόδου"
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-yellow-700 outline-none transition hover:text-yellow-800 focus-visible:ring-2 focus-visible:ring-yellow-300"
                              >
                                <AlertCircle className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[240px] border-yellow-200 bg-yellow-50 text-yellow-950">
                              Υπάρχουν ήδη δεδομένα για αυτή την περίοδο. Αν συνεχίσετε, θα αντικατασταθούν.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="font-semibold text-slate-900">{reviewPeriodLabel}</div>
                  </div>

                  <div className="flex flex-col justify-center rounded-xl bg-slate-50 px-4 py-3">
                    <div className="text-slate-500">Νέες χρεώσεις Φωτοτυπικού</div>
                    <div className="font-semibold text-slate-900">{reviewPhotoCharges}</div>
                  </div>

                  <div className="flex flex-col justify-center rounded-xl bg-slate-50 px-4 py-3">
                    <div className="text-slate-500">Νέες χρεώσεις Πλαστικοποιητή</div>
                    <div className="font-semibold text-slate-900">{reviewLaminationCharges}</div>
                  </div>

                  <div className="flex flex-col justify-center rounded-xl bg-slate-50 px-4 py-3">
                    <div className="text-slate-500">Νέα δεδομένα</div>
                    <div className="font-semibold text-slate-900">{reviewAlignedRows}</div>
                  </div>
                </div>

                {(photoValidation?.warnings.length || importPreview?.warnings.length) ? (
                  <div className="mt-3 space-y-3 text-sm">
                    {photoValidation?.warnings.length ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                        {photoValidation.warnings.join(" ")}
                      </div>
                    ) : null}
                    {importPreview?.warnings.length ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                        {importPreview.warnings.join(" ")}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {isParsing ? (
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {photoValidation ? "Έλεγχος αρχείων..." : "Έλεγχος αρχείου..."}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {currentStep === 2 && plan && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border bg-white px-4 py-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Νέες εκτυπωτικές χρεώσεις</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{formatMoney(plan.totals.newPrintCharge)}</div>
                </div>
                <div className="rounded-2xl border bg-white px-4 py-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Νέες χρεώσεις πλαστικοποιητή</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{formatMoney(plan.totals.newLaminationCharge)}</div>
                </div>
              </div>

              {replacementWarnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <div className="space-y-1">
                    {replacementWarnings.map((warning, index) => (
                      <div key={`plan-warning-${index}`}>{warning}</div>
                    ))}
                  </div>
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

          {currentStep === 3 && (
            <div className="space-y-5 rounded-2xl border bg-white p-6">
              {syncStage === "done" && importRun ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-slate-900">Το ανέβασμα ολοκληρώθηκε</div>
                    <div className="mt-2 text-sm text-slate-600">
                      Περίοδος {importRun.periodLabel}. Μπορείτε να ξεκινήσετε νέα εισαγωγή.
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="text-lg font-semibold text-slate-900">Ολοκλήρωση Ανεβάσματος</div>
                      <div className="text-sm text-slate-600">Το ανέβασμα ξεκινά μόνο από το κουμπί στα δεξιά.</div>
                    </div>
                    {canStartUpload && (
                      <Button
                        type="button"
                        onClick={() => void handleStartUpload()}
                        className="bg-yellow-500 text-slate-950 hover:bg-yellow-600"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Ανέβασμα
                      </Button>
                    )}
                  </div>

                  {!showUploadProgress && (
                    <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
                      Επιλέξατε το βήμα ανεβάσματος. Η εισαγωγή δεν ξεκινά αυτόματα. Πατήστε το κουμπί
                      {" "}«Ανέβασμα» για να συνεχίσετε.
                    </div>
                  )}

                  {showUploadProgress && (
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
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {syncStage === "error" && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      Η εισαγωγή δεν ολοκληρώθηκε. Δοκιμάστε ξανά.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {displayedImport && (
        <div className="overflow-hidden rounded-[28px] border border-amber-200 bg-white shadow-sm">
          <div className="border-b border-amber-200 bg-yellow-100 px-6 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-50 p-2">
                  <RefreshCcw className="h-5 w-5 text-yellow-700" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-yellow-900">Αναίρεση Εισαγωγής</h3>
                  <p className="text-sm text-yellow-700">Η ενότητα αυτή αφορά μόνο την πιο πρόσφατη καταχώρηση από Excel.</p>
                </div>
              </div>
              {canRollbackLatestImport && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-amber-300 bg-white text-amber-900"
                      disabled={isRollingBack || isImporting}
                    >
                      {isRollingBack ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Undo2 className="mr-2 h-4 w-4" />}
                      Αναίρεση τελευταίας εισαγωγής
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Αναίρεση τελευταίας εισαγωγής</AlertDialogTitle>
                      <AlertDialogDescription>
                        Αναιρείται μόνο η πιο πρόσφατη εισαγωγή.
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
          </div>

          <div className="p-5 sm:p-6">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-amber-900">
                  {rollbackCandidateImport ? "Τελευταία ενεργή εισαγωγή" : "Τελευταία εισαγωγή"}
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
