import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SimplePagination } from "@/components/ui/pagination"
import { SortableTableHeader } from "@/components/ui/sortable-table-header"
import { sortData, toggleSort, type SortConfig } from "@/lib/sort-utils"
import { useState, useEffect } from "react"
import type { FirebaseLaminationJob } from "@/lib/firebase-schema"

// Shared column definition for consistent widths
const LaminationJobsColGroup = ({ userRole }: { userRole: string }) => (
  <colgroup>
    <col style={{ width: "15%" }} />
    {userRole === "Διαχειριστής" && <col style={{ width: "12%" }} />}
    {userRole === "Διαχειριστής" && <col style={{ width: "15%" }} />}
    <col style={{ width: "15%" }} />
    <col style={{ width: "12%" }} />
    <col style={{ width: "12%" }} />
  </colgroup>
)

interface LaminationJobsTableProps {
  data: FirebaseLaminationJob[]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  userRole: string
  onRowHover?: (hoveredJob: { machine: string; type: string } | null) => void
  hasMore?: boolean
}

export default function LaminationJobsTable({ data, page, pageSize, onPageChange, userRole, onRowHover, hasMore }: LaminationJobsTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'timestamp', direction: 'desc' })
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
              variant="green"
            >
              Ημερομηνία
            </SortableTableHeader>
            {userRole === "Διαχειριστής" && (
              <SortableTableHeader
                sortKey="username"
                currentSort={sortConfig}
                onSort={handleSort}
                variant="green"
              >
                Χρήστης
              </SortableTableHeader>
            )}
            {userRole === "Διαχειριστής" && (
              <SortableTableHeader
                sortKey="userDisplayName"
                currentSort={sortConfig}
                onSort={handleSort}
                variant="green"
              >
                Όνομα
              </SortableTableHeader>
            )}
            <SortableTableHeader
              sortKey="type"
              currentSort={sortConfig}
              onSort={handleSort}
              variant="green"
            >
              Είδος
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="quantity"
              currentSort={sortConfig}
              onSort={handleSort}
              variant="green"
            >
              Ποσότητα
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="totalCost"
              currentSort={sortConfig}
              onSort={handleSort}
              variant="green"
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
                <TableCell colSpan={userRole === "Διαχειριστής" ? 6 : 4} className="text-center py-8 text-gray-500">
                  Δεν βρέθηκαν αποτελέσματα
                </TableCell>
              </TableRow>
            ) : (
              sortedData.slice((page-1)*pageSize, page*pageSize).map((job: FirebaseLaminationJob) => {
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
                    {userRole === "Διαχειριστής" && <TableCell className="text-center">{job.username}</TableCell>}
                    {userRole === "Διαχειριστής" && <TableCell className="text-center">{job.userDisplayName}</TableCell>}
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

      <SimplePagination page={page} total={sortedData.length} pageSize={pageSize} onPageChange={onPageChange} hasMore={hasMore} />
    </div>
  )
} 