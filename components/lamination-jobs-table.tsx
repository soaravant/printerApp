import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SimplePagination } from "@/components/ui/pagination"
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
  onRowHover?: (hoveredJob: { machine: string; type: string } | null) => void
}

export default function LaminationJobsTable({ data, page, pageSize, onPageChange, userRole, onRowHover }: LaminationJobsTableProps) {
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
      case "A5": return "A5"
      case "cards": return "Κάρτες"
      case "spiral": return "Σπιράλ"
      case "colored_cardboard": return "Χρωματιστά Χαρτόνια"
      case "plastic_cover": return "Πλαστικό Κάλυμμα"
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
              sortedData.slice((page-1)*pageSize, page*pageSize).map((job: LaminationJob) => {
                // Determine machine type based on job type
                const machine = ["A3", "A4", "A5", "cards"].includes(job.type) ? "laminator" : "binding"
                
                return (
                  <TableRow 
                    key={job.jobId}
                    className="hover:bg-green-50 cursor-pointer transition-colors duration-200"
                    onMouseEnter={() => onRowHover?.({ machine, type: job.type })}
                    onMouseLeave={() => onRowHover?.(null)}
                  >
                    <TableCell className="text-center">{job.timestamp.toLocaleDateString("el-GR")}</TableCell>
                    {userRole === "admin" && <TableCell className="text-center">{job.username}</TableCell>}
                    {userRole === "admin" && <TableCell className="text-center">{job.userDisplayName}</TableCell>}
                    <TableCell className="text-center">
                      <Badge variant="outline">{getLaminationTypeLabel(job.type)}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{job.quantity}</TableCell>
                    <TableCell className="text-center">{formatPrice(job.totalCost)}</TableCell>
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