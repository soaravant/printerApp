"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SimplePagination } from "@/components/ui/pagination"
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
    <div className="border rounded-lg flex flex-col h-full">
      {/* Fixed (non-scrolling) header */}
      <Table className="min-w-full">
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
      </Table>

      {/* Scrollable body only */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <Table className="min-w-full">
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  Δεν βρέθηκαν έσοδα
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((income) => (
                <TableRow key={income.incomeId} className="hover:bg-yellow-50 cursor-pointer transition-colors duration-200">
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

      <SimplePagination page={page} total={sortedData.length} pageSize={pageSize} onPageChange={onPageChange} />
    </div>
  )
} 