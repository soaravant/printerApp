import React from "react"
import { Input } from "@/components/ui/input"
import { ClearableInput } from "@/components/ui/clearable-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { GreekDatePicker } from "@/components/ui/greek-date-picker"
import { Filter, RotateCcw, X } from "lucide-react"

interface LaminationFiltersProps {
  searchTerm: string
  setSearchTerm: (v: string) => void
  dateFrom: string
  setDateFrom: (v: string) => void
  dateTo: string
  setDateTo: (v: string) => void
  machineFilter: string
  setMachineFilter: (v: string) => void
  laminationTypeFilter: string
  setLaminationTypeFilter: (v: string) => void
  clearFilters: () => void
}

export const LaminationFilters: React.FC<LaminationFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  machineFilter,
  setMachineFilter,
  laminationTypeFilter,
  setLaminationTypeFilter,
  clearFilters,
}) => {
  const [localSearch, setLocalSearch] = React.useState(searchTerm)
  React.useEffect(() => {
    setLocalSearch(searchTerm)
  }, [searchTerm])
  React.useEffect(() => {
    const t = setTimeout(() => setSearchTerm(localSearch), 200)
    return () => clearTimeout(t)
  }, [localSearch, setSearchTerm])
  return (
    <div className="bg-white rounded-lg border border-green-200 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="bg-green-100 px-6 py-4 border-b border-green-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2 rounded-lg">
              <Filter className="h-5 w-5 text-green-700" />
            </div>
            <h3 className="text-lg font-semibold text-green-900">
              Φίλτρα<br />
              ΠΛΑ. ΤΟ.
            </h3>
          </div>
          <button
            type="button"
            aria-label="Επαναφορά φίλτρων"
            className="p-2 rounded-full border border-green-300 bg-white hover:bg-green-50 transition"
            onClick={clearFilters}
          >
            <RotateCcw className="h-4 w-4 text-green-600" />
          </button>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          {/* Row 1: Search */}
          <div>
            <Label htmlFor="search" className="text-gray-700">Αναζήτηση</Label>
            <ClearableInput
              id="search"
              placeholder="Αναζήτηση..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onClear={() => setLocalSearch("")}
              className={`border-gray-200 focus:border-green-500`}
              hasValue={Boolean(localSearch)}
            />
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
          
          {/* Row 4: Machine */}
          <div>
            <Label htmlFor="machine" className="text-gray-700">Μηχάνημα</Label>
            <Select value={machineFilter} onValueChange={setMachineFilter}>
              <SelectTrigger className="border-gray-200 focus:border-green-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <style jsx>{`
                  [data-radix-select-item] {
                    background-color: rgb(240 253 244) !important;
                  }
                `}</style>
                <SelectItem value="all">Όλα</SelectItem>
                <SelectItem value="lamination">Πλαστικοποίηση</SelectItem>
                <SelectItem value="binding">Βιβλιοδεσία</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Row 5: Type */}
          <div>
            <Label htmlFor="laminationType" className="text-gray-700">
              Είδος {machineFilter === "binding" ? "Βιβλιοδεσίας" : machineFilter === "lamination" ? "Πλαστικοποίησης" : "Εργασίας"}
            </Label>
            <Select value={laminationTypeFilter} onValueChange={setLaminationTypeFilter}>
              <SelectTrigger className="border-gray-200 focus:border-green-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <style jsx>{`
                  [data-radix-select-item] {
                    background-color: rgb(240 253 244) !important;
                  }
                `}</style>
                <SelectItem value="all">Όλα</SelectItem>
                {machineFilter === "binding" ? (
                  <>
                    <SelectItem value="spiral">Σπιράλ</SelectItem>
                    <SelectItem value="colored_cardboard">Χρωματιστά Χαρτόνια</SelectItem>
                    <SelectItem value="plastic_cover">Πλαστικό Κάλυμμα</SelectItem>
                  </>
                ) : machineFilter === "lamination" ? (
                  <>
                    <SelectItem value="A3">A3</SelectItem>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A5">A5</SelectItem>
                    <SelectItem value="cards">Κάρτες</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="A3">A3</SelectItem>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A5">A5</SelectItem>
                    <SelectItem value="cards">Κάρτες</SelectItem>
                    <SelectItem value="spiral">Σπιράλ</SelectItem>
                    <SelectItem value="colored_cardboard">Χρωματιστά Χαρτόνια</SelectItem>
                    <SelectItem value="plastic_cover">Πλαστικό Κάλυμμα</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
} 