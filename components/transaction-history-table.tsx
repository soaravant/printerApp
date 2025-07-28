"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Transaction } from "@/lib/dummy-database"

interface TransactionHistoryTableProps {
  data: Transaction[]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  userRole: string
}

export default function TransactionHistoryTable({ 
  data, 
  page, 
  pageSize, 
  onPageChange, 
  userRole 
}: TransactionHistoryTableProps) {
  const totalPages = Math.ceil(data.length / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = data.slice(startIndex, endIndex)

  const formatPrice = (price: number) => `€${price.toFixed(2).replace('.', ',')}`
  const formatDate = (date: Date) => date.toLocaleDateString("el-GR")

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-yellow-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-yellow-50">
            <TableRow>
              <TableHead className="text-yellow-900 font-semibold">Ημερομηνία</TableHead>
              <TableHead className="text-yellow-900 font-semibold">Χρήστης</TableHead>
              <TableHead className="text-yellow-900 font-semibold">Ποσό</TableHead>
              <TableHead className="text-yellow-900 font-semibold">Τύπος</TableHead>
              <TableHead className="text-yellow-900 font-semibold">Περιγραφή</TableHead>
              <TableHead className="text-yellow-900 font-semibold">Διαχειριστής</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  Δεν βρέθηκαν συναλλαγές
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((transaction) => (
                <TableRow key={transaction.transactionId} className="hover:bg-yellow-50">
                  <TableCell className="font-medium">
                    {formatDate(transaction.timestamp)}
                  </TableCell>
                  <TableCell>{transaction.userDisplayName}</TableCell>
                  <TableCell className={`font-bold ${
                    transaction.type === "payment" ? "text-green-600" : "text-red-600"
                  }`}>
                    {transaction.type === "payment" ? "+" : "-"}{formatPrice(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      transaction.type === "payment" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {transaction.type === "payment" ? "Πληρωμή" : "Επιστροφή"}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {transaction.description || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {transaction.adminDisplayName}
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
            Εμφάνιση {startIndex + 1}-{Math.min(endIndex, data.length)} από {data.length} συναλλαγές
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