import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Pagination from "./pagination-helper"
import { SortableTableHeader } from "@/components/ui/sortable-table-header"
import { sortData, toggleSort, type SortConfig } from "@/lib/sort-utils"
import { useState, useEffect } from "react"
import type { LaminationJob } from "@/lib/dummy-database"

// Shared column definition for consistent widths
const LaminationJobsColGroup = ({ userRole }: { userRole: string }) => (
  <colgroup>
    <col style={{ width: "15%" }} />
    {userRole === "admin" && <col style={{ width: "12%" }} />}
    {userRole === "admin" && <col style={{ width: "15%" }} />}
    <col style={{ width: "15%" }} />
    <col style={{ width: "12%" }} />
    <col style={{ width: "12%" }} />
  </colgroup>
)

interface LaminationJobsTableProps {
  data: LaminationJob[]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  userRole: string
}

export default function LaminationJobsTable({ data, page, pageSize, onPageChange, userRole }: LaminationJobsTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [sortedData, setSortedData] = useState(data)

  useEffect(() => {
    setSortedData(sortData(data, sortConfig))
  }, [data, sortConfig])

  const handleSort = (key: string) => {
    const newSortConfig = toggleSort(sortConfig, key)
    setSortConfig(newSortConfig)
  }

  const getLaminationTypeLabel = (type: string) => {
    switch (type) {
      case "A3": return "A3"
      case "A4": return "A4"
      case "card_small": return "Κάρτα Μικρή"
      case "card_large": return "Κάρτα Μεγάλη"
      default: return type
    }
  }
  const formatPrice = (price: number) => `€${price.toFixed(2).replace('.', ',')}`
  
  return (
    <div className="border rounded-lg">
      {/* Fixed (non-scrolling) header */}
      <Table className="min-w-full table-fixed">
        <LaminationJobsColGroup userRole={userRole} />
        <TableHeader className="bg-gray-100">
          <TableRow>
            <SortableTableHeader
              sortKey="timestamp"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Ημερομηνία
            </SortableTableHeader>
            {userRole === "admin" && (
              <SortableTableHeader
                sortKey="uid"
                currentSort={sortConfig}
                onSort={handleSort}
              >
                Χρήστης (ID)
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
              sortKey="type"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Είδος
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="quantity"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Ποσότητα
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="totalCost"
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
          <LaminationJobsColGroup userRole={userRole} />
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={userRole === "admin" ? 6 : 4} className="text-center py-8 text-gray-500">
                  Δεν βρέθηκαν αποτελέσματα
                </TableCell>
              </TableRow>
            ) : (
              sortedData.slice((page-1)*pageSize, page*pageSize).map((job: LaminationJob) => (
                <TableRow key={job.jobId}>
                  <TableCell>{job.timestamp.toLocaleDateString("el-GR")}</TableCell>
                  {userRole === "admin" && <TableCell>{job.uid}</TableCell>}
                  {userRole === "admin" && <TableCell>{job.userDisplayName}</TableCell>}
                  <TableCell>
                    <Badge variant="outline">{getLaminationTypeLabel(job.type)}</Badge>
                  </TableCell>
                  <TableCell>{job.quantity}</TableCell>
                  <TableCell>{formatPrice(job.totalCost)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} total={sortedData.length} pageSize={pageSize} onPageChange={onPageChange} />
    </div>
  )
} 