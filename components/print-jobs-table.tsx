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
  
  if (job.pagesRizocharto > 0) {
    rows.push({
      ...job,
      printType: "Ριζόχαρτο",
      quantity: job.pagesRizocharto,
      cost: job.costRizocharto, // Use the actual calculated cost from database
      originalJobId: job.jobId,
      rowId: `${job.jobId}-rizocharto`
    })
  }
  
  if (job.pagesChartoni > 0) {
    rows.push({
      ...job,
      printType: "Χαρτόνι",
      quantity: job.pagesChartoni,
      cost: job.costChartoni, // Use the actual calculated cost from database
      originalJobId: job.jobId,
      rowId: `${job.jobId}-chartoni`
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

export default function PrintJobsTable({ data, page, pageSize, onPageChange, userRole }: PrintJobsTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [sortedData, setSortedData] = useState<any[]>([])

  useEffect(() => {
    // Expand each print job into individual rows
    const expandedData = data.flatMap(expandPrintJob)
    setSortedData(sortData(expandedData, sortConfig))
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
                <TableRow key={row.rowId}>
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