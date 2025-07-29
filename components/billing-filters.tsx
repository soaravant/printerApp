import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Filter, RotateCcw } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getDynamicFilterOptions } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

interface BillingFiltersProps {
  billingSearchTerm: string
  setBillingSearchTerm: (v: string) => void
  billingDebtFilter: string
  setBillingDebtFilter: (v: string) => void
  billingAmountFilter: string
  setBillingAmountFilter: (v: string) => void
  billingPriceRange: [number, number]
  setBillingPriceRange: (v: [number, number]) => void
  billingPriceRangeInputs: [string, string]
  setBillingPriceRangeInputs: (v: [string, string]) => void
  billingRoleFilter: string
  setBillingRoleFilter: (v: string) => void
  billingResponsibleForFilter: string
  setBillingResponsibleForFilter: (v: string) => void
  billingPriceDistribution: any
  printBilling: any[]
  users: any[]
  clearFilters: () => void
  combinedDebtData: any[]
}

export const BillingFilters: React.FC<BillingFiltersProps> = ({
  billingSearchTerm,
  setBillingSearchTerm,
  billingDebtFilter,
  setBillingDebtFilter,
  billingAmountFilter,
  setBillingAmountFilter,
  billingPriceRange,
  setBillingPriceRange,
  billingPriceRangeInputs,
  setBillingPriceRangeInputs,
  billingRoleFilter,
  setBillingRoleFilter,
  billingResponsibleForFilter,
  setBillingResponsibleForFilter,
  billingPriceDistribution,
  printBilling,
  users,
  clearFilters,
  combinedDebtData,
}) => {
  const { user } = useAuth()

  return (
    <div className="bg-white rounded-lg border border-yellow-200 shadow-sm overflow-hidden mb-4">
      <div className="bg-yellow-100 px-6 py-4 border-b border-yellow-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-50 p-2 rounded-lg">
              <Filter className="h-5 w-5 text-yellow-700" />
            </div>
            <h3 className="text-lg font-semibold text-yellow-900">Φίλτρα</h3>
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
      <div className="p-6">
        {/* Basic Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div>
            <Label htmlFor="billingSearch" className="text-gray-700">Αναζήτηση</Label>
            <Input
              id="billingSearch"
              placeholder="Αναζήτηση..."
              value={billingSearchTerm}
              onChange={(e) => setBillingSearchTerm(e.target.value)}
              className="border-gray-200 focus:border-yellow-500"
            />
          </div>
          {/* Role */}
          <div>
            <Label htmlFor="billingRole" className="text-gray-700">Ρόλος</Label>
            <Select value={billingRoleFilter} onValueChange={setBillingRoleFilter}>
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
          {/* Responsible For Filter - Only for Υπεύθυνος users */}
          {user?.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0 && (
            <div>
              <Label className="text-gray-700 mb-2 block">Υπεύθυνος για</Label>
              <div className="flex flex-wrap gap-2">
                {/* "All" option */}
                <button
                  type="button"
                  onClick={() => setBillingResponsibleForFilter("all")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border-2 ${
                    billingResponsibleForFilter === "all"
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
                    onClick={() => setBillingResponsibleForFilter(item)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border-2 ${
                      billingResponsibleForFilter === item
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
                    value={Math.round(Number(billingPriceRangeInputs[0].replace(',', '.'))).toLocaleString('el-GR')}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9,.]/g, '').replace('.', ',')
                      val = val.replace(/(,.*),/, '$1')
                      setBillingPriceRangeInputs([val, billingPriceRangeInputs[1]])
                      const parsed = parseFloat(val.replace(',', '.')) || 0
                      setBillingPriceRange([parsed, billingPriceRange[1]])
                    }}
                    onFocus={e => e.target.select()}
                    className="w-16 h-7 text-sm border-gray-300 rounded-md text-center focus:border-yellow-500"
                    min={0}
                    max={billingPriceRange[1]}
                  />
                  <span className="text-sm">€</span>
                  <span className="text-gray-400 text-sm">-</span>
                  <Input
                    type="text"
                    aria-label="Μέγιστο ποσό"
                    value={Math.round(Number(billingPriceRangeInputs[1].replace(',', '.'))).toLocaleString('el-GR')}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9,.]/g, '').replace('.', ',')
                      val = val.replace(/(,.*),/, '$1')
                      setBillingPriceRangeInputs([billingPriceRangeInputs[0], val])
                      const parsed = parseFloat(val.replace(',', '.')) || 0
                      setBillingPriceRange([billingPriceRange[0], parsed])
                    }}
                    onFocus={e => e.target.select()}
                    className="w-16 h-7 text-sm border-gray-300 rounded-md text-center focus:border-yellow-500"
                    min={billingPriceRange[0]}
                    max={billingPriceDistribution.max}
                  />
                  <span className="text-sm">€</span>
                </div>
              </div>
              <div className="flex px-2 pb-2 flex-col gap-1">
                <div className="flex items-end justify-between h-8 mb-0 px-1">
                  {/* Histogram bar distribution */}
                  {(() => {
                    const NUM_BUCKETS = 16;
                    
                    // Calculate filtered data based only on search and role (not price range)
                    // Apply the same responsibleFor filtering logic as the dashboard
                    const filteredUsersForCounts = users.filter(userData => {
                      if (userData.accessLevel === "admin") return false;
                      
                      // Apply search filter
                      if (billingSearchTerm) {
                        const responsiblePerson = userData.userRole === "Άτομο" 
                          ? userData.displayName 
                          : userData.responsiblePerson || "-";
                        const matchesSearch = userData.displayName.toLowerCase().includes(billingSearchTerm.toLowerCase()) ||
                                             userData.userRole.toLowerCase().includes(billingSearchTerm.toLowerCase()) ||
                                             responsiblePerson.toLowerCase().includes(billingSearchTerm.toLowerCase());
                        if (!matchesSearch) return false;
                      }
                      
                      // Apply role filter
                      if (billingRoleFilter !== "all" && userData.userRole !== billingRoleFilter) {
                        return false;
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
                <Slider
                  value={billingPriceRange}
                  onValueChange={(value: number[]) => {
                    setBillingPriceRange(value as [number, number]);
                    setBillingPriceRangeInputs([
                      value[0].toFixed(2).replace('.', ','),
                      value[1].toFixed(2).replace('.', ',')
                    ]);
                  }}
                  min={0}
                  max={billingPriceDistribution.max}
                  step={0.01}
                  className="w-full"
                  aria-label="Εύρος ποσού"
                  trackClassName="bg-gray-200 h-1"
                  rangeClassName="bg-yellow-400"
                  thumbClassName="bg-yellow-400 border-yellow-500 h-4 w-4 border-2"
                />
                {/* Quick range radio buttons */}
                <div className="flex flex-col gap-1 mt-2" aria-label="Γρήγορη επιλογή εύρους">
                  {(() => {
                    const minValue = 0;
                    const maxValue = Math.ceil(billingPriceDistribution.max);
                    const intervalSize = (maxValue - minValue) / 4;
                    const rawIntervals = [
                      [minValue, minValue + intervalSize],
                      [minValue + intervalSize, minValue + 2 * intervalSize],
                      [minValue + 2 * intervalSize, minValue + 3 * intervalSize],
                      [minValue + 3 * intervalSize, maxValue],
                    ];
                    const intervals = rawIntervals.map(([start, end], i) => [
                      Math.round(i === 0 ? start : start + 0.01),
                      Math.round(end)
                    ]);
                    const intervalLabels = intervals.map(([start, end], i) => {
                      const formatEuro = (n: number) => `${n.toLocaleString('el-GR', { maximumFractionDigits: 0 })}€`;
                      if (i === 0) return `Έως ${formatEuro(end)}`;
                      if (i === 3) return `Από ${formatEuro(start)} και άνω`;
                      return `${formatEuro(start)} - ${formatEuro(end)}`;
                    });
                    
                    // Use the same filteredUsersForCounts as the histogram for consistency
                    const filteredUsersForCounts = users.filter(userData => {
                      if (userData.accessLevel === "admin") return false;
                      
                      // Apply search filter
                      if (billingSearchTerm) {
                        const responsiblePerson = userData.userRole === "Άτομο" 
                          ? userData.displayName 
                          : userData.responsiblePerson || "-";
                        const matchesSearch = userData.displayName.toLowerCase().includes(billingSearchTerm.toLowerCase()) ||
                                             userData.userRole.toLowerCase().includes(billingSearchTerm.toLowerCase()) ||
                                             responsiblePerson.toLowerCase().includes(billingSearchTerm.toLowerCase());
                        if (!matchesSearch) return false;
                      }
                      
                      // Apply role filter
                      if (billingRoleFilter !== "all" && userData.userRole !== billingRoleFilter) {
                        return false;
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
                    
                    const intervalCounts = intervals.map(([start, end], i) =>
                      filteredUsersForCounts.filter((userData: any) => {
                        const amount = userData.totalDebt || 0;
                        if (i === 0) return amount <= end;
                        if (i === 3) return amount >= start;
                        return amount > start - 0.01 && amount <= end;
                      }).length
                    );
                    
                    return intervals.map(([start, end], i) => {
                      const currentValue = `${billingPriceRange[0]}-${billingPriceRange[1]}`;
                      const optionValue = `${start}-${end}`;
                      const isSelected = currentValue === optionValue;
                      
                      const handleClick = () => {
                        if (isSelected) {
                          // If already selected, clear the selection (reset to full range)
                          setBillingPriceRange([0, billingPriceDistribution.max]);
                          setBillingPriceRangeInputs([
                            "0",
                            billingPriceDistribution.max.toString()
                          ]);
                        } else {
                          // If not selected, select this option
                          setBillingPriceRange([start, end]);
                          setBillingPriceRangeInputs([
                            start.toFixed(2).replace('.', ','),
                            end.toFixed(2).replace('.', ',')
                          ]);
                        }
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