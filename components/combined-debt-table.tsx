import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SimplePagination } from "@/components/ui/pagination"
import { Calendar } from "lucide-react"
import { SortableTableHeader } from "@/components/ui/sortable-table-header"
import { sortData, toggleSort, type SortConfig } from "@/lib/sort-utils"
import { useState, useEffect } from "react"

// Shared column definition with minimum widths
const CombinedDebtColGroup = () => (
  <colgroup>
    <col style={{ minWidth: "120px" }} />
    <col style={{ minWidth: "150px" }} />
    <col style={{ minWidth: "150px" }} />
    <col style={{ minWidth: "200px" }} />
    <col style={{ minWidth: "180px" }} />
  </colgroup>
)

interface CombinedDebtData {
  uid: string
  userDisplayName: string
  userRole: string
  responsiblePerson: string
  printDebt: number
  laminationDebt: number
  totalDebt: number
  lastPayment: Date | null
}

interface CombinedDebtTableProps {
  data: CombinedDebtData[]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  userRole: string
  onRowHover?: (hoveredJob: { deviceName: string; printType: string } | null) => void
}

export default function CombinedDebtTable({ data, page, pageSize, onPageChange, userRole, onRowHover }: CombinedDebtTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [sortedData, setSortedData] = useState(data)

  useEffect(() => {
    if (!sortConfig) {
      setSortedData(data)
      return
    }

    // Custom sort for combined debt data
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

  const getSortValue = (item: CombinedDebtData, key: string): any => {
    switch (key) {
      case 'userRole':
        return item.userRole
      case 'responsiblePerson':
        return item.responsiblePerson
      case 'lastPayment':
        return item.lastPayment
      default:
        return (item as any)[key]
    }
  }

  const handleSort = (key: string) => {
    const newSortConfig = toggleSort(sortConfig, key)
    setSortConfig(newSortConfig)
  }

  const formatPrice = (price: number) => `€${price.toFixed(2).replace('.', ',')}`
  
  return (
    <div className="border rounded-lg">
      {/* Fixed (non-scrolling) header */}
      <Table className="min-w-full">
        <CombinedDebtColGroup />
        <TableHeader className="bg-gray-100">
          <TableRow>
            <SortableTableHeader
              sortKey="userRole"
              currentSort={sortConfig}
              onSort={handleSort}
              className="font-medium text-center"
            >
              Ρόλος
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
              sortKey="responsiblePerson"
              currentSort={sortConfig}
              onSort={handleSort}
              className="text-center"
            >
              Υπεύθυνος
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="totalDebt"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              <div className="text-center">
                <div>Τρέχον Χρέος/Πίστωση</div>
                <div className="text-xs font-normal text-gray-600">ΤΟ. ΦΩ. | ΠΛΑ. ΤΟ. | Σύνολο</div>
              </div>
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="lastPayment"
              currentSort={sortConfig}
              onSort={handleSort}
              className="whitespace-nowrap text-center"
            >
              Τελευταία Εξόφληση
            </SortableTableHeader>
          </TableRow>
        </TableHeader>
      </Table>

      {/* Scrollable body only */}
      <div className="max-h-[400px] overflow-y-auto">
        <Table className="min-w-full">
          <CombinedDebtColGroup />
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Δεν βρέθηκαν αποτελέσματα
                </TableCell>
              </TableRow>
            ) : (
              sortedData.slice((page-1)*pageSize, page*pageSize).map((item: CombinedDebtData) => (
                <TableRow 
                  key={item.uid}
                  className="hover:bg-yellow-50 cursor-pointer transition-colors duration-200"
                  onMouseEnter={() => onRowHover?.({ deviceName: "billing", printType: "combined" })}
                  onMouseLeave={() => onRowHover?.(null)}
                >
                  <TableCell className="text-center font-medium">{item.userRole}</TableCell>
                  <TableCell className="text-center">{item.userDisplayName}</TableCell>
                  <TableCell className="text-center">{item.responsiblePerson}</TableCell>
                  <TableCell className={`text-center ${item.totalDebt > 0 ? "text-red-600 font-bold" : "text-green-600 font-bold"}`}>
                    <div className="text-center">
                      <div className="text-sm">
                        <span className={`${item.printDebt > 0 ? "text-red-600" : "text-green-600"} font-normal`}>
                          {item.printDebt > 0 ? formatPrice(item.printDebt) : item.printDebt < 0 ? `-${formatPrice(Math.abs(item.printDebt))}` : formatPrice(item.printDebt)}
                        </span>
                        {" | "}
                        <span className={`${item.laminationDebt > 0 ? "text-red-600" : "text-green-600"} font-normal`}>
                          {item.laminationDebt > 0 ? formatPrice(item.laminationDebt) : item.laminationDebt < 0 ? `-${formatPrice(Math.abs(item.laminationDebt))}` : formatPrice(item.laminationDebt)}
                        </span>
                        {" | "}
                        <span className={`${item.totalDebt > 0 ? "text-red-600" : "text-green-600"} font-bold`}>
                          {item.totalDebt > 0 ? formatPrice(item.totalDebt) : item.totalDebt < 0 ? `-${formatPrice(Math.abs(item.totalDebt))}` : formatPrice(item.totalDebt)}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.lastPayment ? (
                      <div className="flex items-center justify-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {item.lastPayment.toLocaleDateString("el-GR")}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
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