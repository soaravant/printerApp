import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Filter, RotateCcw } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getDynamicFilterOptions } from "@/lib/utils"

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
  billingPriceDistribution: any
  printBilling: any[]
  users: any[]
  clearFilters: () => void
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
  billingPriceDistribution,
  printBilling,
  users,
  clearFilters,
}) => {
  return (
    <div className="bg-white rounded-lg border border-yellow-200 shadow-sm overflow-hidden mb-4">
      <div className="bg-yellow-100 px-6 py-4 border-b border-yellow-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-50 p-2 rounded-lg">
              <Filter className="h-5 w-5 text-yellow-700" />
            </div>
            <h3 className="text-lg font-semibold text-yellow-900">Φίλτρα Συγκεντρωτικού Πίνακα</h3>
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
        <div className="grid grid-cols-1 md:grid-cols-10 gap-4 mb-6">
          {/* Column 1: Search and Role */}
          <div className="flex flex-col justify-between md:col-span-3" style={{ minHeight: '120px' }}>
            {/* Row 1: Search */}
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
            {/* Row 2: Role */}
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
          </div>
          {/* Column 2: Συνολικό Χρέος Filter */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden md:col-span-7">
            <div className="p-2 px-4">
              <div className="relative w-full mb-1" style={{ minHeight: '20px' }}>
                <label className="absolute left-0 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-700 whitespace-nowrap" style={{ zIndex: 1 }}>
                  Συνολικό Χρέος
                </label>
                <div className="flex justify-center">
                  <div className="flex flex-wrap items-center gap-3">
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
                      className="w-24 h-7 text-sm border-gray-300 rounded-md text-center focus:border-yellow-500"
                      min={0}
                      max={billingPriceRange[1]}
                    />
                    <span className="text-base">€</span>
                    <span className="mx-1 text-gray-400 text-lg">-</span>
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
                      className="w-24 h-7 text-sm border-gray-300 rounded-md text-center focus:border-yellow-500"
                      min={billingPriceRange[0]}
                      max={billingPriceDistribution.max}
                    />
                    <span className="text-base">€</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-end justify-between h-8 mb-0 px-1">
                  {/* Histogram bar distribution */}
                  {(() => {
                    const NUM_BUCKETS = 16;
                    const bucketSize = (billingPriceDistribution.max - billingPriceDistribution.min) / NUM_BUCKETS;
                    const buckets = Array.from({ length: NUM_BUCKETS }, (_, i) => {
                      const start = billingPriceDistribution.min + i * bucketSize;
                      const end = start + bucketSize;
                      const count = printBilling.filter((b: any) => {
                        const amount = b.remainingBalance;
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
                <RadioGroup
                  value={`${billingPriceRange[0]}-${billingPriceRange[1]}`}
                  onValueChange={(value: string) => {
                    const [min, max] = value.split('-').map((v: string) => parseFloat(v));
                    setBillingPriceRange([min, max]);
                    setBillingPriceRangeInputs([
                      min.toFixed(2).replace('.', ','),
                      max.toFixed(2).replace('.', ',')
                    ]);
                  }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-1 mt-2"
                  aria-label="Γρήγορη επιλογή εύρους"
                >
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
                    const intervalCounts = intervals.map(([start, end], i) =>
                      printBilling.filter((b: any) => {
                        const amount = b.remainingBalance;
                        if (i === 0) return amount <= end;
                        if (i === 3) return amount >= start;
                        return amount > start - 0.01 && amount <= end;
                      }).length
                    );
                    return intervals.map(([start, end], i) => (
                      <div className="flex items-center" key={i}>
                        <RadioGroupItem value={`${start}-${end}`} id={`billing-range-${i}`} className="sr-only" />
                        <Label 
                          htmlFor={`billing-range-${i}`} 
                          className={`text-sm px-3 py-1 rounded-full border cursor-pointer transition ${
                            billingPriceRange[0] === start && billingPriceRange[1] === end 
                              ? 'bg-yellow-100 border-yellow-400 text-yellow-800 font-semibold' 
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          {intervalLabels[i]} ({intervalCounts[i]})
                        </Label>
                      </div>
                    ));
                  })()}
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 