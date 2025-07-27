import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SimplePagination } from "@/components/ui/pagination"
import { Calendar } from "lucide-react"
import type { PrintBilling, User } from "@/lib/dummy-database"
import { dummyDB } from "@/lib/dummy-database"
import { SortableTableHeader } from "@/components/ui/sortable-table-header"
import { sortData, toggleSort, type SortConfig } from "@/lib/sort-utils"
import { useState, useEffect } from "react"

// Shared column definition for consistent widths
const BillingColGroup = () => (
  <colgroup>
    <col style={{ width: "15%" }} />
    <col style={{ width: "25%" }} />
    <col style={{ width: "25%" }} />
    <col style={{ width: "15%" }} />
    <col style={{ width: "20%" }} />
  </colgroup>
)

interface PrintBillingTableProps {
  data: PrintBilling[]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  userRole: string
}

export default function PrintBillingTable({ data, page, pageSize, onPageChange, userRole }: PrintBillingTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [sortedData, setSortedData] = useState(data)

  useEffect(() => {
    if (!sortConfig) {
      setSortedData(data)
      return
    }

    // Custom sort for print billing data
    const sorted = [...data].sort((a, b) => {
      const aValue = getSortValue(a, sortConfig.key)
      const bValue = getSortValue(b, sortConfig.key)

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1

      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc' 
          ? aValue.getTime() - bValue.getTime() 
          : bValue.getTime() - aValue.getTime()
      }

      // Handle string values
      const aString = String(aValue).toLowerCase()
      const bString = String(bValue).toLowerCase()
      
      if (sortConfig.direction === 'asc') {
        return aString.localeCompare(bString, 'el')
      } else {
        return bString.localeCompare(aString, 'el')
      }
    })

    setSortedData(sorted)
  }, [data, sortConfig])

  const getSortValue = (billing: PrintBilling, key: string): any => {
    switch (key) {
      case 'userRole':
        const userData = dummyDB.getUserById(billing.uid)
        return userData?.userRole || ""
      case 'responsiblePerson':
        const user = dummyDB.getUserById(billing.uid)
        return user?.userRole === "Άτομο" 
          ? user.displayName 
          : user?.responsiblePerson || ""
      case 'lastPayment':
        return billing.lastPayment
      default:
        return (billing as any)[key]
    }
  }

  const handleSort = (key: string) => {
    const newSortConfig = toggleSort(sortConfig, key)
    setSortConfig(newSortConfig)
  }

  const formatPrice = (price: number) => `€${price.toFixed(2).replace('.', ',')}`
  
  // Helper function to get user data for each billing record
  const getUserData = (uid: string): User | undefined => {
    return dummyDB.getUserById(uid)
  }
  
  return (
    <div className="border rounded-lg">
      {/* Fixed (non-scrolling) header */}
      <Table className="min-w-full table-fixed">
        <BillingColGroup />
        <TableHeader className="bg-gray-100">
          <TableRow>
            <SortableTableHeader
              sortKey="userRole"
              currentSort={sortConfig}
              onSort={handleSort}
              className="font-medium"
            >
              Ρόλος
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="userDisplayName"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Όνομα
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="responsiblePerson"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Υπεύθυνος
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="remainingBalance"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Συνολικό Χρέος
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="lastPayment"
              currentSort={sortConfig}
              onSort={handleSort}
              className="whitespace-nowrap"
            >
              Τελευταία Εξόφληση
            </SortableTableHeader>
          </TableRow>
        </TableHeader>
      </Table>

      {/* Scrollable body only */}
      <div className="max-h-[400px] overflow-y-auto">
        <Table className="min-w-full table-fixed">
          <BillingColGroup />
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Δεν βρέθηκαν αποτελέσματα
                </TableCell>
              </TableRow>
            ) : (
              sortedData.slice((page-1)*pageSize, page*pageSize).map((billing: PrintBilling) => {
                const userData = getUserData(billing.uid)
                const responsiblePerson = userData?.userRole === "Άτομο" 
                  ? userData.displayName 
                  : userData?.responsiblePerson || "-"
                
                return (
                  <TableRow key={billing.billingId}>
                    <TableCell className="text-center font-medium">{userData?.userRole || "-"}</TableCell>
                    <TableCell className="text-center">{billing.userDisplayName}</TableCell>
                    <TableCell className="text-center">{responsiblePerson}</TableCell>
                    <TableCell className={`text-center ${billing.remainingBalance > 0 ? "text-red-600 font-semibold" : "text-green-600"}`}>
                      {formatPrice(billing.remainingBalance)}
                    </TableCell>
                    <TableCell className="text-center">
                      {billing.lastPayment ? (
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {billing.lastPayment.toLocaleDateString("el-GR")}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

              <SimplePagination page={page} total={sortedData.length} pageSize={pageSize} onPageChange={onPageChange} />
    </div>
  )
} 