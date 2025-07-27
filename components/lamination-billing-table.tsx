import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SimplePagination } from "@/components/ui/pagination"
import { Calendar } from "lucide-react"
import { SortableTableHeader } from "@/components/ui/sortable-table-header"
import { sortData, toggleSort, type SortConfig } from "@/lib/sort-utils"
import { useState, useEffect } from "react"
import type { LaminationBilling } from "@/lib/dummy-database"

// Shared column definition for consistent widths
const LaminationBillingColGroup = ({ userRole }: { userRole: string }) => (
  <colgroup>
    <col style={{ width: "10%" }} />
    {userRole === "admin" && <col style={{ width: "12%" }} />}
    {userRole === "admin" && <col style={{ width: "10%" }} />}
    <col style={{ width: "8%" }} />
    <col style={{ width: "8%" }} />
    <col style={{ width: "10%" }} />
    <col style={{ width: "10%" }} />
    <col style={{ width: "12%" }} />
    <col style={{ width: "10%" }} />
    <col style={{ width: "10%" }} />
    <col style={{ width: "10%" }} />
    <col style={{ width: "10%" }} />
  </colgroup>
)

interface LaminationBillingTableProps {
  data: LaminationBilling[]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  userRole: string
}

export default function LaminationBillingTable({ data, page, pageSize, onPageChange, userRole }: LaminationBillingTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [sortedData, setSortedData] = useState(data)

  useEffect(() => {
    setSortedData(sortData(data, sortConfig))
  }, [data, sortConfig])

  const handleSort = (key: string) => {
    const newSortConfig = toggleSort(sortConfig, key)
    setSortConfig(newSortConfig)
  }

  const formatPrice = (price: number) => `€${price.toFixed(2).replace('.', ',')}`
  
  return (
    <div className="border rounded-lg">
      {/* Fixed (non-scrolling) header */}
      <Table className="min-w-full table-fixed">
        <LaminationBillingColGroup userRole={userRole} />
        <TableHeader className="bg-gray-100">
          <TableRow>
            <SortableTableHeader
              sortKey="period"
              currentSort={sortConfig}
              onSort={handleSort}
              className="font-medium"
            >
              Περίοδος
            </SortableTableHeader>
            {userRole === "admin" && (
              <SortableTableHeader
                sortKey="userDisplayName"
                currentSort={sortConfig}
                onSort={handleSort}
              >
                Χρήστης
              </SortableTableHeader>
            )}
            {userRole === "admin" && (
              <SortableTableHeader
                sortKey="department"
                currentSort={sortConfig}
                onSort={handleSort}
              >
                Τμήμα
              </SortableTableHeader>
            )}
            <SortableTableHeader
              sortKey="totalA3"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              A3
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="totalA4"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              A4
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="totalCardSmall"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Κάρτα Μικρή
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="totalCardLarge"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Κάρτα Μεγάλη
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="totalCost"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Συνολικό Κόστος
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="paidAmount"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Πληρωμένο
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="remainingBalance"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Υπόλοιπο
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="dueDate"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Ημ. Εξόφλησης
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="paid"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Κατάσταση
            </SortableTableHeader>
          </TableRow>
        </TableHeader>
      </Table>

      {/* Scrollable body only */}
      <div className="max-h-[400px] overflow-y-auto">
        <Table className="min-w-full table-fixed">
          <LaminationBillingColGroup userRole={userRole} />
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={userRole === "admin" ? 12 : 10} className="text-center py-8 text-gray-500">
                  Δεν βρέθηκαν αποτελέσματα
                </TableCell>
              </TableRow>
            ) : (
              sortedData.slice((page-1)*pageSize, page*pageSize).map((billing: LaminationBilling) => (
                <TableRow key={billing.billingId}>
                  <TableCell className="text-center font-medium">{billing.period}</TableCell>
                  {userRole === "admin" && <TableCell className="text-center">{billing.userDisplayName}</TableCell>}
                  {userRole === "admin" && <TableCell className="text-center">{billing.department}</TableCell>}
                  <TableCell className="text-center">{billing.totalA3}</TableCell>
                  <TableCell className="text-center">{billing.totalA4}</TableCell>
                  <TableCell className="text-center">{billing.totalCardSmall}</TableCell>
                  <TableCell className="text-center">{billing.totalCardLarge}</TableCell>
                  <TableCell className="text-center">{formatPrice(billing.totalCost)}</TableCell>
                  <TableCell className="text-center">{formatPrice(billing.paidAmount)}</TableCell>
                  <TableCell className={`text-center ${billing.remainingBalance > 0 ? "text-red-600 font-semibold" : "text-green-600"}`}>
                    {formatPrice(billing.remainingBalance)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {billing.dueDate.toLocaleDateString("el-GR")}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={billing.paid ? "default" : "destructive"}>
                      {billing.paid ? "Πληρωμένο" : "Απλήρωτο"}
                    </Badge>
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