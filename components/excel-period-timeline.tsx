"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { FirebaseExcelImportRunSummary } from "@/lib/firebase-schema"
import { cn } from "@/lib/utils"

const GREEK_MONTHS = [
  "Ιανουάριος",
  "Φεβρουάριος",
  "Μάρτιος",
  "Απρίλιος",
  "Μάιος",
  "Ιούνιος",
  "Ιούλιος",
  "Αύγουστος",
  "Σεπτέμβριος",
  "Οκτώβριος",
  "Νοέμβριος",
  "Δεκέμβριος",
] as const

type ExcelTimelineStop = FirebaseExcelImportRunSummary & {
  createdAt: Date
  completedAt?: Date | null
}

interface ExcelPeriodTimelineProps {
  stops: ExcelTimelineStop[]
  selectedIndex: number
  onSelect: (index: number) => void
}

const TIMELINE_START_PERIOD_KEY = "2025-01"

function formatStopDate(value: Date | null | undefined) {
  if (!value) return ""
  return value.toLocaleDateString("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatPeriodLabel(periodKey: string) {
  const [year, month] = periodKey.split("-")
  const monthIndex = Number(month) - 1

  return {
    month: GREEK_MONTHS[monthIndex] ?? periodKey,
    year: year ?? "",
  }
}

function comparePeriodKeys(left: string, right: string) {
  return left.localeCompare(right)
}

function nextPeriodKey(periodKey: string) {
  const [yearPart, monthPart] = periodKey.split("-")
  const year = Number(yearPart)
  const month = Number(monthPart)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return periodKey
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`
}

export function ExcelPeriodTimeline({
  stops,
  selectedIndex,
  onSelect,
}: ExcelPeriodTimelineProps) {
  if (!stops.length) {
    return (
      <div className="mb-6 flex h-16 items-center justify-center px-4 text-sm text-slate-500">
        Δεν υπάρχει διαθέσιμο ιστορικό εισαγωγών.
      </div>
    )
  }

  const latestRealPeriodKey = stops[stops.length - 1]?.periodKey ?? TIMELINE_START_PERIOD_KEY
  const timelineEndPeriodKey =
    comparePeriodKeys(latestRealPeriodKey, TIMELINE_START_PERIOD_KEY) >= 0
      ? latestRealPeriodKey
      : TIMELINE_START_PERIOD_KEY

  const stopByPeriod = new Map(
    stops.map((stop, index) => [stop.periodKey, { stop, stopIndex: index }] as const)
  )

  const renderedPeriods: Array<{
    periodKey: string
    stop: ExcelTimelineStop | null
    stopIndex: number | null
  }> = []

  let cursor = TIMELINE_START_PERIOD_KEY
  while (comparePeriodKeys(cursor, timelineEndPeriodKey) <= 0) {
    const entry = stopByPeriod.get(cursor)
    renderedPeriods.push({
      periodKey: cursor,
      stop: entry?.stop ?? null,
      stopIndex: entry?.stopIndex ?? null,
    })
    cursor = nextPeriodKey(cursor)
  }

  return (
    <div className="mb-6">
      <div className="flex items-start gap-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="mt-1 h-8 w-8 shrink-0 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          onClick={() => onSelect(selectedIndex - 1)}
          disabled={selectedIndex <= 0}
          aria-label="Προηγούμενο Excel pair"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="mx-auto w-fit min-w-full">
            <div className="flex items-start pr-1">
              {renderedPeriods.map(({ periodKey, stop, stopIndex }, index) => {
                const isSelectable = stopIndex !== null
                const isActive = stopIndex !== null && stopIndex === selectedIndex
                const isPast = stopIndex !== null && stopIndex < selectedIndex
                const isLast = index === renderedPeriods.length - 1
                const { month, year } = formatPeriodLabel(periodKey)

                return (
                  <div key={periodKey} className="relative w-[6.75rem] shrink-0">
                    {index > 0 && (
                      <span
                        className={cn(
                          "absolute left-0 right-1/2 top-[6px] h-px",
                          isPast ? "bg-emerald-300" : "bg-slate-200"
                        )}
                      />
                    )}
                    {!isLast && (
                      <span
                        className={cn(
                          "absolute left-1/2 right-0 top-[6px] h-px",
                          isActive || isPast ? "bg-emerald-300" : "bg-slate-200"
                        )}
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (stopIndex === null) return
                        onSelect(stopIndex)
                      }}
                      title={
                        stop
                          ? `${stop.periodLabel || stop.periodKey} • ${formatStopDate(stop.completedAt || stop.createdAt)}`
                          : `Δεν υπάρχει διαθέσιμο import για ${month} ${year}`
                      }
                      disabled={!isSelectable}
                      className={cn(
                        "group relative z-10 flex w-full flex-col items-center text-center",
                        isActive && "text-blue-700",
                        isPast && "text-emerald-700",
                        !isSelectable && "cursor-default text-slate-400",
                        isSelectable && !isActive && !isPast && "text-slate-500 hover:text-slate-700"
                      )}
                      aria-pressed={isActive}
                      aria-label={isSelectable ? `${month} ${year}` : `${month} ${year} (χωρίς δεδομένα)`}
                    >
                      <span className="flex h-4 items-center justify-center bg-white px-2">
                        <span
                          className={cn(
                            "h-3 w-3 rounded-full border-2 transition-colors",
                            isActive && "border-blue-600 bg-blue-600",
                            isPast && "border-emerald-600 bg-emerald-600",
                            !isSelectable && "border-slate-200 bg-white",
                            isSelectable && !isActive && !isPast && "border-slate-300 bg-white group-hover:border-slate-400"
                          )}
                        />
                      </span>
                      <span
                        className={cn(
                          "mt-2 inline-flex min-h-[3.25rem] min-w-[5.5rem] flex-col items-center justify-center rounded-xl border px-3 py-2 transition-colors",
                          isActive && "border-blue-200 bg-blue-50 text-blue-700",
                          isPast && "border-emerald-200 bg-emerald-50 text-emerald-700",
                          !isSelectable && "border-slate-200 bg-slate-50 text-slate-400",
                          isSelectable && !isActive && !isPast && "border-slate-200 bg-white text-slate-600 group-hover:border-slate-300"
                        )}
                      >
                        <span className="text-[11px] font-semibold leading-none">{month}</span>
                        <span className="mt-1 text-[11px] font-medium leading-none opacity-80">{year}</span>
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="mt-1 h-8 w-8 shrink-0 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          onClick={() => onSelect(selectedIndex + 1)}
          disabled={selectedIndex >= stops.length - 1}
          aria-label="Επόμενο Excel pair"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
