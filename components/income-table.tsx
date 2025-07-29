"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { SortableTableHeader } from "@/components/ui/sortable-table-header"
import { sortData, toggleSort, type SortConfig } from "@/lib/sort-utils"
import type { Income } from "@/lib/dummy-database"

interface IncomeTableProps {
  data: Income[]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  userRole: string
}

export default function IncomeTable({ 
  data, 
  page, 
  pageSize, 
  onPageChange, 
  userRole 
}: IncomeTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [sortedData, setSortedData] = useState(data)

  useEffect(() => {
    setSortedData(sortData(data, sortConfig))
  }, [data, sortConfig])

  const handleSort = (key: string) => {
    const newSortConfig = toggleSort(sortConfig, key)
    setSortConfig(newSortConfig)
  }

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = sortedData.slice(startIndex, endIndex)

  const formatPrice = (price: number) => `€${price.toFixed(2).replace('.', ',')}`
  const formatDate = (date: Date) => date.toLocaleDateString("el-GR")

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <SortableTableHeader
                sortKey="username"
                currentSort={sortConfig}
                onSort={handleSort}
                className="text-center"
              >
                Χρήστης
              </SortableTableHeader>
              <SortableTableHeader
                sortKey="userDisplayName"
                currentSort={sortConfig}
                onSort={handleSort}
                className="text-center"
              >
                Όνομα
              </SortableTableHeader>
              <SortableTableHeader
                sortKey="amount"
                currentSort={sortConfig}
                onSort={handleSort}
                className="text-center"
              >
                Ποσό
              </SortableTableHeader>
              <SortableTableHeader
                sortKey="timestamp"
                currentSort={sortConfig}
                onSort={handleSort}
                className="text-center"
              >
                Ημερομηνία
              </SortableTableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                  Δεν βρέθηκαν έσοδα
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((income) => (
                <TableRow key={income.incomeId} className="hover:bg-yellow-50">
                  <TableCell className="text-center">{income.username}</TableCell>
                  <TableCell className="text-center">{income.userDisplayName}</TableCell>
                  <TableCell className="text-center font-bold text-green-600">
                    {formatPrice(income.amount)}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {formatDate(income.timestamp)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
              Εμφάνιση {startIndex + 1}-{Math.min(endIndex, sortedData.length)} από {sortedData.length} έσοδα
            </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-700">
              Σελίδα {page} από {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 