"use client"

import { Calendar, RotateCcw } from "lucide-react"

import { Slider } from "@/components/ui/slider"
import type { FirebaseExcelImportRunSummary } from "@/lib/firebase-schema"
import { cn } from "@/lib/utils"

type ExcelTimelineStop = FirebaseExcelImportRunSummary & {
  createdAt: Date
  completedAt?: Date | null
}

interface ExcelPeriodTimelineProps {
  stops: ExcelTimelineStop[]
  startIndex: number
  endIndex: number
  onRangeChange: (range: { startIndex: number; endIndex: number }) => void
}

function formatPeriodStopLabel(periodKey: string) {
  const [year, month] = periodKey.split("-")

  return {
    month: String(month ?? "").padStart(2, "0"),
    year: year ?? "",
  }
}

export function ExcelPeriodTimeline({
  stops,
  startIndex,
  endIndex,
  onRangeChange,
}: ExcelPeriodTimelineProps) {
  if (!stops.length) {
    return (
      <div className="mb-6 flex h-16 items-center justify-center rounded-2xl border-2 border-yellow-200 bg-white px-4 text-sm text-slate-500 shadow-sm">
        Δεν υπάρχει διαθέσιμο ιστορικό εισαγωγών.
      </div>
    )
  }

  const maxIndex = stops.length - 1
  const safeStartIndex = Math.min(Math.max(0, startIndex), maxIndex)
  const safeEndIndex = Math.min(Math.max(safeStartIndex, endIndex), maxIndex)

  const updateRange = (nextStartIndex: number, nextEndIndex: number) => {
    const clampedStart = Math.max(0, Math.min(nextStartIndex, nextEndIndex, maxIndex))
    const clampedEnd = Math.min(maxIndex, Math.max(nextStartIndex, nextEndIndex, 0))
    onRangeChange({ startIndex: clampedStart, endIndex: clampedEnd })
  }

  return (
    <div className="mb-6 overflow-hidden rounded-lg border-2 border-yellow-200 bg-white shadow-sm">
      <div className="border-b-2 border-yellow-200 bg-yellow-100 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-50 p-2">
              <Calendar className="h-5 w-5 text-yellow-700" />
            </div>
            <h3 className="text-lg font-semibold text-yellow-900">Εύρος Περιόδων Excel</h3>
          </div>
          <button
            type="button"
            aria-label="Επαναφορά εύρους περιόδων"
            title="Όλο το ιστορικό"
            onClick={() => updateRange(0, maxIndex)}
            disabled={safeStartIndex === 0 && safeEndIndex === maxIndex}
            className="rounded-full border border-yellow-300 bg-white p-2 transition hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4 text-yellow-600" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden p-6">
        <div className="w-full">
          <Slider
            min={0}
            max={maxIndex}
            step={1}
            minStepsBetweenThumbs={0}
            value={[safeStartIndex, safeEndIndex]}
            onValueChange={(values) => {
              if (values.length !== 2) return
              updateRange(values[0], values[1])
            }}
            className="py-2"
            trackClassName="h-1.5 bg-gray-200"
            rangeClassName="bg-yellow-400"
            thumbClassName="h-5 w-5 border-2 border-yellow-500 bg-yellow-400 shadow-sm"
          />

          <div className="relative mt-5 h-12">
            {stops.map((stop, index) => {
              const { month, year } = formatPeriodStopLabel(stop.periodKey)
              const isInRange = index >= safeStartIndex && index <= safeEndIndex
              const isBoundary = index === safeStartIndex || index === safeEndIndex
              const stopPosition = maxIndex === 0 ? 0 : (index / maxIndex) * 100
              const alignmentClass =
                maxIndex === 0 || index === 0
                  ? "translate-x-0 items-start text-left"
                  : index === maxIndex
                    ? "-translate-x-full items-end text-right"
                    : "-translate-x-1/2 items-center text-center"

              return (
                <div
                  key={stop.periodKey}
                  title={`${month}/${year}`}
                  className="absolute top-0"
                  style={{ left: `${stopPosition}%` }}
                >
                  <div
                    className={cn(
                      "flex min-w-[2rem] flex-col",
                      alignmentClass
                    )}
                  >
                    <div
                      className={cn(
                        "mb-2 h-3 w-px rounded-full",
                        isInRange ? "bg-yellow-500" : "bg-gray-300"
                      )}
                    />
                    <div
                      className={cn(
                        "text-xs font-semibold leading-none sm:text-sm",
                        isBoundary ? "text-yellow-900" : isInRange ? "text-yellow-800" : "text-slate-500"
                      )}
                    >
                      {month}
                    </div>
                    <div
                      className={cn(
                        "mt-1 text-[10px] font-medium leading-none sm:text-[11px]",
                        isBoundary ? "text-yellow-700" : isInRange ? "text-yellow-600" : "text-slate-400"
                      )}
                    >
                      {year}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
