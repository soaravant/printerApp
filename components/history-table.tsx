"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Settings, X } from "lucide-react"

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

export interface ColumnConfig {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
  className?: string
}

// Shared column definition for consistent widths
const HistoryColGroup = ({ columns }: { columns: ColumnConfig[] }) => (
  <colgroup>
    {columns.map((_, index) => (
      <col key={index} style={{ width: `${100 / columns.length}%` }} />
    ))}
  </colgroup>
)

interface HistoryTableProps {
  data: any[]
  columns: ColumnConfig[]
  filterConfig: FilterConfig
  title: string
  description?: string
  maxHeight?: string
}

export function HistoryTable({
  data,
  columns,
  filterConfig,
  title,
  description,
  maxHeight = "400px",
}: HistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [customFilters, setCustomFilters] = useState<Record<string, string>>({})
  const [filteredData, setFilteredData] = useState(data)

  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => current?.[key], obj)
  }

  const applyFilters = () => {
    let filtered = [...data]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        filterConfig.searchFields.some((field) => {
          const value = getNestedValue(item, field)
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        }),
      )
    }

    // Date range filter
    if (filterConfig.dateField && (dateFrom || dateTo)) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(getNestedValue(item, filterConfig.dateField!))
        const fromDate = dateFrom ? new Date(dateFrom) : null
        const toDate = dateTo ? new Date(dateTo) : null

        if (fromDate && itemDate < fromDate) return false
        if (toDate && itemDate > toDate) return false
        return true
      })
    }

    // Status filter
    if (filterConfig.statusField && statusFilter !== "all") {
      filtered = filtered.filter((item) => {
        const status = getNestedValue(item, filterConfig.statusField!)
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
        filtered = filtered.filter((item) => {
          const itemValue = getNestedValue(item, field)
          return itemValue === value
        })
      }
    })

    setFilteredData(filtered)
  }

  useEffect(() => {
    applyFilters()
  }, [searchTerm, dateFrom, dateTo, statusFilter, customFilters, data])

  const clearFilters = () => {
    setSearchTerm("")
    setDateFrom("")
    setDateTo("")
    setStatusFilter("all")
    setCustomFilters({})
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
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
          {filterConfig.dateField && (
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
          {filterConfig.dateField && (
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
          {filterConfig.statusField && filterConfig.statusOptions && (
            <div className="space-y-2">
              <Label htmlFor="status">Κατάσταση</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Όλες</SelectItem>
                  {filterConfig.statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Filters */}
          {filterConfig.customFilters?.map((filter) => (
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

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <Button onClick={clearFilters} variant="outline" size="sm" className="w-full bg-transparent">
              <X className="h-4 w-4 mr-2" />
              Καθαρισμός
            </Button>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600">
          Εμφάνιση {filteredData.length} από {data.length} αποτελέσματα
        </div>

        {/* Fixed header and scrollable body */}
        <div className="border rounded-lg">
          {/* Fixed (non-scrolling) header */}
          <Table className="min-w-full table-fixed">
            <HistoryColGroup columns={columns} />
            <TableHeader className="bg-gray-100">
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.className}>
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          </Table>

          {/* Scrollable body only */}
          <div style={{ maxHeight, overflowY: "auto" }}>
            <Table className="min-w-full table-fixed">
              <HistoryColGroup columns={columns} />
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                      Δεν βρέθηκαν αποτελέσματα
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((row, index) => (
                    <TableRow key={index}>
                      {columns.map((column) => (
                        <TableCell key={column.key} className={column.className}>
                          {column.render
                            ? column.render(getNestedValue(row, column.key), row)
                            : getNestedValue(row, column.key)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
