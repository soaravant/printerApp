"use client"

import { useEffect, useRef, useState } from "react"
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
const TIMELINE_CARD_WIDTH = 140

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
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const activeButtonRef = useRef<HTMLButtonElement | null>(null)
  const hasAutoCenteredRef = useRef(false)
  const [edgePadding, setEdgePadding] = useState(40)

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

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const updateEdgePadding = () => {
      const nextPadding = Math.max(40, Math.round(container.clientWidth / 2 - TIMELINE_CARD_WIDTH / 2))
      setEdgePadding((current) => (Math.abs(current - nextPadding) > 1 ? nextPadding : current))
    }

    updateEdgePadding()

    const observer = new ResizeObserver(() => updateEdgePadding())
    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    const activeButton = activeButtonRef.current
    if (!stops.length || !container || !activeButton) return

    const targetLeft =
      activeButton.offsetLeft + activeButton.offsetWidth / 2 - container.clientWidth / 2
    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth)
    const nextScrollLeft = Math.min(Math.max(0, targetLeft), maxScrollLeft)

    container.scrollTo({
      left: nextScrollLeft,
      behavior: hasAutoCenteredRef.current ? "smooth" : "auto",
    })

    hasAutoCenteredRef.current = true
  }, [selectedIndex, edgePadding, renderedPeriods.length, stops.length])

  if (!stops.length) {
    return (
      <div className="mb-6 flex h-16 items-center justify-center px-4 text-sm text-slate-500">
        Δεν υπάρχει διαθέσιμο ιστορικό εισαγωγών.
      </div>
    )
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

        <div ref={scrollContainerRef} className="min-w-0 flex-1 overflow-x-auto">
          <div className="mx-auto w-fit min-w-full">
            <div
              className="inline-flex items-center py-2 transition-transform duration-300 ease-out"
              style={{ paddingLeft: edgePadding, paddingRight: edgePadding }}
            >
              {renderedPeriods.map(({ periodKey, stop, stopIndex }, index) => {
                const isSelectable = stopIndex !== null
                const isActive = stopIndex !== null && stopIndex === selectedIndex
                const isPast = stopIndex !== null && stopIndex < selectedIndex
                const isLast = index === renderedPeriods.length - 1
                const nextStopIndex = renderedPeriods[index + 1]?.stopIndex ?? null
                const isConnectorActive = nextStopIndex !== null && nextStopIndex <= selectedIndex
                const { month, year } = formatPeriodLabel(periodKey)

                return (
                  <div key={periodKey} className="flex items-center">
                    <button
                      ref={(node) => {
                        if (isActive) {
                          activeButtonRef.current = node
                        }
                      }}
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
                        "group relative z-10 shrink-0 text-center transition-all duration-300 ease-out",
                        isActive && "-translate-y-1",
                        !isSelectable && "cursor-default"
                      )}
                      aria-pressed={isActive}
                      aria-label={isSelectable ? `${month} ${year}` : `${month} ${year} (χωρίς δεδομένα)`}
                    >
                      <span
                        className={cn(
                          "inline-flex min-h-[4.25rem] w-[8.75rem] flex-col items-center justify-center rounded-2xl border px-4 py-3 shadow-sm transition-all duration-300 ease-out",
                          isActive && "border-blue-200 bg-blue-50 text-blue-700 shadow-md shadow-blue-100/60",
                          isPast && "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100/60",
                          !isSelectable && "border-slate-200 bg-slate-50 text-slate-400 shadow-none",
                          isSelectable && !isActive && !isPast && "border-slate-200 bg-white text-slate-600 group-hover:border-slate-300 group-hover:bg-slate-50"
                        )}
                      >
                        <span className="text-sm font-semibold leading-tight">{month}</span>
                        <span className="mt-1 text-sm font-medium leading-tight opacity-80">{year}</span>
                      </span>
                    </button>

                    {!isLast && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mx-6 h-[2px] w-20 shrink-0 rounded-full transition-colors duration-300 ease-out",
                          isConnectorActive ? "bg-emerald-300" : "bg-slate-200"
                        )}
                      />
                    )}
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
