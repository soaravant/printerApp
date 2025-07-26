"use client"

import React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, X } from "lucide-react"

export interface FilterConfig {
  searchFields: string[]
  dateField?: string
  statusField?: string
  statusOptions?: { value: string; label: string }[]
  customFilters?: {
    field: string
    label: string
    options: { value: string; label: string }[]
  }[]
}

interface HistoryFilterProps {
  data: any[]
  config: FilterConfig
  onFilteredData: (filteredData: any[]) => void
  title?: string
}

export function HistoryFilter({ data, config, onFilteredData, title = "Φίλτρα" }: HistoryFilterProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [customFilters, setCustomFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)

  const applyFilters = () => {
    let filtered = [...data]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        config.searchFields.some((field) => {
          const value = getNestedValue(item, field)
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        }),
      )
    }

    // Date range filter
    if (config.dateField && (dateFrom || dateTo)) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(getNestedValue(item, config.dateField))
        const fromDate = dateFrom ? new Date(dateFrom) : null
        const toDate = dateTo ? new Date(dateTo) : null

        if (fromDate && itemDate < fromDate) return false
        if (toDate && itemDate > toDate) return false
        return true
      })
    }

    // Status filter
    if (config.statusField && statusFilter !== "all") {
      filtered = filtered.filter((item) => {
        const status = getNestedValue(item, config.statusField)
        return (
          status === statusFilter ||
          (statusFilter === "paid" && status === true) ||
          (statusFilter === "unpaid" && status === false)
        )
      })
    }

    // Custom filters
    Object.entries(customFilters).forEach(([field, value]) => {
      if (value !== "all" && value !== "") {
        filtered = filtered.filter((item) => getNestedValue(item, field) === value)
      }
    })

    onFilteredData(filtered)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setDateFrom("")
    setDateTo("")
    setStatusFilter("all")
    setCustomFilters({})
    onFilteredData(data)
  }

  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => current?.[key], obj)
  }

  // Apply filters whenever any filter changes
  React.useEffect(() => {
    applyFilters()
  }, [searchTerm, dateFrom, dateTo, statusFilter, customFilters, data])

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {title}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Αναζήτηση</Label>
              <Input
                id="search"
                placeholder="Αναζήτηση..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Date From */}
            {config.dateField && (
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Από Ημερομηνία</Label>
                <Input 
                  id="dateFrom" 
                  type="date" 
                  value={dateFrom} 
                  onChange={(e) => setDateFrom(e.target.value)}
                  lang="el-GR"
                />
              </div>
            )}

            {/* Date To */}
            {config.dateField && (
              <div className="space-y-2">
                <Label htmlFor="dateTo">Έως Ημερομηνία</Label>
                <Input 
                  id="dateTo" 
                  type="date" 
                  value={dateTo} 
                  onChange={(e) => setDateTo(e.target.value)}
                  lang="el-GR"
                />
              </div>
            )}

            {/* Status Filter */}
            {config.statusField && config.statusOptions && (
              <div className="space-y-2">
                <Label htmlFor="status">Κατάσταση</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Όλες</SelectItem>
                    {config.statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom Filters */}
            {config.customFilters?.map((filter) => (
              <div key={filter.field} className="space-y-2">
                <Label htmlFor={filter.field}>{filter.label}</Label>
                <Select
                  value={customFilters[filter.field] || "all"}
                  onValueChange={(value) => setCustomFilters((prev) => ({ ...prev, [filter.field]: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Όλα</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={clearFilters} variant="outline" size="sm">
              Καθαρισμός Φίλτρων
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
