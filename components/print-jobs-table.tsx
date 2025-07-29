import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SimplePagination } from "@/components/ui/pagination"
import { Calendar } from "lucide-react"
import { SortableTableHeader } from "@/components/ui/sortable-table-header"
import { sortData, toggleSort, type SortConfig } from "@/lib/sort-utils"
import { useState, useEffect } from "react"
import type { PrintJob } from "@/lib/dummy-database"

// Shared column definition for consistent widths
function PrintJobsColGroup({ userRole }: { userRole: string }) {
  return (
    <colgroup>
      <col className="w-[140px]" />
      {userRole === "admin" && <col className="w-[100px]" />}
      {userRole === "admin" && <col className="w-[120px]" />}
      <col className="w-[120px]" />
      <col className="w-[120px]" />
      <col className="w-[80px]" />
      <col className="w-[100px]" />
    </colgroup>
  )
}

interface PrintJobsTableProps {
  data: PrintJob[]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  userRole: string
  onRowHover?: (hoveredJob: { deviceName: string; printType: string } | null) => void
  printTypeFilter?: string // New prop for filtering expanded rows
}

// Helper function to expand a print job into individual rows
const expandPrintJob = (job: PrintJob) => {
  const rows = []
  
  if (job.pagesA4BW > 0) {
    rows.push({
      ...job,
      printType: "A4 Ασπρόμαυρο",
      quantity: job.pagesA4BW,
      cost: job.costA4BW, // Use the actual calculated cost from database
      originalJobId: job.jobId,
      rowId: `${job.jobId}-a4bw`
    })
  }
  
  if (job.pagesA4Color > 0) {
    rows.push({
      ...job,
      printType: "A4 Έγχρωμο",
      quantity: job.pagesA4Color,
      cost: job.costA4Color, // Use the actual calculated cost from database
      originalJobId: job.jobId,
      rowId: `${job.jobId}-a4color`
    })
  }
  
  if (job.pagesA3BW > 0) {
    rows.push({
      ...job,
      printType: "A3 Ασπρόμαυρο",
      quantity: job.pagesA3BW,
      cost: job.costA3BW, // Use the actual calculated cost from database
      originalJobId: job.jobId,
      rowId: `${job.jobId}-a3bw`
    })
  }
  
  if (job.pagesA3Color > 0) {
    rows.push({
      ...job,
      printType: "A3 Έγχρωμο",
      quantity: job.pagesA3Color,
      cost: job.costA3Color, // Use the actual calculated cost from database
      originalJobId: job.jobId,
      rowId: `${job.jobId}-a3color`
    })
  }
  
  if (job.pagesRizochartoA3 > 0) {
    rows.push({
      ...job,
      printType: "Ριζόχαρτο A3",
      quantity: job.pagesRizochartoA3,
      cost: job.costRizochartoA3, // Use the actual calculated cost from database
      originalJobId: job.jobId,
      rowId: `${job.jobId}-rizocharto-a3`
    })
  }
  
  if (job.pagesRizochartoA4 > 0) {
    rows.push({
      ...job,
      printType: "Ριζόχαρτο A4",
      quantity: job.pagesRizochartoA4,
      cost: job.costRizochartoA4, // Use the actual calculated cost from database
      originalJobId: job.jobId,
      rowId: `${job.jobId}-rizocharto-a4`
    })
  }
  
  if (job.pagesChartoniA3 > 0) {
    rows.push({
      ...job,
      printType: "Χαρτόνι A3",
      quantity: job.pagesChartoniA3,
      cost: job.costChartoniA3, // Use the actual calculated cost from database
      originalJobId: job.jobId,
      rowId: `${job.jobId}-chartoni-a3`
    })
  }
  
  if (job.pagesChartoniA4 > 0) {
    rows.push({
      ...job,
      printType: "Χαρτόνι A4",
      quantity: job.pagesChartoniA4,
      cost: job.costChartoniA4, // Use the actual calculated cost from database
      originalJobId: job.jobId,
      rowId: `${job.jobId}-chartoni-a4`
    })
  }
  
  if (job.pagesAutokollito > 0) {
    rows.push({
      ...job,
      printType: "Αυτοκόλλητο",
      quantity: job.pagesAutokollito,
      cost: job.costAutokollito, // Use the actual calculated cost from database
      originalJobId: job.jobId,
      rowId: `${job.jobId}-autokollito`
    })
  }
  
  return rows
}

// Helper function to filter expanded rows by print type
const filterExpandedRowsByType = (rows: any[], printTypeFilter: string) => {
  if (!printTypeFilter || printTypeFilter === "all") {
    return rows
  }
  
  const filterMap: { [key: string]: string } = {
    "a4BW": "A4 Ασπρόμαυρο",
    "a4Color": "A4 Έγχρωμο",
    "a3BW": "A3 Ασπρόμαυρο",
    "a3Color": "A3 Έγχρωμο",
    "rizochartoA3": "Ριζόχαρτο A3",
    "rizochartoA4": "Ριζόχαρτο A4",
    "chartoniA3": "Χαρτόνι A3",
    "chartoniA4": "Χαρτόνι A4",
    "autokollito": "Αυτοκόλλητο"
  }
  
  const targetPrintType = filterMap[printTypeFilter]
  if (!targetPrintType) {
    return rows
  }
  
  return rows.filter(row => row.printType === targetPrintType)
}

export default function PrintJobsTable({ data, page, pageSize, onPageChange, userRole, onRowHover, printTypeFilter }: PrintJobsTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [sortedData, setSortedData] = useState<any[]>([])

  useEffect(() => {
    // Expand each print job into individual rows
    const expandedData = data.flatMap(expandPrintJob)
    
    // Apply print type filter to expanded rows
    const filteredExpandedData = filterExpandedRowsByType(expandedData, printTypeFilter || "all")
    
    setSortedData(sortData(filteredExpandedData, sortConfig))
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
            >
              Ημερομηνία/Ώρα
            </SortableTableHeader>
            {userRole === "admin" && (
              <SortableTableHeader
                sortKey="username"
                currentSort={sortConfig}
                onSort={handleSort}
              >
                Χρήστης
              </SortableTableHeader>
            )}
            {userRole === "admin" && (
              <SortableTableHeader
                sortKey="userDisplayName"
                currentSort={sortConfig}
                onSort={handleSort}
              >
                Όνομα
              </SortableTableHeader>
            )}
            <SortableTableHeader
              sortKey="deviceName"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Εκτυπωτής
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="printType"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Είδος Εκτύπωσης
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="quantity"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Ποσότητα
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="cost"
              currentSort={sortConfig}
              onSort={handleSort}
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
                <TableCell colSpan={userRole === "admin" ? 7 : 5} className="text-center py-8 text-gray-500">
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
                  {userRole === "admin" && <TableCell className="text-center">{row.username}</TableCell>}
                  {userRole === "admin" && <TableCell className="text-center">{row.userDisplayName}</TableCell>}
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

      <SimplePagination page={page} total={sortedData.length} pageSize={pageSize} onPageChange={onPageChange} />
    </div>
  )
} 