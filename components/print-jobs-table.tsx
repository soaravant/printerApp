import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SimplePagination } from "@/components/ui/pagination"
import { Calendar } from "lucide-react"
import { SortableTableHeader } from "@/components/ui/sortable-table-header"
import { sortData, toggleSort, type SortConfig } from "@/lib/sort-utils"
import { useState, useEffect } from "react"
import type { FirebasePrintJob } from "@/lib/firebase-schema"

// Shared column definition for consistent widths
function PrintJobsColGroup({ userRole }: { userRole: string }) {
  return (
    <colgroup>
      <col className="w-[140px]" />
      {userRole === "Διαχειριστής" && <col className="w-[100px]" />}
      {userRole === "Διαχειριστής" && <col className="w-[120px]" />}
      <col className="w-[120px]" />
      <col className="w-[120px]" />
      <col className="w-[80px]" />
      <col className="w-[100px]" />
    </colgroup>
  )
}

interface PrintJobsTableProps {
  data: FirebasePrintJob[]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  userRole: string
  onRowHover?: (hoveredJob: { deviceName: string; printType: string } | null) => void
  printTypeFilter?: string // New prop for filtering expanded rows
  hasMore?: boolean
}

// Helper function to get print type label
const getPrintTypeLabel = (type: string) => {
  switch (type) {
    case "A4BW": return "A4 Ασπρόμαυρο"
    case "A4Color": return "A4 Έγχρωμο"
    case "A3BW": return "A3 Ασπρόμαυρο"
    case "A3Color": return "A3 Έγχρωμο"
    case "RizochartoA3": return "Ριζόχαρτο A3"
    case "RizochartoA4": return "Ριζόχαρτο A4"
    case "ChartoniA3": return "Χαρτόνι A3"
    case "ChartoniA4": return "Χαρτόνι A4"
    case "Autokollito": return "Αυτοκόλλητο"
    default: return type
  }
}

// Helper function to convert print job to display format
const convertPrintJobToDisplay = (job: FirebasePrintJob) => {
  return {
    ...job,
    printType: getPrintTypeLabel(job.type),
    quantity: job.quantity,
    cost: job.totalCost,
    originalJobId: job.jobId,
    rowId: job.jobId
  }
}

// Helper function to filter rows by print type
const filterRowsByType = (rows: any[], printTypeFilter: string) => {
  if (!printTypeFilter || printTypeFilter === "all") {
    return rows
  }
  
  const filterMap: { [key: string]: string } = {
    "a4BW": "A4BW",
    "a4Color": "A4Color",
    "a3BW": "A3BW",
    "a3Color": "A3Color",
    "rizochartoA3": "RizochartoA3",
    "rizochartoA4": "RizochartoA4",
    "chartoniA3": "ChartoniA3",
    "chartoniA4": "ChartoniA4",
    "autokollito": "Autokollito"
  }
  
  const targetType = filterMap[printTypeFilter]
  if (!targetType) {
    return rows
  }
  
  return rows.filter(row => row.type === targetType)
}

export default function PrintJobsTable({ data, page, pageSize, onPageChange, userRole, onRowHover, printTypeFilter, hasMore }: PrintJobsTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'timestamp', direction: 'desc' })
  const [sortedData, setSortedData] = useState<any[]>([])

  useEffect(() => {
    // Apply print type filter first
    const filteredData = filterRowsByType(data, printTypeFilter || "all")
    
    // Convert filtered print jobs to display format
    const displayData = filteredData.map(convertPrintJobToDisplay)
    
    setSortedData(sortData(displayData, sortConfig))
  }, [data, sortConfig, printTypeFilter])

  const handleSort = (key: string) => {
    const newSortConfig = toggleSort(sortConfig, key)
    setSortConfig(newSortConfig)
  }

  const formatPrice = (price: number) => `€${price.toFixed(2).replace('.', ',')}`
  
  return (
    <div className="border rounded-lg">
      {/* Fixed (non-scrolling) header */}
      <Table className="min-w-full table-fixed">
        <PrintJobsColGroup userRole={userRole} />
        <TableHeader className="bg-gray-100">
          <TableRow>
            <SortableTableHeader
              sortKey="timestamp"
              currentSort={sortConfig}
              onSort={handleSort}
              variant="blue"
            >
              Ημερομηνία/Ώρα
            </SortableTableHeader>
            {userRole === "Διαχειριστής" && (
              <SortableTableHeader
                sortKey="username"
                currentSort={sortConfig}
                onSort={handleSort}
                variant="blue"
              >
                Χρήστης
              </SortableTableHeader>
            )}
            {userRole === "Διαχειριστής" && (
              <SortableTableHeader
                sortKey="userDisplayName"
                currentSort={sortConfig}
                onSort={handleSort}
                variant="blue"
              >
                Όνομα
              </SortableTableHeader>
            )}
            <SortableTableHeader
              sortKey="deviceName"
              currentSort={sortConfig}
              onSort={handleSort}
              variant="blue"
            >
              Εκτυπωτής
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="printType"
              currentSort={sortConfig}
              onSort={handleSort}
              variant="blue"
            >
              Είδος Εκτύπωσης
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="quantity"
              currentSort={sortConfig}
              onSort={handleSort}
              variant="blue"
            >
              Ποσότητα
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="cost"
              currentSort={sortConfig}
              onSort={handleSort}
              variant="blue"
            >
              Κόστος
            </SortableTableHeader>
          </TableRow>
        </TableHeader>
      </Table>

      {/* Scrollable body only */}
      <div className="max-h-[400px] overflow-y-auto">
        <Table className="min-w-full table-fixed">
          <PrintJobsColGroup userRole={userRole} />
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={userRole === "Διαχειριστής" ? 7 : 5} className="text-center py-8 text-gray-500">
                  Δεν βρέθηκαν αποτελέσματα
                </TableCell>
              </TableRow>
            ) : (
              sortedData.slice((page-1)*pageSize, page*pageSize).map((row: any) => (
                <TableRow 
                  key={row.rowId}
                  className="hover:bg-blue-50 cursor-pointer transition-colors duration-200"
                  onMouseEnter={() => onRowHover?.({ deviceName: row.deviceName, printType: row.printType })}
                  onMouseLeave={() => onRowHover?.(null)}
                >
                  <TableCell className="text-center">{row.timestamp.toLocaleString("el-GR")}</TableCell>
                  {userRole === "Διαχειριστής" && <TableCell className="text-center">{row.username}</TableCell>}
                  {userRole === "Διαχειριστής" && <TableCell className="text-center">{row.userDisplayName}</TableCell>}
                  <TableCell className="text-center">
                    <Badge variant="outline">{row.deviceName}</Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm">{row.printType}</TableCell>
                  <TableCell className="text-center">{row.quantity}</TableCell>
                  <TableCell className="text-center">{formatPrice(row.cost)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SimplePagination page={page} total={sortedData.length} pageSize={pageSize} onPageChange={onPageChange} hasMore={hasMore} />
    </div>
  )
} 