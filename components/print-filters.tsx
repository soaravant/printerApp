import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { GreekDatePicker } from "@/components/ui/greek-date-picker"
import { Filter, RotateCcw, X } from "lucide-react"

interface PrintFiltersProps {
  searchTerm: string
  setSearchTerm: (v: string) => void
  dateFrom: string
  setDateFrom: (v: string) => void
  dateTo: string
  setDateTo: (v: string) => void
  deviceFilter: string
  setDeviceFilter: (v: string) => void
  printTypeFilter: string
  setPrintTypeFilter: (v: string) => void
  uniqueDevices: string[]
  clearFilters: () => void
}

export const PrintFilters: React.FC<PrintFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  deviceFilter,
  setDeviceFilter,
  printTypeFilter,
  setPrintTypeFilter,
  uniqueDevices,
  clearFilters,
}) => {
  return (
    <div className="bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden mb-4">
      <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Filter className="h-5 w-5 text-blue-700" />
            </div>
            <h3 className="text-lg font-semibold text-blue-900">Φίλτρα Εκτυπώσεων</h3>
          </div>
          <button
            type="button"
            aria-label="Επαναφορά φίλτρων"
            className="p-2 rounded-full border border-blue-300 bg-white hover:bg-blue-50 transition"
            onClick={clearFilters}
          >
            <RotateCcw className="h-4 w-4 text-blue-600" />
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Row 1: Search and Printer */}
          <div className="md:col-span-2">
            <Label htmlFor="search" className="text-gray-700">Αναζήτηση</Label>
            <div className="relative">
              <Input
                id="search"
                placeholder="Αναζήτηση..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`border-gray-200 focus:border-blue-500 ${searchTerm ? "pr-10" : ""}`}
              />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <div className="md:col-span-1">
            <Label htmlFor="device" className="text-gray-700">Εκτυπωτής</Label>
            <Select value={deviceFilter} onValueChange={setDeviceFilter}>
              <SelectTrigger className="border-gray-200 focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Όλοι</SelectItem>
                {uniqueDevices.map((device) => (
                  <SelectItem key={device} value={device}>
                    {device}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Row 2: Date 1, Date 2, and Type */}
          <div className="md:col-span-1">
            <GreekDatePicker
              id="dateFrom"
              label="Από Ημερομηνία"
              value={dateFrom}
              onChange={setDateFrom}
            />
          </div>
          <div className="md:col-span-1">
            <GreekDatePicker
              id="dateTo"
              label="Έως Ημερομηνία"
              value={dateTo}
              onChange={setDateTo}
            />
          </div>
          <div className="md:col-span-1">
            <Label htmlFor="printType" className="text-gray-700">Είδος Εκτύπωσης</Label>
            <Select value={printTypeFilter} onValueChange={setPrintTypeFilter}>
              <SelectTrigger className="border-gray-200 focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Όλα</SelectItem>
                <SelectItem value="a4BW">A4 Ασπρόμαυρο</SelectItem>
                <SelectItem value="a4Color">A4 Έγχρωμο</SelectItem>
                <SelectItem value="a3BW">A3 Ασπρόμαυρο</SelectItem>
                <SelectItem value="a3Color">A3 Έγχρωμο</SelectItem>
                <SelectItem value="rizocharto">Ριζόχαρτο</SelectItem>
                <SelectItem value="chartoni">Χαρτόνι</SelectItem>
                <SelectItem value="autokollito">Αυτοκόλλητο</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
} 