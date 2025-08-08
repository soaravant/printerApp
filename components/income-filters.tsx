import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, RotateCcw } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { useAuth } from "@/lib/auth-context"
import { GreekDatePicker } from "@/components/ui/greek-date-picker"

interface IncomeFiltersProps {
  incomeSearchTerm: string
  setIncomeSearchTerm: (v: string) => void
  incomeRoleFilter: string
  setIncomeRoleFilter: (v: string) => void
  incomeDateFrom: string
  setIncomeDateFrom: (v: string) => void
  incomeDateTo: string
  setIncomeDateTo: (v: string) => void
  incomeAmountRange: [number, number]
  setIncomeAmountRange: (v: [number, number]) => void
  incomeAmountInputs: [string, string]
  setIncomeAmountInputs: (v: [string, string]) => void
  incomeResponsibleForFilter: string
  setIncomeResponsibleForFilter: (v: string) => void
  incomeData: any[]
  users: any[]
  clearIncomeFilters: () => void
}

export const IncomeFilters: React.FC<IncomeFiltersProps> = ({
  incomeSearchTerm,
  setIncomeSearchTerm,
  incomeRoleFilter,
  setIncomeRoleFilter,
  incomeDateFrom,
  setIncomeDateFrom,
  incomeDateTo,
  setIncomeDateTo,
  incomeAmountRange,
  setIncomeAmountRange,
  incomeAmountInputs,
  setIncomeAmountInputs,
  incomeResponsibleForFilter,
  setIncomeResponsibleForFilter,
  incomeData,
  users,
  clearIncomeFilters,
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
            <h3 className="text-lg font-semibold text-yellow-900">Φίλτρα Εσόδων</h3>
          </div>
          <button
            type="button"
            aria-label="Επαναφορά φίλτρων"
            className="p-2 rounded-full border border-yellow-300 bg-white hover:bg-yellow-50 transition"
            onClick={clearIncomeFilters}
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
            <Label htmlFor="incomeSearch" className="text-gray-700">Αναζήτηση</Label>
            <Input
              id="incomeSearch"
              placeholder="Αναζήτηση..."
              value={incomeSearchTerm}
              onChange={(e) => setIncomeSearchTerm(e.target.value)}
              className="border-gray-200 focus:border-yellow-500"
            />
          </div>
          {/* Role - Hidden */}
          {/* <div>
            <Label htmlFor="incomeRole" className="text-gray-700">Ρόλος</Label>
            <Select value={incomeRoleFilter} onValueChange={setIncomeRoleFilter}>
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
          </div> */}
          {/* Date Range */}
          <div className="space-y-4">
            <div>
              <GreekDatePicker
                id="incomeDateFrom"
                label="Από"
                value={incomeDateFrom}
                onChange={setIncomeDateFrom}
                className="w-full"
              />
            </div>
            <div>
              <GreekDatePicker
                id="incomeDateTo"
                label="Έως"
                value={incomeDateTo}
                onChange={setIncomeDateTo}
                className="w-full"
              />
            </div>
          </div>
          {/* Responsible For Filter - Only for Υπεύθυνος users */}
          {user?.accessLevel === "Υπεύθυνος" && user?.responsibleFor && user.responsibleFor.length > 0 && (
            <div>
              <Label className="text-gray-700 mb-2 block">Υπεύθυνος για</Label>
              <div className="flex flex-wrap gap-2">
                {/* "All" option */}
                <button
                  type="button"
                  onClick={() => setIncomeResponsibleForFilter("all")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border-2 ${
                    incomeResponsibleForFilter === "all"
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
                    onClick={() => setIncomeResponsibleForFilter(item)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border-2 ${
                      incomeResponsibleForFilter === item
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
                     {/* Ποσό Εσόδου Filter */}
           <div>
             <Label className="text-gray-700">Ποσό Εσόδου</Label>
             <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mt-1">
               <div className="p-2">
                 {(() => {
                   // Calculate the actual income range from filtered data
                   const filteredIncomeForRange = incomeData.filter(income => {
                     // Apply search filter
                     if (incomeSearchTerm) {
                       const matchesSearch = income.userDisplayName.toLowerCase().includes(incomeSearchTerm.toLowerCase()) ||
                                            income.username.toLowerCase().includes(incomeSearchTerm.toLowerCase());
                       if (!matchesSearch) return false;
                     }
                     
                     // Apply role filter
                     if (incomeRoleFilter !== "all") {
                       const userData = users.find(u => u.uid === income.uid);
                       if (!userData || userData.userRole !== incomeRoleFilter) {
                         return false;
                       }
                     }
                     
                     // Apply date filters
                     if (incomeDateFrom) {
                       const incomeDate = new Date(income.timestamp);
                       const fromDate = new Date(incomeDateFrom);
                       if (incomeDate < fromDate) return false;
                     }
                     
                     if (incomeDateTo) {
                       const incomeDate = new Date(income.timestamp);
                       const toDate = new Date(incomeDateTo);
                       if (incomeDate > toDate) return false;
                     }
                     
                     return true;
                   });
                   
                   const incomeAmountsForRange = filteredIncomeForRange.map(income => income.amount || 0);
                   const actualMinIncome = incomeAmountsForRange.length > 0 ? Math.floor(Math.min(...incomeAmountsForRange)) : 0;
                   const actualMaxIncome = incomeAmountsForRange.length > 0 ? Math.ceil(Math.max(...incomeAmountsForRange)) : 100;
                   
                   return (
                     <div className="flex items-center justify-center gap-1">
                       <Input
                         type="text"
                         aria-label="Ελάχιστο ποσό"
                         value={Math.max(
                           actualMinIncome,
                           Math.round(Number(incomeAmountInputs[0].replace(',', '.')))
                         ).toLocaleString('el-GR')}
                         onChange={(e) => {
                           let val = e.target.value.replace(/[^0-9,.]/g, '').replace('.', ',')
                           val = val.replace(/(,.*),/, '$1')
                           setIncomeAmountInputs([val, incomeAmountInputs[1]])
                           const parsed = parseFloat(val.replace(',', '.')) || 0
                           const clamped = Math.max(actualMinIncome, parsed)
                           setIncomeAmountRange([clamped, incomeAmountRange[1]])
                         }}
                         onFocus={e => e.target.select()}
                         className="w-16 h-7 text-sm border-gray-300 rounded-md text-center focus:border-yellow-500"
                         min={actualMinIncome}
                         max={incomeAmountRange[1]}
                         placeholder={actualMinIncome.toString()}
                       />
                       <span className="text-sm">€</span>
                       <span className="text-gray-400 text-sm">-</span>
                       <Input
                         type="text"
                         aria-label="Μέγιστο ποσό"
                         value={Math.min(
                           actualMaxIncome,
                           Math.round(Number(incomeAmountInputs[1].replace(',', '.')))
                         ).toLocaleString('el-GR')}
                         onChange={(e) => {
                           let val = e.target.value.replace(/[^0-9,.]/g, '').replace('.', ',')
                           val = val.replace(/(,.*),/, '$1')
                           setIncomeAmountInputs([incomeAmountInputs[0], val])
                           const parsed = parseFloat(val.replace(',', '.')) || 0
                           const clamped = Math.min(actualMaxIncome, parsed)
                           setIncomeAmountRange([incomeAmountRange[0], clamped])
                         }}
                         onFocus={e => e.target.select()}
                         className="w-16 h-7 text-sm border-gray-300 rounded-md text-center focus:border-yellow-500"
                         min={incomeAmountRange[0]}
                         max={actualMaxIncome}
                         placeholder={actualMaxIncome.toString()}
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
                     
                     // Calculate filtered data based only on search, role, and date filters (not amount range)
                     const filteredIncomeForCounts = incomeData.filter(income => {
                       // Apply search filter
                       if (incomeSearchTerm) {
                         const matchesSearch = income.userDisplayName.toLowerCase().includes(incomeSearchTerm.toLowerCase()) ||
                                              income.username.toLowerCase().includes(incomeSearchTerm.toLowerCase());
                         if (!matchesSearch) return false;
                       }
                       
                       // Apply role filter
                       if (incomeRoleFilter !== "all") {
                         const userData = users.find(u => u.uid === income.uid);
                         if (!userData || userData.userRole !== incomeRoleFilter) {
                           return false;
                         }
                       }
                       
                       // Apply date filters
                       if (incomeDateFrom) {
                         const incomeDate = new Date(income.timestamp);
                         const fromDate = new Date(incomeDateFrom);
                         if (incomeDate < fromDate) return false;
                       }
                       
                       if (incomeDateTo) {
                         const incomeDate = new Date(income.timestamp);
                         const toDate = new Date(incomeDateTo);
                         if (incomeDate > toDate) return false;
                       }
                       
                       return true;
                     });
                     
                     // Calculate the actual range from income data
                     const incomeAmounts = filteredIncomeForCounts.map(income => income.amount || 0);
                     const minIncome = incomeAmounts.length > 0 ? Math.min(...incomeAmounts) : 0;
                     const maxIncome = incomeAmounts.length > 0 ? Math.max(...incomeAmounts) : 100;
                     const bucketSize = maxIncome > minIncome ? (maxIncome - minIncome) / NUM_BUCKETS : 1;
                     
                     const buckets = Array.from({ length: NUM_BUCKETS }, (_, i) => {
                       const start = minIncome + i * bucketSize;
                       const end = start + bucketSize;
                       const count = filteredIncomeForCounts.filter((income: any) => {
                         const amount = income.amount || 0;
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
                 {(() => {
                   // Calculate the same range as the histogram for consistency
                   const filteredIncomeForSlider = incomeData.filter(income => {
                     // Apply search filter
                     if (incomeSearchTerm) {
                       const matchesSearch = income.userDisplayName.toLowerCase().includes(incomeSearchTerm.toLowerCase()) ||
                                            income.username.toLowerCase().includes(incomeSearchTerm.toLowerCase());
                       if (!matchesSearch) return false;
                     }
                     
                     // Apply role filter
                     if (incomeRoleFilter !== "all") {
                       const userData = users.find(u => u.uid === income.uid);
                       if (!userData || userData.userRole !== incomeRoleFilter) {
                         return false;
                       }
                     }
                     
                     // Apply date filters
                     if (incomeDateFrom) {
                       const incomeDate = new Date(income.timestamp);
                       const fromDate = new Date(incomeDateFrom);
                       if (incomeDate < fromDate) return false;
                     }
                     
                     if (incomeDateTo) {
                       const incomeDate = new Date(income.timestamp);
                       const toDate = new Date(incomeDateTo);
                       if (incomeDate > toDate) return false;
                     }
                     
                     return true;
                   });
                   
                   const incomeAmountsForSlider = filteredIncomeForSlider.map(income => income.amount || 0);
                   const sliderMin = incomeAmountsForSlider.length > 0 ? Math.floor(Math.min(...incomeAmountsForSlider)) : 0;
                   const sliderMax = incomeAmountsForSlider.length > 0 ? Math.ceil(Math.max(...incomeAmountsForSlider)) : 100;
                   
                   return (
                     <Slider
                       value={[
                         Math.max(sliderMin, incomeAmountRange[0]),
                         Math.min(sliderMax, incomeAmountRange[1])
                       ]}
                       onValueChange={(value: number[]) => {
                         setIncomeAmountRange(value as [number, number]);
                         setIncomeAmountInputs([
                           value[0].toFixed(2).replace('.', ','),
                           value[1].toFixed(2).replace('.', ',')
                         ]);
                       }}
                       min={sliderMin}
                       max={sliderMax}
                       step={0.01}
                       className="w-full"
                       aria-label="Εύρος ποσού εσόδων"
                       trackClassName="bg-gray-200 h-1"
                       rangeClassName="bg-yellow-400"
                       thumbClassName="bg-yellow-400 border-yellow-500 h-4 w-4 border-2"
                     />
                   );
                 })()}
                 {/* Quick range radio buttons */}
                 <div className="flex flex-col gap-1 mt-2" aria-label="Γρήγορη επιλογή εύρους">
                   {(() => {
                     // Use the same filteredIncomeForCounts as the histogram for consistency
                     const filteredIncomeForCounts = incomeData.filter(income => {
                       // Apply search filter
                       if (incomeSearchTerm) {
                         const matchesSearch = income.userDisplayName.toLowerCase().includes(incomeSearchTerm.toLowerCase()) ||
                                              income.username.toLowerCase().includes(incomeSearchTerm.toLowerCase());
                         if (!matchesSearch) return false;
                       }
                       
                       // Apply role filter
                       if (incomeRoleFilter !== "all") {
                         const userData = users.find(u => u.uid === income.uid);
                         if (!userData || userData.userRole !== incomeRoleFilter) {
                           return false;
                         }
                       }
                       
                       // Apply date filters
                       if (incomeDateFrom) {
                         const incomeDate = new Date(income.timestamp);
                         const fromDate = new Date(incomeDateFrom);
                         if (incomeDate < fromDate) return false;
                       }
                       
                       if (incomeDateTo) {
                         const incomeDate = new Date(income.timestamp);
                         const toDate = new Date(incomeDateTo);
                         if (incomeDate > toDate) return false;
                       }
                       
                       return true;
                     });
                     
                     // Calculate actual min and max income amounts from filtered data
                     const incomeAmounts = filteredIncomeForCounts.map(income => income.amount || 0);
                       const actualMinIncome = incomeAmounts.length > 0 ? Math.floor(Math.min(...incomeAmounts)) : 0;
                     const actualMaxIncome = incomeAmounts.length > 0 ? Math.ceil(Math.max(...incomeAmounts)) : 100;
                     
                     // Create 4 equally spaced intervals from actual min to actual max
                     const intervalSize = (actualMaxIncome - actualMinIncome) / 4;
                     const rawIntervals = [
                       [actualMinIncome, actualMinIncome + intervalSize],
                       [actualMinIncome + intervalSize, actualMinIncome + 2 * intervalSize],
                       [actualMinIncome + 2 * intervalSize, actualMinIncome + 3 * intervalSize],
                       [actualMinIncome + 3 * intervalSize, actualMaxIncome],
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
                     
                     const intervalCounts = intervals.map(([start, end], i) =>
                       filteredIncomeForCounts.filter((income: any) => {
                         const amount = income.amount || 0;
                         if (i === 0) return amount <= end;
                         if (i === 3) return amount >= start;
                         return amount > start - 0.01 && amount <= end;
                       }).length
                     );
                     
                     return intervals.map(([start, end], i) => {
                       const currentValue = `${incomeAmountRange[0]}-${incomeAmountRange[1]}`;
                       const optionValue = `${start}-${end}`;
                       const isSelected = currentValue === optionValue;
                       
                       const handleClick = () => {
                         if (isSelected) {
                           // If already selected, clear the selection (reset to full range)
                           // Use the actual income range with floor/ceil math
                           const actualMinIncome = incomeAmounts.length > 0 ? Math.floor(Math.min(...incomeAmounts)) : 0;
                           const actualMaxIncome = incomeAmounts.length > 0 ? Math.ceil(Math.max(...incomeAmounts)) : 100;
                           
                           setIncomeAmountRange([actualMinIncome, actualMaxIncome]);
                           setIncomeAmountInputs([
                             actualMinIncome.toString(),
                             actualMaxIncome.toString()
                           ]);
                         } else {
                           // If not selected, select this option
                           setIncomeAmountRange([start, end]);
                           setIncomeAmountInputs([
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