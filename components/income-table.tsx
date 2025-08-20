"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SimplePagination } from "@/components/ui/pagination"
import { SortableTableHeader } from "@/components/ui/sortable-table-header"
import { sortData, toggleSort, type SortConfig } from "@/lib/sort-utils"
import type { FirebaseIncome } from "@/lib/firebase-schema"

interface IncomeTableProps {
  data: FirebaseIncome[]
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
              className="text-center w-1/4"
            >
              Χρήστης
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="userDisplayName"
              currentSort={sortConfig}
              onSort={handleSort}
              className="text-center w-1/4"
            >
              Όνομα
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="amount"
              currentSort={sortConfig}
              onSort={handleSort}
              className="text-center w-1/4"
            >
              Ποσό
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="timestamp"
              currentSort={sortConfig}
              onSort={handleSort}
              className="text-center w-1/4"
            >
              Ημερομηνία
            </SortableTableHeader>
          </TableRow>
        </TableHeader>
      </Table>

      {/* Scrollable body only */}
      <div className={`${userRole === "Υπεύθυνος" ? "max-h-[500px]" : "max-h-[400px]"} overflow-y-auto`}>
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
                  <TableCell className="text-center align-middle w-1/4">{income.username}</TableCell>
                  <TableCell className="text-center align-middle w-1/4">{income.userDisplayName}</TableCell>
                  <TableCell className="text-center font-bold text-green-600 align-middle w-1/4">
                    {formatPrice(income.amount)}
                  </TableCell>
                  <TableCell className="text-center font-medium align-middle w-1/4">
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