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
    <div className="bg-white rounded-lg border border-blue-200 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="bg-blue-100 px-6 py-4 border-b border-blue-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Filter className="h-5 w-5 text-blue-700" />
            </div>
            <h3 className="text-lg font-semibold text-blue-900">
              Φίλτρα<br />
              ΤΟ. ΦΩ.
            </h3>
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
      <div className="p-6 flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          {/* Row 1: Search */}
          <div>
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
          
          {/* Row 2: Date From */}
          <div>
            <GreekDatePicker
              id="dateFrom"
              label="Από"
              value={dateFrom}
              onChange={setDateFrom}
            />
          </div>
          
          {/* Row 3: Date To */}
          <div>
            <GreekDatePicker
              id="dateTo"
              label="Έως"
              value={dateTo}
              onChange={setDateTo}
            />
          </div>
          
          {/* Row 4: Printer */}
          <div>
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
          
          {/* Row 5: Print Type */}
          <div>
            <Label htmlFor="printType" className="text-gray-700">Είδος Εκτύπωσης</Label>
            <Select 
              value={printTypeFilter} 
              onValueChange={setPrintTypeFilter}
              disabled={deviceFilter === "Canon B/W" || deviceFilter === "Brother" || deviceFilter === "Κυδωνιών"}
            >
              <SelectTrigger className={`border-gray-200 focus:border-blue-500 ${
                deviceFilter === "Canon B/W" || deviceFilter === "Brother" || deviceFilter === "Κυδωνιών"
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed" 
                  : ""
              }`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Όλα</SelectItem>
                <SelectItem value="a4BW">A4 Ασπρόμαυρο</SelectItem>
                <SelectItem value="a4Color">A4 Έγχρωμο</SelectItem>
                <SelectItem value="a3BW">A3 Ασπρόμαυρο</SelectItem>
                <SelectItem value="a3Color">A3 Έγχρωμο</SelectItem>
                <SelectItem value="rizochartoA3">Ριζόχαρτο A3</SelectItem>
                <SelectItem value="rizochartoA4">Ριζόχαρτο A4</SelectItem>
                <SelectItem value="chartoniA3">Χαρτόνι A3</SelectItem>
                <SelectItem value="chartoniA4">Χαρτόνι A4</SelectItem>
                <SelectItem value="autokollito">Αυτοκόλλητο</SelectItem>
              </SelectContent>
            </Select>
            {(deviceFilter === "Canon B/W" || deviceFilter === "Brother" || deviceFilter === "Κυδωνιών") && (
              <p className="text-xs text-gray-500 mt-1">
                Μόνο A4 Ασπρόμαυρο διαθέσιμο για αυτόν τον εκτυπωτή
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 