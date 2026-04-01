import React from "react"
import { Input } from "@/components/ui/input"
import { ClearableInput } from "@/components/ui/clearable-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, RotateCcw } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { getDebtFilterComparableValue, getDynamicFilterOptions, isNaosLikeRole, normalizeGreek, normalizeUserRoleLabel } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

interface DebtFiltersProps {
  debtSearchTerm: string
  setDebtSearchTerm: (v: string) => void
  debtFilter: string
  setDebtFilter: (v: string) => void
  amountFilter: string
  setAmountFilter: (v: string) => void
  priceRange: [number, number]
  setPriceRange: (v: [number, number]) => void
  priceRangeInputs: [string, string]
  setPriceRangeInputs: (v: [string, string]) => void
  roleFilter: string
  setRoleFilter: (v: string) => void
  groupFilter: string
  setGroupFilter: (v: string) => void
  sectorFilter: string
  setSectorFilter: (v: string) => void
  naosFilter: string
  setNaosFilter: (v: string) => void
  responsibleForFilter: string
  setResponsibleForFilter: (v: string) => void
  priceDistribution: any
  users: any[]
  clearFilters: () => void
  combinedDebtData: any[]
  resetDebtPage: () => void
}

export const DebtFilters: React.FC<DebtFiltersProps> = ({
  debtSearchTerm,
  setDebtSearchTerm,
  priceRange,
  setPriceRange,
  priceRangeInputs,
  setPriceRangeInputs,
  roleFilter,
  setRoleFilter,
  groupFilter,
  setGroupFilter,
  sectorFilter,
  setSectorFilter,
  naosFilter,
  setNaosFilter,
  responsibleForFilter,
  setResponsibleForFilter,
  users,
  clearFilters,
  resetDebtPage,
}) => {
  const { user } = useAuth()
  const { teams, tomeis, naoi } = getDynamicFilterOptions(users as any[])
  const showGroupFilter = user?.accessLevel === "Διαχειριστής" && (roleFilter === "all" || roleFilter === "Άτομο" || roleFilter === "Ομάδα")
  const showSectorFilter = user?.accessLevel === "Διαχειριστής" && (roleFilter === "all" || roleFilter === "Άτομο" || roleFilter === "Τομέας")
  const showNaosFilter = user?.accessLevel === "Διαχειριστής" && isNaosLikeRole(roleFilter)

  const handleRoleChange = (value: string) => {
    setRoleFilter(value)

    if (value === "Ομάδα") {
      setSectorFilter("all")
      setNaosFilter("all")
      return
    }

    if (value === "Τομέας") {
      setGroupFilter("all")
      setNaosFilter("all")
      return
    }

    if (isNaosLikeRole(value)) {
      setGroupFilter("all")
      setSectorFilter("all")
      return
    }

    setNaosFilter("all")
  }

  const matchesAdminMembershipFilters = (userData: any) => {
    if (user?.accessLevel !== "Διαχειριστής") return true

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

  const filteredUsersForDebtUi = users.filter(userData => {
    if (userData.accessLevel === "Διαχειριστής") return false

    if (debtSearchTerm) {
      const normSearch = normalizeGreek(debtSearchTerm)
      const responsiblePerson = userData.userRole === "Άτομο"
        ? userData.displayName
        : userData.responsiblePerson || "-"
      const matchesSearch = normalizeGreek(userData.displayName).includes(normSearch) ||
        normalizeGreek(normalizeUserRoleLabel(userData.userRole)).includes(normSearch) ||
        normalizeGreek(responsiblePerson).includes(normSearch)
      if (!matchesSearch) return false
    }

    if (roleFilter !== "all" && normalizeUserRoleLabel(userData.userRole) !== roleFilter) {
      return false
    }

    if (!matchesAdminMembershipFilters(userData)) {
      return false
    }

    if (user?.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0) {
      if (userData.userRole === "Άτομο") {
        if (!userData.memberOf?.some((group: string) => user.responsibleFor?.includes(group))) {
          return false
        }
      } else if (!user.responsibleFor?.includes(userData.displayName)) {
        return false
      }
    }

    return true
  })

  const comparableDebtAmounts = filteredUsersForDebtUi.map((entry) => getDebtFilterComparableValue(entry.totalDebt || 0))
  const actualMinDebt = comparableDebtAmounts.length > 0 ? Math.floor(Math.min(...comparableDebtAmounts)) : 0
  const actualMaxDebt = comparableDebtAmounts.length > 0 ? Math.ceil(Math.max(...comparableDebtAmounts)) : 100
  const NUM_BUCKETS = 16
  const bucketSize = actualMaxDebt > actualMinDebt ? (actualMaxDebt - actualMinDebt) / NUM_BUCKETS : 1
  const histogramBuckets = Array.from({ length: NUM_BUCKETS }, (_, i) => {
    const start = actualMinDebt + i * bucketSize
    const end = start + bucketSize
    const count = filteredUsersForDebtUi.filter((entry: any) => {
      const amount = getDebtFilterComparableValue(entry.totalDebt || 0)
      return amount >= start && (i === NUM_BUCKETS - 1 ? amount <= end : amount < end)
    }).length
    return { start, end, count }
  })
  const maxBucketCount = Math.max(...histogramBuckets.map((bucket) => bucket.count), 1)

  const quickRangeIntervals = (() => {
    if (actualMaxDebt <= actualMinDebt) {
      return [[actualMinDebt, actualMaxDebt]] as Array<[number, number]>
    }

    const intervalSize = (actualMaxDebt - actualMinDebt) / 4
    return [
      [actualMinDebt, actualMinDebt + intervalSize],
      [actualMinDebt + intervalSize, actualMinDebt + 2 * intervalSize],
      [actualMinDebt + 2 * intervalSize, actualMinDebt + 3 * intervalSize],
      [actualMinDebt + 3 * intervalSize, actualMaxDebt],
    ].map(([start, end], index) => [
      Math.floor(index === 0 ? start : start + 0.01),
      Math.ceil(end),
    ] as [number, number])
  })()

  const quickRangeLabels = quickRangeIntervals.map(([start, end], index) => {
    const formatEuro = (value: number) => `${value.toLocaleString("el-GR", { maximumFractionDigits: 0 })}€`
    if (quickRangeIntervals.length === 1) return `Έως ${formatEuro(end)}`
    if (index === 0) return `Έως ${formatEuro(end)}`
    if (index === quickRangeIntervals.length - 1) return `Από ${formatEuro(start)} και άνω`
    return `${formatEuro(start)} - ${formatEuro(end)}`
  })

  const quickRangeCounts = quickRangeIntervals.map(([start, end], index) =>
    filteredUsersForDebtUi.filter((entry: any) => {
      const amount = getDebtFilterComparableValue(entry.totalDebt || 0)
      if (quickRangeIntervals.length === 1) return amount >= start && amount <= end
      if (index === 0) return amount <= end
      if (index === quickRangeIntervals.length - 1) return amount >= start
      return amount > start - 0.01 && amount <= end
    }).length
  )

  React.useEffect(() => {
    const nextMin = Math.min(Math.max(priceRange[0], actualMinDebt), actualMaxDebt)
    const nextMax = Math.max(Math.min(priceRange[1], actualMaxDebt), nextMin)

    if (nextMin === priceRange[0] && nextMax === priceRange[1]) return

    setPriceRange([nextMin, nextMax])
    setPriceRangeInputs([
      nextMin.toFixed(2).replace(".", ","),
      nextMax.toFixed(2).replace(".", ","),
    ])
  }, [actualMaxDebt, actualMinDebt, priceRange, setPriceRange, setPriceRangeInputs])

  return (
    <div className="bg-white rounded-lg border-2 border-yellow-200 shadow-sm overflow-hidden mb-4 h-full flex flex-col">
      <div className="bg-yellow-100 px-6 py-4 border-b-2 border-yellow-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-50 p-2 rounded-lg">
              <Filter className="h-5 w-5 text-yellow-700" />
            </div>
            <h3 className="text-lg font-semibold text-yellow-900">Φίλτρα Χρέους</h3>
          </div>
          <button
            type="button"
            aria-label="Επαναφορά φίλτρων"
            className="p-2 rounded-full border border-yellow-300 bg-white hover:bg-yellow-50 transition"
            onClick={clearFilters}
          >
            <RotateCcw className="h-4 w-4 text-yellow-600" />
          </button>
        </div>
      </div>
      <div className="p-6 flex-1 overflow-y-auto">
        {/* Basic Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div>
            <Label htmlFor="debtSearch" className="text-gray-700">Αναζήτηση</Label>
            <ClearableInput
              id="debtSearch"
              placeholder="Αναζήτηση..."
              value={debtSearchTerm}
              onChange={(e) => setDebtSearchTerm(e.target.value)}
              onClear={() => setDebtSearchTerm("")}
              className="border-gray-200 focus:border-yellow-500"
            />
          </div>
          {/* Role */}
          <div>
            <Label htmlFor="debtRole" className="text-gray-700">Ρόλος</Label>
            <Select value={roleFilter} onValueChange={handleRoleChange}>
              <SelectTrigger className="border-gray-200 focus:border-yellow-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <style jsx>{`
                  [data-radix-select-item]:hover {
                    background-color: rgb(243 244 246) !important;
                  }
                `}</style>
                <SelectItem value="all">Όλοι</SelectItem>
                <SelectItem value="Άτομο">Άτομο</SelectItem>
                <SelectItem value="Ομάδα">Ομάδα</SelectItem>
                <SelectItem value="Τομέας">Τομέας</SelectItem>
                <SelectItem value="Ναός">Ναός</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {showGroupFilter && (
            <div>
              <Label htmlFor="debtGroup" className="text-gray-700">Ομάδα</Label>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="border-gray-200 focus:border-yellow-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <style jsx>{`
                    [data-radix-select-item]:hover {
                      background-color: rgb(243 244 246) !important;
                    }
                  `}</style>
                  <SelectItem value="all">Όλες</SelectItem>
                  {teams.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {showSectorFilter && (
            <div>
              <Label htmlFor="debtSector" className="text-gray-700">Τομέας</Label>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger className="border-gray-200 focus:border-yellow-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <style jsx>{`
                    [data-radix-select-item]:hover {
                      background-color: rgb(243 244 246) !important;
                    }
                  `}</style>
                  <SelectItem value="all">Όλοι</SelectItem>
                  {tomeis.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {showNaosFilter && (
            <div>
              <Label htmlFor="debtNaos" className="text-gray-700">Ναός</Label>
              <Select value={naosFilter} onValueChange={setNaosFilter}>
                <SelectTrigger className="border-gray-200 focus:border-yellow-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <style jsx>{`
                    [data-radix-select-item]:hover {
                      background-color: rgb(243 244 246) !important;
                    }
                  `}</style>
                  <SelectItem value="all">Όλοι</SelectItem>
                  {naoi.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Responsible For Filter - Only for Υπεύθυνος users */}
          {user?.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0 && (
            <div>
              <Label className="text-gray-700 mb-2 block">Υπεύθυνος για</Label>
              <div className="flex flex-wrap gap-2">
                {/* "All" option */}
                <button
                  type="button"
                  onClick={() => setResponsibleForFilter("all")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border-2 ${
                    responsibleForFilter === "all"
                      ? "bg-yellow-400 border-yellow-500 text-yellow-900"
                      : "bg-white border-gray-300 text-gray-700 hover:border-yellow-400 hover:bg-yellow-50"
                  }`}
                >
                  Όλα
                </button>
                {/* Individual responsibleFor items */}
                {user.responsibleFor.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setResponsibleForFilter(item)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border-2 ${
                      responsibleForFilter === item
                        ? "bg-yellow-400 border-yellow-500 text-yellow-900"
                        : "bg-white border-gray-300 text-gray-700 hover:border-yellow-400 hover:bg-yellow-50"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Συνολικό Χρέος Filter */}
          <div>
            <Label className="text-gray-700">Συνολικό Χρέος</Label>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mt-1">
              <div className="p-2">
                <div className="flex items-center justify-center gap-1">
                  <Input
                    type="text"
                    aria-label="Ελάχιστο ποσό"
                    value={priceRangeInputs[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      let val = e.target.value
                        .replace(/[^0-9,.]/g, "")
                        .replace(".", ",")
                        .replace(/(,.*),/, "$1")
                      setPriceRangeInputs([val, priceRangeInputs[1]])
                      const parsed = parseFloat(val.replace(",", "."))
                      const safeMin = Number.isFinite(parsed)
                        ? Math.min(Math.max(actualMinDebt, parsed), priceRange[1])
                        : actualMinDebt
                      setPriceRange([safeMin, priceRange[1]])
                    }}
                    onFocus={e => e.target.select()}
                    className="w-16 h-7 text-sm border-gray-300 rounded-md text-center focus:border-yellow-500"
                    min={actualMinDebt}
                    max={priceRange[1]}
                    placeholder={actualMinDebt.toString()}
                  />
                  <span className="text-sm">€</span>
                  <span className="text-gray-400 text-sm">-</span>
                  <Input
                    type="text"
                    aria-label="Μέγιστο ποσό"
                    value={priceRangeInputs[1]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      let val = e.target.value
                        .replace(/[^0-9,.]/g, "")
                        .replace(".", ",")
                        .replace(/(,.*),/, "$1")
                      setPriceRangeInputs([priceRangeInputs[0], val])
                      const parsed = parseFloat(val.replace(",", "."))
                      const safeMax = Number.isFinite(parsed)
                        ? Math.max(Math.min(actualMaxDebt, parsed), priceRange[0])
                        : actualMaxDebt
                      setPriceRange([priceRange[0], safeMax])
                    }}
                    onFocus={e => e.target.select()}
                    className="w-16 h-7 text-sm border-gray-300 rounded-md text-center focus:border-yellow-500"
                    min={priceRange[0]}
                    max={actualMaxDebt}
                    placeholder={actualMaxDebt.toString()}
                  />
                  <span className="text-sm">€</span>
                </div>
              </div>
              <div className="flex px-2 pb-2 flex-col gap-1">
                <div className="flex items-end justify-between h-8 mb-0 px-1">
                  {histogramBuckets.map((bucket, idx) => (
                    <div
                      key={idx}
                      className="bg-yellow-400"
                      style={{
                        width: "8px",
                        height: `${(bucket.count / maxBucketCount) * 24}px`,
                        minHeight: "2px",
                        marginLeft: idx === 0 ? 0 : "2px",
                        marginRight: idx === histogramBuckets.length - 1 ? 0 : "2px",
                        borderRadius: 0,
                      }}
                    />
                  ))}
                </div>
                <Slider
                  value={priceRange}
                  onValueChange={(value: number[]) => {
                    setPriceRange(value as [number, number])
                    setPriceRangeInputs([
                      value[0].toFixed(2).replace(".", ","),
                      value[1].toFixed(2).replace(".", ","),
                    ])
                  }}
                  min={actualMinDebt}
                  max={actualMaxDebt}
                  step={0.01}
                  className="w-full"
                  aria-label="Εύρος ποσού"
                  trackClassName="bg-gray-200 h-1"
                  rangeClassName="bg-yellow-400"
                  thumbClassName="bg-yellow-400 border-yellow-500 h-4 w-4 border-2"
                />
                <div className="flex flex-col gap-1 mt-2" aria-label="Γρήγορη επιλογή εύρους">
                  {quickRangeIntervals.map(([start, end], index) => {
                    const currentValue = `${priceRange[0]}-${priceRange[1]}`
                    const optionValue = `${start}-${end}`
                    const isSelected = currentValue === optionValue

                    const handleClick = () => {
                      if (isSelected) {
                        setPriceRange([actualMinDebt, actualMaxDebt])
                        setPriceRangeInputs([
                          actualMinDebt.toString(),
                          actualMaxDebt.toString(),
                        ])
                      } else {
                        setPriceRange([start, end])
                        setPriceRangeInputs([
                          start.toFixed(2).replace(".", ","),
                          end.toFixed(2).replace(".", ","),
                        ])
                      }
                      resetDebtPage()
                    }

                    return (
                      <div className="flex items-center gap-2" key={optionValue}>
                        <div
                          className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-yellow-400 border-yellow-500"
                              : "bg-white border-gray-300 hover:border-yellow-400"
                          }`}
                          onClick={handleClick}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              handleClick()
                            }
                          }}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                          )}
                        </div>
                        <div
                          className="flex-1 text-sm cursor-pointer"
                          onClick={handleClick}
                        >
                          {quickRangeLabels[index]}
                        </div>
                        <span className="text-gray-400 text-sm">
                          {quickRangeCounts[index]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
