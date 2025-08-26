import React from "react"
import { Input } from "@/components/ui/input"
import { ClearableInput } from "@/components/ui/clearable-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, RotateCcw } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getDynamicFilterOptions, normalizeGreek } from "@/lib/utils"
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
  teamFilter: string
  setTeamFilter: (v: string) => void
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
  debtFilter,
  setDebtFilter,
  amountFilter,
  setAmountFilter,
  priceRange,
  setPriceRange,
  priceRangeInputs,
  setPriceRangeInputs,
  roleFilter,
  setRoleFilter,
  teamFilter,
  setTeamFilter,
  responsibleForFilter,
  setResponsibleForFilter,
  priceDistribution,
  users,
  clearFilters,
  combinedDebtData,
  resetDebtPage,
}) => {
  const { user } = useAuth()

  return (
    <div className="bg-white rounded-lg border border-yellow-200 shadow-sm overflow-hidden mb-4 h-full flex flex-col">
      <div className="bg-yellow-100 px-6 py-4 border-b border-yellow-200 flex-shrink-0">
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
            <Select value={roleFilter} onValueChange={setRoleFilter}>
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
          {/* Team Filter - Only for Admin users */}
          {user?.accessLevel === "Διαχειριστής" && (
            <div>
              <Label htmlFor="debtTeam" className="text-gray-700">Ομάδα</Label>
              <Select value={teamFilter} onValueChange={(value) => {
                // Reset role filter to "all" if current role is "Ναός" or "Τομέας" and a specific team is selected
                if ((roleFilter === "Ναός" || roleFilter === "Τομέας") && value !== "all") {
                  setRoleFilter("all");
                }
                setTeamFilter(value);
              }}>
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
                  <SelectItem value="Ενωμένοι">Ενωμένοι</SelectItem>
                  <SelectItem value="Σποριάδες">Σποριάδες</SelectItem>
                  <SelectItem value="Καρποφόροι">Καρποφόροι</SelectItem>
                  <SelectItem value="Ολόφωτοι">Ολόφωτοι</SelectItem>
                  <SelectItem value="Νικητές">Νικητές</SelectItem>
                  <SelectItem value="Νικηφόροι">Νικηφόροι</SelectItem>
                  <SelectItem value="Φλόγα">Φλόγα</SelectItem>
                  <SelectItem value="Σύμψυχοι">Σύμψυχοι</SelectItem>
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
                {(() => {
                  // Calculate the actual debt range from filtered data
                  const filteredUsersForRange = users.filter(userData => {
                    if (userData.accessLevel === "Διαχειριστής") return false;
                    
                    // Apply search filter
                    if (debtSearchTerm) {
                      const normSearch = normalizeGreek(debtSearchTerm)
                      const responsiblePerson = userData.userRole === "Άτομο" 
                        ? userData.displayName 
                        : userData.responsiblePerson || "-";
                      const matchesSearch = normalizeGreek(userData.displayName).includes(normSearch) ||
                                           normalizeGreek(userData.userRole).includes(normSearch) ||
                                           normalizeGreek(responsiblePerson).includes(normSearch);
                      if (!matchesSearch) return false;
                    }
                    
                    // Apply role filter
                    if (roleFilter !== "all" && userData.userRole !== roleFilter) {
                      return false;
                    }
                    
                    // Apply team filter for admin users
                    if (user?.accessLevel === "Διαχειριστής" && teamFilter !== "all") {
                      // For individual users, check if they belong to the selected team
                      if (userData.userRole === "Άτομο") {
                        if (!userData.memberOf?.includes(teamFilter)) {
                          return false;
                        }
                      } else {
                        // For groups, check if the group name matches the selected team
                        if (userData.displayName !== teamFilter) {
                          return false;
                        }
                      }
                    }
                    
                    // Apply base responsibleFor filter for Υπεύθυνος users (always active)
                    if (user?.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0) {
                      // For individual users, check if they belong to any of the responsibleFor groups
                      if (userData.userRole === "Άτομο") {
                        if (!userData.memberOf?.some((group: string) => user.responsibleFor?.includes(group))) {
                          return false;
                        }
                      } else {
                        // For groups, check if the group is in the responsibleFor list
                        if (!user.responsibleFor?.includes(userData.displayName)) {
                          return false;
                        }
                      }
                    }
                    
                    return true;
                  });
                  
                  const userDebtAmountsForRange = filteredUsersForRange.map(user => user.totalDebt || 0);
                  const actualMinDebt = userDebtAmountsForRange.length > 0 
                    ? Math.floor(Math.min(...userDebtAmountsForRange)) 
                    : 0;
                  const actualMaxDebt = userDebtAmountsForRange.length > 0 ? Math.ceil(Math.max(...userDebtAmountsForRange)) : 100;
                  
                  return (
                    <div className="flex items-center justify-center gap-1">
                      <Input
                        type="text"
                        aria-label="Ελάχιστο ποσό"
                        value={priceRangeInputs[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          // allow optional leading minus and a single comma
                          let val = e.target.value
                            .replace(/[^0-9,.-]/g, '')
                            .replace('.', ',')
                          // keep only one leading '-'
                          val = val.replace(/(?!^)-/g, '')
                          // keep only first comma
                          val = val.replace(/(,.*),/, '$1')
                          setPriceRangeInputs([val, priceRangeInputs[1]])
                          const parsed = parseFloat(val.replace(',', '.'))
                          const nextMin = Number.isFinite(parsed) ? parsed : 0
                          setPriceRange([nextMin, priceRange[1]])
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
                            .replace(/[^0-9,.-]/g, '')
                            .replace('.', ',')
                          val = val.replace(/(?!^)-/g, '')
                          val = val.replace(/(,.*),/, '$1')
                          setPriceRangeInputs([priceRangeInputs[0], val])
                          const parsed = parseFloat(val.replace(',', '.'))
                          const nextMax = Number.isFinite(parsed) ? parsed : 0
                          setPriceRange([priceRange[0], nextMax])
                        }}
                        onFocus={e => e.target.select()}
                        className="w-16 h-7 text-sm border-gray-300 rounded-md text-center focus:border-yellow-500"
                        min={priceRange[0]}
                        max={actualMaxDebt}
                        placeholder={actualMaxDebt.toString()}
                      />
                      <span className="text-sm">€</span>
                    </div>
                  );
                })()}
              </div>
              <div className="flex px-2 pb-2 flex-col gap-1">
                <div className="flex items-end justify-between h-8 mb-0 px-1">
                  {/* Histogram bar distribution */}
                  {(() => {
                    const NUM_BUCKETS = 16;
                    
                    // Calculate filtered data based only on search and role (not price range)
                    // Apply the same responsibleFor filtering logic as the dashboard
                    const filteredUsersForCounts = users.filter(userData => {
                      if (userData.accessLevel === "Διαχειριστής") return false;
                      
                      // Apply search filter
                      if (debtSearchTerm) {
                        const normSearch = normalizeGreek(debtSearchTerm)
                        const responsiblePerson = userData.userRole === "Άτομο" 
                          ? userData.displayName 
                          : userData.responsiblePerson || "-";
                        const matchesSearch = normalizeGreek(userData.displayName).includes(normSearch) ||
                                             normalizeGreek(userData.userRole).includes(normSearch) ||
                                             normalizeGreek(responsiblePerson).includes(normSearch);
                        if (!matchesSearch) return false;
                      }
                      
                      // Apply role filter
                      if (roleFilter !== "all" && userData.userRole !== roleFilter) {
                        return false;
                      }
                      
                      // Apply team filter for admin users
                      if (user?.accessLevel === "Διαχειριστής" && teamFilter !== "all") {
                        // For individual users, check if they belong to the selected team
                        if (userData.userRole === "Άτομο") {
                          if (!userData.memberOf?.includes(teamFilter)) {
                            return false;
                          }
                        } else {
                          // For groups, check if the group name matches the selected team
                          if (userData.displayName !== teamFilter) {
                            return false;
                          }
                        }
                      }
                      
                      // Apply base responsibleFor filter for Υπεύθυνος users (always active)
                      if (user?.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0) {
                        // For individual users, check if they belong to any of the responsibleFor groups
                        if (userData.userRole === "Άτομο") {
                          if (!userData.memberOf?.some((group: string) => user.responsibleFor?.includes(group))) {
                            return false;
                          }
                        } else {
                          // For groups, check if the group is in the responsibleFor list
                          if (!user.responsibleFor?.includes(userData.displayName)) {
                            return false;
                          }
                        }
                      }
                      
                      return true;
                    });
                    
                    // Calculate the actual range from user debt data
                    const userDebtAmounts = filteredUsersForCounts.map(user => user.totalDebt || 0);
                    const minDebt = userDebtAmounts.length > 0 ? Math.min(...userDebtAmounts) : 0;
                    const maxDebt = userDebtAmounts.length > 0 ? Math.max(...userDebtAmounts) : 100;
                    const bucketSize = maxDebt > minDebt ? (maxDebt - minDebt) / NUM_BUCKETS : 1;
                    
                    const buckets = Array.from({ length: NUM_BUCKETS }, (_, i) => {
                      const start = minDebt + i * bucketSize;
                      const end = start + bucketSize;
                      const count = filteredUsersForCounts.filter((user: any) => {
                        const amount = user.totalDebt || 0;
                        return amount >= start && (i === NUM_BUCKETS - 1 ? amount <= end : amount < end);
                      }).length;
                      return { start, end, count };
                    });
                    const maxCount = Math.max(...buckets.map(b => b.count), 1);
                    
                    // Store the calculated range for use by the slider
                    const histogramRange = { min: minDebt, max: maxDebt };
                    
                    return (
                      <React.Fragment>
                        {buckets.map((bucket, idx) => (
                          <div
                            key={idx}
                            className="bg-yellow-400"
                            style={{
                              width: '8px',
                              height: `${(bucket.count / maxCount) * 24}px`,
                              minHeight: '2px',
                              marginLeft: idx === 0 ? 0 : '2px',
                              marginRight: idx === buckets.length - 1 ? 0 : '2px',
                              borderRadius: 0,
                            }}
                          />
                        ))}
                      </React.Fragment>
                    );
                  })()}
                </div>
                {/* 2-thumb slider for range selection */}
                {(() => {
                  // Calculate the same range as the histogram for consistency
                  const filteredUsersForSlider = users.filter(userData => {
                    if (userData.accessLevel === "Διαχειριστής") return false;
                    
                    // Apply search filter
                    if (debtSearchTerm) {
                      const normSearch = normalizeGreek(debtSearchTerm)
                      const responsiblePerson = userData.userRole === "Άτομο" 
                        ? userData.displayName 
                        : userData.responsiblePerson || "-";
                      const matchesSearch = normalizeGreek(userData.displayName).includes(normSearch) ||
                                           normalizeGreek(userData.userRole).includes(normSearch) ||
                                           normalizeGreek(responsiblePerson).includes(normSearch);
                      if (!matchesSearch) return false;
                    }
                    
                    // Apply role filter
                    if (roleFilter !== "all" && userData.userRole !== roleFilter) {
                      return false;
                    }
                    
                    // Apply team filter for admin users
                    if (user?.accessLevel === "Διαχειριστής" && teamFilter !== "all") {
                      // For individual users, check if they belong to the selected team
                      if (userData.userRole === "Άτομο") {
                        if (!userData.memberOf?.includes(teamFilter)) {
                          return false;
                        }
                      } else {
                        // For groups, check if the group name matches the selected team
                        if (userData.displayName !== teamFilter) {
                          return false;
                        }
                      }
                    }
                    
                    // Apply base responsibleFor filter for Υπεύθυνος users (always active)
                    if (user?.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0) {
                      // For individual users, check if they belong to any of the responsibleFor groups
                      if (userData.userRole === "Άτομο") {
                        if (!userData.memberOf?.some((group: string) => user.responsibleFor?.includes(group))) {
                          return false;
                        }
                      } else {
                        // For groups, check if the group is in the responsibleFor list
                        if (!user.responsibleFor?.includes(userData.displayName)) {
                          return false;
                        }
                      }
                    }
                    
                    return true;
                  });
                  
                  const userDebtAmountsForSlider = filteredUsersForSlider.map(user => user.totalDebt || 0);
                  const sliderMin = userDebtAmountsForSlider.length > 0 
                    ? Math.floor(Math.min(...userDebtAmountsForSlider)) 
                    : 0;
                  const sliderMax = userDebtAmountsForSlider.length > 0 ? Math.ceil(Math.max(...userDebtAmountsForSlider)) : 100;
                  
                  return (
                    <Slider
                      value={priceRange}
                      onValueChange={(value: number[]) => {
                        setPriceRange(value as [number, number]);
                        setPriceRangeInputs([
                          value[0].toFixed(2).replace('.', ','),
                          value[1].toFixed(2).replace('.', ',')
                        ]);
                      }}
                      min={sliderMin}
                      max={sliderMax}
                      step={0.01}
                      className="w-full"
                      aria-label="Εύρος ποσού"
                      trackClassName="bg-gray-200 h-1"
                      rangeClassName="bg-yellow-400"
                      thumbClassName="bg-yellow-400 border-yellow-500 h-4 w-4 border-2"
                    />
                  );
                })()}
                {/* Quick range radio buttons */}
                <div className="flex flex-col gap-1 mt-2" aria-label="Γρήγορη επιλογή εύρους">
                  {(() => {
                    // Use the same filteredUsersForCounts as the histogram for consistency
                    const filteredUsersForCounts = users.filter(userData => {
                      if (userData.accessLevel === "Διαχειριστής") return false;
                      
                      // Apply search filter
                      if (debtSearchTerm) {
                        const responsiblePerson = userData.userRole === "Άτομο" 
                          ? userData.displayName 
                          : userData.responsiblePerson || "-";
                        const matchesSearch = userData.displayName.toLowerCase().includes(debtSearchTerm.toLowerCase()) ||
                                             userData.userRole.toLowerCase().includes(debtSearchTerm.toLowerCase()) ||
                                             responsiblePerson.toLowerCase().includes(debtSearchTerm.toLowerCase());
                        if (!matchesSearch) return false;
                      }
                      
                      // Apply role filter
                      if (roleFilter !== "all" && userData.userRole !== roleFilter) {
                        return false;
                      }
                      
                      // Apply team filter for admin users
                      if (user?.accessLevel === "Διαχειριστής" && teamFilter !== "all") {
                        // For individual users, check if they belong to the selected team
                        if (userData.userRole === "Άτομο") {
                          if (!userData.memberOf?.includes(teamFilter)) {
                            return false;
                          }
                        } else {
                          // For groups, check if the group name matches the selected team
                          if (userData.displayName !== teamFilter) {
                            return false;
                          }
                        }
                      }
                      
                      // Apply base responsibleFor filter for Υπεύθυνος users (always active)
                      if (user?.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0) {
                        // For individual users, check if they belong to any of the responsibleFor groups
                        if (userData.userRole === "Άτομο") {
                          if (!userData.memberOf?.some((group: string) => user.responsibleFor?.includes(group))) {
                            return false;
                          }
                        } else {
                          // For groups, check if the group is in the responsibleFor list
                          if (!user.responsibleFor?.includes(userData.displayName)) {
                            return false;
                          }
                        }
                      }
                      
                      return true;
                    });
                    
                    // Calculate actual min and max debt amounts from filtered data
                    const userDebtAmounts = filteredUsersForCounts.map(user => user.totalDebt || 0);
                    const actualMinDebt = userDebtAmounts.length > 0 
                      ? Math.floor(Math.min(...userDebtAmounts)) 
                      : 0;
                    const actualMaxDebt = userDebtAmounts.length > 0 ? Math.ceil(Math.max(...userDebtAmounts)) : 100;
                    
                    // Create 4 equally spaced intervals from actual min to actual max
                    const intervalSize = (actualMaxDebt - actualMinDebt) / 4;
                    const rawIntervals = [
                      [actualMinDebt, actualMinDebt + intervalSize],
                      [actualMinDebt + intervalSize, actualMinDebt + 2 * intervalSize],
                      [actualMinDebt + 2 * intervalSize, actualMinDebt + 3 * intervalSize],
                      [actualMinDebt + 3 * intervalSize, actualMaxDebt],
                    ];
                    
                    const intervals = rawIntervals.map(([start, end], i) => [
                      Math.floor(i === 0 ? start : start + 0.01),
                      Math.ceil(end)
                    ]);
                    
                    const intervalLabels = intervals.map(([start, end], i) => {
                      const formatEuro = (n: number) => `${n.toLocaleString('el-GR', { maximumFractionDigits: 0 })}€`;
                      if (i === 0) return `Έως ${formatEuro(end)}`;
                      if (i === 3) return `Από ${formatEuro(start)} και άνω`;
                      return `${formatEuro(start)} - ${formatEuro(end)}`;
                    });
                    
                    const intervalCounts = intervals.map(([start, end], i) =>
                      filteredUsersForCounts.filter((userData: any) => {
                        const amount = userData.totalDebt || 0;
                        if (i === 0) return amount <= end;
                        if (i === 3) return amount >= start;
                        return amount > start - 0.01 && amount <= end;
                      }).length
                    );
                    
                    return intervals.map(([start, end], i) => {
                      const currentValue = `${priceRange[0]}-${priceRange[1]}`;
                      const optionValue = `${start}-${end}`;
                      const isSelected = currentValue === optionValue;
                      
                      const handleClick = () => {
                        if (isSelected) {
                          // If already selected, clear the selection (reset to full range)
                          // Use the actual debt range with floor/ceil math
                          const actualMinDebt = userDebtAmounts.length > 0 
                            ? Math.floor(Math.min(...userDebtAmounts)) 
                            : 0;
                          const actualMaxDebt = userDebtAmounts.length > 0 ? Math.ceil(Math.max(...userDebtAmounts)) : 100;
                          
                          setPriceRange([actualMinDebt, actualMaxDebt]);
                          setPriceRangeInputs([
                            actualMinDebt.toString(),
                            actualMaxDebt.toString()
                          ]);
                        } else {
                          // If not selected, select this option
                          setPriceRange([start, end]);
                          setPriceRangeInputs([
                            start.toFixed(2).replace('.', ','),
                            end.toFixed(2).replace('.', ',')
                          ]);
                        }
                        // Always reset pagination to first page when a radio is pressed
                        resetDebtPage();
                      };
                      
                      return (
                        <div className="flex items-center gap-2" key={i}>
                          <div
                            className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-yellow-400 border-yellow-500' 
                                : 'bg-white border-gray-300 hover:border-yellow-400'
                            }`}
                            onClick={handleClick}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleClick();
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
                            {intervalLabels[i]}
                          </div>
                          <span className="text-gray-400 text-sm">
                            {intervalCounts[i]}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 